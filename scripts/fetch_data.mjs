#!/usr/bin/env node
/**
 * SD Insights Data Fetcher (Node.js)
 * Refreshes FRED API data and CA EDD unemployment data.
 * Run with: node scripts/fetch_data.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

const FRED_KEY = 'a72b02db4318645167d222b3d497ae02';
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

function save(filename, data) {
  mkdirSync(DATA_DIR, { recursive: true });
  const path = join(DATA_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`  ✓ ${filename}`);
}

async function fredFetch(seriesId, limit = 1000) {
  const url = new URL(FRED_BASE);
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', FRED_KEY);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`FRED ${seriesId}: HTTP ${res.status}`);
  const json = await res.json();

  return (json.observations || [])
    .filter(o => o.value && o.value !== '.')
    .map(o => ({ date: o.date, value: parseFloat(o.value) }));
}

function calcChanges(obs) {
  if (obs.length < 2) return { mom: 0, yoy: 0 };
  const cur = obs[0].value;
  const prev = obs[1]?.value ?? cur;
  const year = obs[12]?.value ?? cur;
  return {
    mom: prev ? +((( cur - prev) / prev) * 100).toFixed(2) : 0,
    yoy: year ? +((( cur - year) / year) * 100).toFixed(2) : 0,
  };
}

// ──────────────────────────────────────────────
// 1. Lending Data
// ──────────────────────────────────────────────

async function fetchLendingData() {
  console.log('\nFetching lending data…');
  const [m30, m15, fed, t10, jumbo, fha, va, sdUnemp] = await Promise.all([
    fredFetch('MORTGAGE30US', 52),
    fredFetch('MORTGAGE15US', 52),
    fredFetch('FEDFUNDS', 12),
    fredFetch('DGS10', 52),
    fredFetch('OBMMIJUMBO30YF', 52),
    fredFetch('OBMMIFHA30YF', 52),
    fredFetch('OBMMIVA30YF', 52),
    fredFetch('CASAND5URN', 12),
  ]);

  const monthly30   = Object.fromEntries(m30.map(o => [o.date.slice(0,7), o.value]));
  const monthly15   = Object.fromEntries(m15.map(o => [o.date.slice(0,7), o.value]));
  const monthlyJumbo = Object.fromEntries(jumbo.map(o => [o.date.slice(0,7), o.value]));

  const allMonths = [...new Set([...Object.keys(monthly30), ...Object.keys(monthly15), ...Object.keys(monthlyJumbo)])]
    .sort().slice(-12);

  const rateHistory = allMonths.map(m => ({
    date: m,
    rate30: monthly30[m] ?? null,
    rate15: monthly15[m] ?? null,
    jumboRate: monthlyJumbo[m] ?? null,
  }));

  save('lending_data.json', {
    meta: {
      generated: new Date().toISOString(),
      source: 'FRED (Federal Reserve Economic Data)',
      lastUpdate: m30[0]?.date ?? null,
    },
    currentRates: {
      rate30:    m30[0]?.value   ?? 6.85,
      rate15:    m15[0]?.value   ?? 6.02,
      fedFunds:  fed[0]?.value   ?? 5.33,
      jumboRate: +(jumbo[0]?.value ?? 6.25).toFixed(2),
      fhaRate:   +(fha[0]?.value   ?? 5.58).toFixed(2),
      vaRate:    +(va[0]?.value    ?? 5.38).toFixed(2),
    },
    weekChange: {
      rate30: m30.length >= 2 ? +( m30[0].value - m30[1].value).toFixed(2) : 0,
      rate15: m15.length >= 2 ? +( m15[0].value - m15[1].value).toFixed(2) : 0,
    },
    rateHistory,
    loanLimits: { conforming: 806500, highBalance: 1077550, jumbo: 1077551, fha: 1077550 },
    sanDiego: { unemploymentRate: sdUnemp[0]?.value ?? 4.2 },
    treasury10yr: t10[0]?.value ?? 4.55,
  });
}

// ──────────────────────────────────────────────
// 2. Home Price Index helpers
// ──────────────────────────────────────────────

async function fetchHpiPair(saId, nsaId, description) {
  const [sa, nsa] = await Promise.all([fredFetch(saId), fredFetch(nsaId)]);

  const saMap  = Object.fromEntries(sa.map(o => [o.date, o.value]));
  const nsaMap = Object.fromEntries(nsa.map(o => [o.date, o.value]));
  const allDates = [...new Set([...Object.keys(saMap), ...Object.keys(nsaMap)])].sort();

  const history = allDates.map(d => ({
    date: d.slice(0, 7),
    sa:  saMap[d]  ?? null,
    nsa: nsaMap[d] ?? null,
  }));

  const saChanges  = calcChanges(sa);
  const nsaChanges = calcChanges(nsa);

  return {
    meta: {
      generated: new Date().toISOString(),
      source: 'FRED (S&P CoreLogic Case-Shiller)',
      lastUpdate: sa[0]?.date ?? null,
      description,
    },
    current: {
      seasonallyAdjusted:    { value: sa[0]  ? +sa[0].value.toFixed(2)  : null, date: sa[0]?.date  ?? null },
      notSeasonallyAdjusted: { value: nsa[0] ? +nsa[0].value.toFixed(2) : null, date: nsa[0]?.date ?? null },
    },
    changes: {
      monthOverMonth: { sa: saChanges.mom,  nsa: nsaChanges.mom },
      yearOverYear:   { sa: saChanges.yoy,  nsa: nsaChanges.yoy },
    },
    history,
  };
}

async function fetchHpiQuarterly(seriesId, description) {
  const obs = await fredFetch(seriesId);
  const cur = obs[0]?.value ?? null;
  const qoq = obs[1] ? +(((cur - obs[1].value) / obs[1].value) * 100).toFixed(2) : 0;
  const yoy = obs[4] ? +(((cur - obs[4].value) / obs[4].value) * 100).toFixed(2) : 0;

  const history = [...obs].sort((a, b) => a.date < b.date ? -1 : 1).map(o => ({
    date: o.date.slice(0, 7),
    sa: o.value,
    nsa: o.value,
  }));

  return {
    meta: {
      generated: new Date().toISOString(),
      source: 'FRED (FHFA)',
      lastUpdate: obs[0]?.date ?? null,
      description,
    },
    current: {
      seasonallyAdjusted:    { value: cur ? +cur.toFixed(2) : null, date: obs[0]?.date ?? null },
      notSeasonallyAdjusted: { value: cur ? +cur.toFixed(2) : null, date: obs[0]?.date ?? null },
    },
    changes: {
      monthOverMonth: { sa: qoq, nsa: qoq },
      yearOverYear:   { sa: yoy, nsa: yoy },
    },
    history,
  };
}

async function fetchAllHpi() {
  console.log('\nFetching home price index data…');
  const [sd, us, la, sj] = await Promise.all([
    fetchHpiPair('SDXRSA', 'SDXRNSA', 'S&P CoreLogic Case-Shiller CA-San Diego HPI (Jan 2000 = 100)'),
    fetchHpiPair('CSUSHPISA', 'CSUSHPINSA', 'S&P CoreLogic Case-Shiller U.S. National HPI (Jan 2000 = 100)'),
    fetchHpiPair('LXXRSA', 'LXXRNSA', 'S&P CoreLogic Case-Shiller CA-Los Angeles HPI (Jan 2000 = 100)'),
    fetchHpiQuarterly('ATNHPIUS41940Q', 'All-Transactions House Price Index for San Jose-Sunnyvale-Santa Clara, CA (NSA)'),
  ]);
  save('home_price_index.json', sd);
  save('us_home_price_index.json', us);
  save('la_home_price_index.json', la);
  save('sj_home_price_index.json', sj);
}

// ──────────────────────────────────────────────
// 3. Housing Supply (FRED ACTLISCOU6073)
// ──────────────────────────────────────────────

async function fetchSupplyData() {
  console.log('\nFetching housing supply data…');
  const obs = await fredFetch('ACTLISCOU6073', 120);
  const sorted = [...obs].sort((a, b) => a.date < b.date ? -1 : 1);

  let yoy = 0;
  if (sorted.length >= 13) {
    const cur  = sorted[sorted.length - 1].value;
    const prev = sorted[sorted.length - 13].value;
    yoy = prev ? +(((cur - prev) / prev) * 100).toFixed(2) : 0;
  }

  save('supply_fred.json', {
    meta: {
      generated: new Date().toISOString(),
      source: 'FRED (Federal Reserve Bank of St. Louis)',
      series_id: 'ACTLISCOU6073',
      title: 'Housing Inventory: Active Listing Count in San Diego County, CA',
      lastUpdate: sorted[sorted.length - 1]?.date ?? null,
    },
    summary: {
      current_value: sorted[sorted.length - 1]?.value ?? null,
      yoy_change: yoy,
    },
    history: sorted,
  });
}

// ──────────────────────────────────────────────
// 4. Unemployment (CA EDD LAUS)
// ──────────────────────────────────────────────

async function fetchUnemploymentData() {
  console.log('\nFetching unemployment data…');
  const url = new URL('https://data.ca.gov/api/3/action/datastore_search');
  url.searchParams.set('resource_id', 'b4bc4656-7866-420f-8d87-4eda4c9996ed');
  url.searchParams.set('limit', '36');
  url.searchParams.set('sort', 'Year desc, Month desc');
  url.searchParams.set('filters', JSON.stringify({ 'Area Name': 'San Diego County' }));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`EDD LAUS: HTTP ${res.status}`);
  const json = await res.json();

  if (!json.success) throw new Error('EDD LAUS: API returned error');

  const monthMap = {
    January:'01', February:'02', March:'03', April:'04',
    May:'05', June:'06', July:'07', August:'08',
    September:'09', October:'10', November:'11', December:'12',
  };

  const records = (json.result?.records ?? [])
    .filter(r => r.Year && r.Month && r['Unemployment Rate'])
    .map(r => ({
      date: `${r.Year}-${monthMap[r.Month] ?? '01'}`,
      rate: parseFloat(r['Unemployment Rate']),
    }))
    .sort((a, b) => a.date < b.date ? -1 : 1);

  save('unemployment_data.json', {
    meta: {
      generated: new Date().toISOString(),
      source: 'California EDD - Local Area Unemployment Statistics (LAUS)',
      area: 'San Diego County',
      lastUpdate: records[records.length - 1]?.date ?? null,
    },
    currentRate: records[records.length - 1]?.rate ?? null,
    history: records,
  });
}

// ──────────────────────────────────────────────
// 5. WARN Data (EDD Excel — minimal Node.js parse)
// ──────────────────────────────────────────────

// SD zip→region mapping (subset for assignment)
const SD_ZIP_INFO = {
  '92037': { region: 'Coastal',              neighborhood: 'La Jolla',            city: 'San Diego' },
  '92014': { region: 'Coastal',              neighborhood: 'Del Mar',             city: 'Del Mar' },
  '92075': { region: 'Coastal',              neighborhood: 'Solana Beach',        city: 'Solana Beach' },
  '92024': { region: 'Coastal',              neighborhood: 'Encinitas',           city: 'Encinitas' },
  '92007': { region: 'Coastal',              neighborhood: 'Cardiff',             city: 'Encinitas' },
  '92008': { region: 'Coastal',              neighborhood: 'Carlsbad West',       city: 'Carlsbad' },
  '92109': { region: 'Coastal',              neighborhood: 'Pacific Beach',       city: 'San Diego' },
  '92107': { region: 'Coastal',              neighborhood: 'Ocean Beach',         city: 'San Diego' },
  '92106': { region: 'Coastal',              neighborhood: 'Point Loma',          city: 'San Diego' },
  '92118': { region: 'Coastal',              neighborhood: 'Coronado',            city: 'Coronado' },
  '92110': { region: 'Coastal',              neighborhood: 'Bay Park',            city: 'San Diego' },
  '92054': { region: 'Coastal',              neighborhood: 'Oceanside',           city: 'Oceanside' },
  '92056': { region: 'Coastal',              neighborhood: 'Oceanside',           city: 'Oceanside' },
  '92057': { region: 'Coastal',              neighborhood: 'Oceanside',           city: 'Oceanside' },
  '92058': { region: 'Coastal',              neighborhood: 'Oceanside',           city: 'Oceanside' },
  '92101': { region: 'Urban San Diego',      neighborhood: 'Downtown',            city: 'San Diego' },
  '92102': { region: 'Urban San Diego',      neighborhood: 'Golden Hill',         city: 'San Diego' },
  '92103': { region: 'Urban San Diego',      neighborhood: 'Hillcrest',           city: 'San Diego' },
  '92104': { region: 'Urban San Diego',      neighborhood: 'North Park',          city: 'San Diego' },
  '92105': { region: 'Urban San Diego',      neighborhood: 'City Heights',        city: 'San Diego' },
  '92113': { region: 'Urban San Diego',      neighborhood: 'Logan Heights',       city: 'San Diego' },
  '92116': { region: 'Urban San Diego',      neighborhood: 'Normal Heights',      city: 'San Diego' },
  '92108': { region: 'Central San Diego',    neighborhood: 'Mission Valley',      city: 'San Diego' },
  '92111': { region: 'Central San Diego',    neighborhood: 'Linda Vista',         city: 'San Diego' },
  '92114': { region: 'Central San Diego',    neighborhood: 'Encanto',             city: 'San Diego' },
  '92115': { region: 'Central San Diego',    neighborhood: 'College Area',        city: 'San Diego' },
  '92117': { region: 'Central San Diego',    neighborhood: 'Clairemont',          city: 'San Diego' },
  '92119': { region: 'Central San Diego',    neighborhood: 'San Carlos',          city: 'San Diego' },
  '92120': { region: 'Central San Diego',    neighborhood: 'Grantville',          city: 'San Diego' },
  '92121': { region: 'Central San Diego',    neighborhood: 'Sorrento Valley',     city: 'San Diego' },
  '92122': { region: 'Central San Diego',    neighborhood: 'University City',     city: 'San Diego' },
  '92123': { region: 'Central San Diego',    neighborhood: 'Kearny Mesa',         city: 'San Diego' },
  '92124': { region: 'Central San Diego',    neighborhood: 'Tierrasanta',         city: 'San Diego' },
  '92126': { region: 'Central San Diego',    neighborhood: 'Mira Mesa',           city: 'San Diego' },
  '92129': { region: 'Central San Diego',    neighborhood: 'Rancho Peñasquitos',  city: 'San Diego' },
  '92130': { region: 'Central San Diego',    neighborhood: 'Carmel Valley',       city: 'San Diego' },
  '92131': { region: 'Central San Diego',    neighborhood: 'Scripps Ranch',       city: 'San Diego' },
  '92127': { region: 'Central San Diego',    neighborhood: 'Del Sur / 4S Ranch',  city: 'San Diego' },
  '92128': { region: 'Central San Diego',    neighborhood: 'Rancho Bernardo',     city: 'San Diego' },
  '92067': { region: 'Central San Diego',    neighborhood: 'Rancho Santa Fe',     city: 'Rancho Santa Fe' },
  '92009': { region: 'North County Inland',  neighborhood: 'Carlsbad East',       city: 'Carlsbad' },
  '92010': { region: 'North County Inland',  neighborhood: 'Carlsbad',            city: 'Carlsbad' },
  '92011': { region: 'North County Inland',  neighborhood: 'Carlsbad',            city: 'Carlsbad' },
  '92025': { region: 'North County Inland',  neighborhood: 'Escondido',           city: 'Escondido' },
  '92026': { region: 'North County Inland',  neighborhood: 'Escondido',           city: 'Escondido' },
  '92027': { region: 'North County Inland',  neighborhood: 'Escondido',           city: 'Escondido' },
  '92028': { region: 'North County Inland',  neighborhood: 'Fallbrook',           city: 'Fallbrook' },
  '92029': { region: 'North County Inland',  neighborhood: 'Escondido',           city: 'Escondido' },
  '92064': { region: 'North County Inland',  neighborhood: 'Poway',               city: 'Poway' },
  '92065': { region: 'North County Inland',  neighborhood: 'Ramona',              city: 'Ramona' },
  '92069': { region: 'North County Inland',  neighborhood: 'San Marcos',          city: 'San Marcos' },
  '92078': { region: 'North County Inland',  neighborhood: 'San Marcos',          city: 'San Marcos' },
  '92081': { region: 'North County Inland',  neighborhood: 'Vista',               city: 'Vista' },
  '92083': { region: 'North County Inland',  neighborhood: 'Vista',               city: 'Vista' },
  '92084': { region: 'North County Inland',  neighborhood: 'Vista',               city: 'Vista' },
  '91901': { region: 'East County',          neighborhood: 'Alpine',              city: 'Alpine' },
  '91941': { region: 'East County',          neighborhood: 'La Mesa',             city: 'La Mesa' },
  '91942': { region: 'East County',          neighborhood: 'La Mesa',             city: 'La Mesa' },
  '92019': { region: 'East County',          neighborhood: 'El Cajon',            city: 'El Cajon' },
  '92020': { region: 'East County',          neighborhood: 'El Cajon',            city: 'El Cajon' },
  '92021': { region: 'East County',          neighborhood: 'El Cajon',            city: 'El Cajon' },
  '92040': { region: 'East County',          neighborhood: 'Lakeside',            city: 'Lakeside' },
  '92071': { region: 'East County',          neighborhood: 'Santee',              city: 'Santee' },
  '91902': { region: 'South County',         neighborhood: 'Bonita',              city: 'Bonita' },
  '91910': { region: 'South County',         neighborhood: 'Chula Vista',         city: 'Chula Vista' },
  '91911': { region: 'South County',         neighborhood: 'Chula Vista',         city: 'Chula Vista' },
  '91913': { region: 'South County',         neighborhood: 'Eastlake',            city: 'Chula Vista' },
  '91914': { region: 'South County',         neighborhood: 'Eastlake',            city: 'Chula Vista' },
  '91915': { region: 'South County',         neighborhood: 'Otay Ranch',          city: 'Chula Vista' },
  '91932': { region: 'South County',         neighborhood: 'Imperial Beach',      city: 'Imperial Beach' },
  '91945': { region: 'South County',         neighborhood: 'Lemon Grove',         city: 'Lemon Grove' },
  '91950': { region: 'South County',         neighborhood: 'National City',       city: 'National City' },
  '91977': { region: 'South County',         neighborhood: 'Spring Valley',       city: 'Spring Valley' },
  '91978': { region: 'South County',         neighborhood: 'Spring Valley',       city: 'Spring Valley' },
  '92154': { region: 'South County',         neighborhood: 'Otay Mesa',           city: 'San Diego' },
  '92173': { region: 'South County',         neighborhood: 'San Ysidro',          city: 'San Diego' },
};

function getZipInfo(zip) {
  return SD_ZIP_INFO[String(zip).slice(0, 5)] ?? { region: 'San Diego County', neighborhood: 'San Diego', city: 'San Diego' };
}

function calcRiskScore(employees, noticeType) {
  let score = Math.min(100, Math.floor(employees / 5));
  const t = (noticeType || '').toLowerCase();
  if (t.includes('closure'))   score = Math.min(100, score + 20);
  if (t.includes('relocation')) score = Math.min(100, score + 15);
  const level = score >= 70 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low';
  return { score, level };
}

function parseAddress(addr) {
  if (!addr || addr === 'nan') return { city: 'San Diego', zip: '92101' };
  const zipMatch = addr.match(/\b(\d{5})(?:-\d{4})?\s*$/);
  const zip = zipMatch ? zipMatch[1] : '92101';
  const cityMatch = addr.match(/([A-Za-z\s]+?)(?:,?\s+CA)\s+\d{5}/);
  let city = 'San Diego';
  if (cityMatch) {
    city = cityMatch[1].trim().replace(/\s+/g, ' ');
    // Strip trailing street suffixes
    if (/\b(blvd|st|ave|dr|rd|way|ln|pl|ct)\s*$/i.test(city)) {
      const parts = city.split(/\s+/);
      city = parts.length > 1 ? parts.slice(-2).join(' ') : parts[0];
    }
  }
  return { city, zip };
}

// Parse .xlsx: it's a ZIP containing XML. Returns a map of filename → XML string.
async function parseXlsx(buffer) {
  const { inflateRaw } = await import('node:zlib');
  const { promisify } = await import('node:util');
  const inflate = promisify(inflateRaw);
  const buf = Buffer.from(buffer);
  const entries = {};
  let offset = 0;
  while (offset < buf.length - 4) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) { offset++; continue; }
    const compression  = buf.readUInt16LE(offset + 8);
    const compressedSize = buf.readUInt32LE(offset + 18);
    const filenameLen  = buf.readUInt16LE(offset + 26);
    const extraLen     = buf.readUInt16LE(offset + 28);
    const filename = buf.slice(offset + 30, offset + 30 + filenameLen).toString('utf8');
    const dataStart = offset + 30 + filenameLen + extraLen;
    const compressed = buf.slice(dataStart, dataStart + compressedSize);
    if (filename.endsWith('.xml') || filename.endsWith('.rels')) {
      try {
        entries[filename] = compression === 8
          ? (await inflate(compressed)).toString('utf8')
          : compressed.toString('utf8');
      } catch (_) { /* skip */ }
    }
    offset = dataStart + compressedSize;
  }
  return entries;
}

async function fetchWarnData() {
  console.log('\nFetching WARN data…');
  const res = await fetch('https://edd.ca.gov/siteassets/files/jobs_and_training/warn/warn_report1.xlsx');
  if (!res.ok) throw new Error(`WARN download: HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();
  const entries = await parseXlsx(buffer);

  // Parse shared strings — group by <si> element and concatenate all <t> runs within each
  const sstXml = entries['xl/sharedStrings.xml'] ?? '';
  const ss = [];
  for (const siMatch of sstXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const texts = [...siMatch[1].matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map(m => m[1]);
    ss.push(
      texts.join('')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
        .replace(/&#xD;/g, '\r').replace(/&#xA;/g, '\n')
        .replace(/&#10;/g, '\n').replace(/&#13;/g, '\r')
    );
  }

  // Locate the "Detailed WARN Report" sheet
  const workbookXml = entries['xl/workbook.xml'] ?? '';
  const relsXml = entries['xl/_rels/workbook.xml.rels'] ?? '';
  const sheetMatches = [...workbookXml.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]*)"/g)];
  let targetSheetPath = null;
  for (const [, name, rId] of sheetMatches) {
    if (name.toLowerCase().includes('detail')) {
      const m = relsXml.match(new RegExp(`Id="${rId}"[^>]*Target="([^"]*)"`));
      if (m) { targetSheetPath = `xl/${m[1]}`; break; }
    }
  }
  if (!targetSheetPath || !entries[targetSheetPath]) {
    console.warn('  Could not locate worksheet XML');
    return;
  }

  // Parse rows — use cell ref attribute (e.g. "r="A5"") for column assignment
  const sheetXml = entries[targetSheetPath];
  function colLetterToIndex(letters) {
    let idx = 0;
    for (let i = 0; i < letters.length; i++) idx = idx * 26 + (letters.charCodeAt(i) - 64);
    return idx - 1; // 0-based
  }

  const rows = new Map(); // rowNum → {colIdx: value}
  for (const cellMatch of sheetXml.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g)) {
    const colLetters = cellMatch[1];
    const rowNum = parseInt(cellMatch[2]);
    const attrs = cellMatch[3];
    const inner = cellMatch[4];
    const type = (attrs.match(/t="([^"]*)"/) || [])[1] || '';
    const vm = inner.match(/<v>([^<]*)<\/v>/);
    let val = vm ? vm[1] : '';
    if (type === 's') val = ss[parseInt(val)] ?? '';
    const isMatch = inner.match(/<is><t>([^<]*)<\/t><\/is>/);
    if (isMatch) val = isMatch[1];

    if (!rows.has(rowNum)) rows.set(rowNum, {});
    rows.get(rowNum)[colLetterToIndex(colLetters)] = val;
  }

  // Column layout (from header row 2):
  // A(0)=County/Parish, B(1)=NoticeDate, C(2)=ProcessedDate, D(3)=EffectiveDate,
  // E(4)=Company, F(5)=Layoff/Closure, G(6)=No.OfEmployees, H(7)=Address, I(8)=RelatedIndustry
  const COL = { county:0, company:4, type:5, employees:6, address:7, date:3 };

  const notices = [];
  const riskScores = {};
  const byRegion = {};
  let totalEmployees = 0;

  for (const [rowNum, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    if (rowNum <= 2) continue; // skip description + header rows
    const county = String(row[COL.county] ?? '').toLowerCase();
    if (!county.includes('san diego')) continue;

    const company = String(row[COL.company] ?? '').trim();
    if (!company) continue;

    const address    = String(row[COL.address]   ?? '');
    const noticeType = String(row[COL.type]      ?? 'Layoff').trim();
    const empRaw     = row[COL.employees];
    const employees  = empRaw !== undefined ? (parseInt(String(empRaw)) || 0) : 0;

    // Effective date: Excel serial number → ISO date
    const rawDate = row[COL.date];
    let layoffDate;
    if (rawDate !== undefined) {
      const serial = parseFloat(String(rawDate));
      if (!isNaN(serial) && serial > 40000) {
        layoffDate = new Date((serial - 25569) * 86400000).toISOString().slice(0, 10);
      } else {
        const d = new Date(rawDate);
        layoffDate = isNaN(d) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
      }
    } else {
      layoffDate = new Date().toISOString().slice(0, 10);
    }

    const { city, zip } = parseAddress(address);
    const zipInfo = getZipInfo(zip);
    const { score, level } = calcRiskScore(employees, noticeType);

    let h = 0;
    const idBase = `${company}${zipInfo.city}${layoffDate}`;
    for (let c = 0; c < idBase.length; c++) h = (Math.imul(31, h) + idBase.charCodeAt(c)) | 0;
    const noticeId = Math.abs(h).toString(16).padStart(8, '0');

    notices.push({
      notice_id: noticeId,
      company_name: company,
      city: zipInfo.city,
      zipcode: zip,
      employees_affected: employees,
      layoff_date: layoffDate,
      notice_type: noticeType,
      region: zipInfo.region,
      neighborhood: zipInfo.neighborhood,
    });

    totalEmployees += employees;

    if (!riskScores[zip]) {
      riskScores[zip] = { score, risk_level: level, total_employees: employees, factors: [] };
    } else {
      riskScores[zip].total_employees += employees;
      const recalc = calcRiskScore(riskScores[zip].total_employees, noticeType);
      riskScores[zip].score = recalc.score;
      riskScores[zip].risk_level = recalc.level;
    }

    if (employees > 0 && !riskScores[zip].factors.includes(`${employees} employees affected`)) {
      riskScores[zip].factors.push(`${employees} employees affected`);
    }
    if (noticeType.toLowerCase().includes('closure') && !riskScores[zip].factors.includes('Plant closure')) {
      riskScores[zip].factors.push('Plant closure');
    }
    if (noticeType.toLowerCase().includes('relocation') && !riskScores[zip].factors.includes('Relocation out of area')) {
      riskScores[zip].factors.push('Relocation out of area');
    }

    const region = zipInfo.region;
    if (!byRegion[region]) byRegion[region] = { notice_count: 0, total_employees: 0 };
    byRegion[region].notice_count++;
    byRegion[region].total_employees += employees;
  }

  save('warn_data.json', {
    meta: {
      generated: new Date().toISOString(),
      county: 'San Diego',
      total_notices: notices.length,
      total_employees_affected: totalEmployees,
    },
    notices,
    risk_scores: riskScores,
    by_region: byRegion,
  });

  console.log(`  ${notices.length} SD notices, ${totalEmployees} employees`);
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  console.log('SD Insights — Data Refresh');
  console.log('==========================');

  const tasks = [
    { name: 'lending',       fn: fetchLendingData },
    { name: 'HPI',           fn: fetchAllHpi },
    { name: 'supply',        fn: fetchSupplyData },
    { name: 'unemployment',  fn: fetchUnemploymentData },
    { name: 'WARN',          fn: fetchWarnData },
  ];

  let errors = 0;
  for (const { name, fn } of tasks) {
    try {
      await fn();
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n${ errors === 0 ? '✓ All data refreshed.' : `Done with ${errors} error(s).` }`);
}

main().catch(err => { console.error(err); process.exit(1); });
