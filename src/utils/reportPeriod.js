import { createContext, useContext } from 'react';

// Derives every month label a dashboard needs from the data files'
// meta.report_period (e.g. "June 2026"), so a new month of data relabels
// the UI automatically. DEFAULT_PERIOD only covers the pre-fetch flash.
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export const DEFAULT_PERIOD = 'June 2026';

export function parseReportPeriod(period) {
    const src = period || DEFAULT_PERIOD;
    const [name, yearStr] = src.split(' ');
    const idx = MONTHS.indexOf(name);
    const year = parseInt(yearStr, 10);
    if (idx < 0 || Number.isNaN(year)) return parseReportPeriod(DEFAULT_PERIOD);
    const mm = String(idx + 1).padStart(2, '0');
    return {
        monthName: name,                            // "June"
        year,                                       // 2026
        label: `${name} ${year}`,                   // "June 2026"
        prevLabel: `${name} ${year - 1}`,           // "June 2025"
        upper: `${name.toUpperCase()} ${year}`,     // "JUNE 2026"
        curTag: `${mm}-${year}`,                    // "06-2026"
        prevTag: `${mm}-${year - 1}`,               // "06-2025"
        ytd: `Jan–${name} ${year} (vs Jan–${name} ${year - 1})`,
        // SDAR publishes each report on the 5th of the following month.
        asOf: `${MONTHS[(idx + 1) % 12]} 5, ${idx === 11 ? year + 1 : year}`,
    };
}

export const PeriodContext = createContext(parseReportPeriod(DEFAULT_PERIOD));
export const useReportPeriod = () => useContext(PeriodContext);
