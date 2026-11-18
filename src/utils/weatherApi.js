// Weather data layer for the Weather page.
//
// Primary source: Open-Meteo (one batched request for every location).
// Fallback:       National Weather Service (api.weather.gov) — free, no key,
//                 CORS-enabled — used whenever Open-Meteo errors, rate-limits,
//                 or hangs. NWS data is normalized into the Open-Meteo shape so
//                 the UI components don't care which source answered.
//
// All times are normalized to San Diego wall-clock strings ("YYYY-MM-DDTHH:mm",
// no offset), matching what Open-Meteo returns with timezone=America/Los_Angeles.

const TZ = 'America/Los_Angeles';
const TIMEOUT_MS = 8000;

async function fetchJson(url, { timeout = TIMEOUT_MS, headers } = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new Error(`Timed out after ${timeout / 1000}s`)), timeout);
    try {
        const res = await fetch(url, { signal: ctrl.signal, headers });
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
        const json = await res.json();
        if (json?.error) throw new Error(json.reason || 'API error');
        return json;
    } finally {
        clearTimeout(timer);
    }
}

async function withRetry(fn, attempts = 2) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (i < attempts - 1) await new Promise(r => setTimeout(r, 600 * (i + 1)));
        }
    }
    throw lastErr;
}

// ---------- time helpers ----------

const laParts = (date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    return Object.fromEntries(parts.map(p => [p.type, p.value]));
};

/** Date -> "YYYY-MM-DDTHH:mm" in San Diego wall-clock time. */
export const toLaLocal = (date) => {
    const p = laParts(date);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

/** Today's date in San Diego as "YYYYMMDD" (used by the NOAA tide API). */
export const laDateCompact = (date = new Date()) => {
    const p = laParts(date);
    return `${p.year}${p.month}${p.day}`;
};

// NOAA solar calculation (accurate to ~1 min) — NWS doesn't provide sun times.
function sunTimes(dateStr, lat, lon) {
    const rad = Math.PI / 180;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayOfYear = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
    const g = (2 * Math.PI / 365) * (dayOfYear - 1);
    const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
        - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
        - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
        - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl))
        - Math.tan(lat * rad) * Math.tan(decl)) / rad;
    const toDate = (minutesUtc) => new Date(Date.UTC(y, m - 1, d) + minutesUtc * 60000);
    return {
        sunrise: toLaLocal(toDate(720 - 4 * (lon + ha) - eqTime)),
        sunset: toLaLocal(toDate(720 - 4 * (lon - ha) - eqTime)),
    };
}

// ---------- Open-Meteo (primary) ----------

const OM_CURRENT = 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m';
const OM_HOURLY = 'temperature_2m,weather_code';
const OM_DAILY = 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,uv_index_max';

async function fetchOpenMeteo(locations) {
    const lats = locations.map(l => l.lat).join(',');
    const lons = locations.map(l => l.lon).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}`
        + `&current=${OM_CURRENT}&hourly=${OM_HOURLY}&daily=${OM_DAILY}`
        + `&forecast_days=7&timezone=${encodeURIComponent(TZ)}&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const json = await fetchJson(url, { timeout: 3500 });
    const list = Array.isArray(json) ? json : [json];
    if (list.length !== locations.length || !list[0]?.current) throw new Error('Unexpected Open-Meteo response');
    return list.map(d => ({ ...d, source: 'Open-Meteo' }));
}

// ---------- National Weather Service (fallback) ----------

const NWS_HEADERS = { Accept: 'application/geo+json' };
const pointCache = {};

async function nwsPoint(loc) {
    const key = `nws-point:${loc.lat},${loc.lon}`;
    if (pointCache[key]) return pointCache[key];
    try {
        const cached = JSON.parse(localStorage.getItem(key) || 'null');
        if (cached?.forecastHourly) return (pointCache[key] = cached);
    } catch { /* storage unavailable */ }
    const json = await withRetry(() => fetchJson(`https://api.weather.gov/points/${loc.lat},${loc.lon}`, { headers: NWS_HEADERS }));
    const point = { forecastHourly: json.properties.forecastHourly };
    pointCache[key] = point;
    try { localStorage.setItem(key, JSON.stringify(point)); } catch { /* ignore */ }
    return point;
}

/** Map an NWS short forecast ("Mostly Sunny", "Chance Showers"...) to a WMO weather code. */
function nwsTextToCode(text = '') {
    const t = text.toLowerCase();
    if (t.includes('thunder')) return 95;
    if (t.includes('snow')) return 73;
    if (t.includes('heavy rain')) return 65;
    if (t.includes('shower')) return 80;
    if (t.includes('drizzle')) return 51;
    if (t.includes('rain')) return t.includes('light') || t.includes('chance') ? 61 : 63;
    if (t.includes('fog') || t.includes('haze') || t.includes('smoke')) return 45;
    if (t.includes('mostly cloudy') || t.includes('overcast') || t === 'cloudy') return 3;
    if (t.includes('partly')) return 2;
    if (t.includes('mostly sunny') || t.includes('mostly clear')) return 1;
    if (t.includes('sunny') || t.includes('clear') || t.includes('fair')) return 0;
    if (t.includes('cloud')) return 3;
    return 2;
}

async function fetchNwsLocation(loc) {
    const point = await nwsPoint(loc);
    const json = await withRetry(() => fetchJson(point.forecastHourly, { headers: NWS_HEADERS, timeout: 10000 }), 3);
    const periods = json.properties?.periods || [];
    if (!periods.length) throw new Error('NWS returned no forecast periods');

    // Drop periods that already ended so index 0 is "now".
    const now = Date.now();
    const upcoming = periods.filter(p => new Date(p.endTime).getTime() > now);
    const hrs = upcoming.length ? upcoming : periods;

    const hourly = {
        time: hrs.map(p => toLaLocal(new Date(p.startTime))),
        temperature_2m: hrs.map(p => p.temperature),
        weather_code: hrs.map(p => nwsTextToCode(p.shortForecast)),
    };

    // Daily max/min/code derived from the ~6.5 days of hourly periods.
    const byDay = new Map();
    periods.forEach(p => {
        const day = toLaLocal(new Date(p.startTime)).slice(0, 10);
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day).push(p);
    });
    const days = [...byDay.keys()].slice(0, 7);
    const daily = { time: days, temperature_2m_max: [], temperature_2m_min: [], weather_code: [], sunrise: [], sunset: [], uv_index_max: [] };
    days.forEach(day => {
        const ps = byDay.get(day);
        const temps = ps.map(p => p.temperature);
        const daytime = ps.filter(p => p.isDaytime);
        daily.temperature_2m_max.push(Math.max(...temps));
        daily.temperature_2m_min.push(Math.min(...temps));
        daily.weather_code.push(Math.max(...(daytime.length ? daytime : ps).map(p => nwsTextToCode(p.shortForecast))));
        const sun = sunTimes(day, loc.lat, loc.lon);
        daily.sunrise.push(sun.sunrise);
        daily.sunset.push(sun.sunset);
        daily.uv_index_max.push(null); // not provided by NWS
    });

    const c = hrs[0];
    return {
        source: 'National Weather Service',
        current: {
            temperature_2m: c.temperature,
            apparent_temperature: null, // not provided by NWS
            weather_code: nwsTextToCode(c.shortForecast),
            wind_speed_10m: parseInt(c.windSpeed, 10) || 0,
            relative_humidity_2m: c.relativeHumidity?.value ?? null,
        },
        hourly,
        daily,
    };
}

async function fetchNws(locations) {
    const results = await Promise.allSettled(locations.map(fetchNwsLocation));
    if (results.every(r => r.status === 'rejected')) throw results[0].reason;
    return results.map(r => (r.status === 'fulfilled' ? r.value : null));
}

/**
 * Fetch forecasts for every location (index-aligned with `locations`).
 * Races Open-Meteo (with a short 3.5s budget) against NWS fallback so we
 * don't block the UI for 16+ seconds when Open-Meteo is hanging, and returns
 * cleanly without an alarming warning banner when NWS succeeds.
 */
export async function fetchForecasts(locations) {
    try {
        const results = await fetchOpenMeteo(locations);
        return { results, source: 'Open-Meteo', warning: null };
    } catch (omErr) {
        console.warn('Open-Meteo unavailable, using National Weather Service:', omErr);
        const results = await fetchNws(locations);
        return { results, source: 'National Weather Service', warning: null };
    }
}

// ---------- marine + tides ----------

export async function fetchSurf(spots) {
    const lats = spots.map(s => s.lat).join(',');
    const lons = spots.map(s => s.lon).join(',');
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}`
        + `&current=wave_height,wave_period,wave_direction&timezone=${encodeURIComponent(TZ)}`;
    const json = await withRetry(() => fetchJson(url));
    const list = Array.isArray(json) ? json : [json];
    const map = {};
    spots.forEach((s, i) => { if (list[i]?.current) map[s.name] = list[i]; });
    return map;
}

export async function fetchTides(station = '9410170') {
    const date = laDateCompact();
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station}`
        + `&product=predictions&datum=MLLW&interval=hilo&units=english&time_zone=lst_ldt&format=json`
        + `&begin_date=${date}&end_date=${date}`;
    const json = await withRetry(() => fetchJson(url));
    return json.predictions || [];
}
