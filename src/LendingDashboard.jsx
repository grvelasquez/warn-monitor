import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Home, Users, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, BarChart2, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart, ReferenceLine, Legend } from 'recharts';

// Default static data as fallback
const defaultData = {
    currentRates: { rate30: 6.85, rate15: 6.02, rateARM: 6.18, jumboRate: 7.12, fhaRate: 6.45, vaRate: 6.25, fedFunds: 5.33 },
    weekChange: { rate30: 0, rate15: 0, rateARM: 0 },
    rateHistory: [],
    loanLimits: { conforming: 806500, highBalance: 1077550, jumbo: 1077551, fha: 1077550 },
    sanDiego: { unemploymentRate: 4.2 }
};



// Format functions
const formatPercent = (val) => val !== undefined && val !== null ? `${val.toFixed(2)}%` : 'N/A';
const formatCurrency = (val) => `$${val.toLocaleString()}`;
const formatChange = (val) => {
    if (val > 0) return `+${val.toFixed(2)}%`;
    if (val < 0) return `${val.toFixed(2)}%`;
    return '0.00%';
};
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year.slice(2)}`;
};

function RateCard({ title, rate, change, icon: Icon, color, subtitle }) {
    const isPositive = change > 0;
    const isNeutral = change === 0;

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between">
                <div className={`p-2 ${color} rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                {!isNeutral && (
                    <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-red-400' : 'text-green-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {formatChange(change)}
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="text-3xl font-bold text-white tracking-tight">{formatPercent(rate)}</p>
                <p className="text-sm text-slate-400 mt-1">{title}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtext, trend, format = 'number' }) {
    const formattedValue = format === 'currency' ? formatCurrency(value) :
        format === 'percent' ? formatPercent(value) :
            value.toLocaleString();

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold text-white mt-1">{formattedValue}</p>
            {subtext && <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>}
            {trend !== undefined && (
                <p className={`text-xs mt-1 ${trend > 0 ? 'text-red-400' : trend < 0 ? 'text-green-400' : 'text-slate-500'}`}>
                    {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% from last month
                </p>
            )}
        </div>
    );
}

function KeyIndicatorsPanel({ homePriceData, unemploymentData, lendingData, formatPercent }) {
    const caseShillerValue = homePriceData?.current?.seasonallyAdjusted?.value;
    const caseShillerChange = homePriceData?.changes?.yearOverYear?.sa;
    const caseShillerDate = homePriceData?.current?.seasonallyAdjusted?.date;
    const unemploymentRate = unemploymentData?.currentRate || lendingData?.sanDiego?.unemploymentRate || 4.2;
    const unemploymentDate = unemploymentData?.meta?.lastUpdate;
    const fedFundsRate = lendingData?.currentRates?.fedFunds || 5.33;

    return (
        <div className="space-y-4">
            {/* Case Shiller Index */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Case-Shiller Index</p>
                <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-orange-400">
                        {caseShillerValue ? caseShillerValue.toFixed(1) : 'N/A'}
                    </p>
                    {caseShillerChange !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded ${caseShillerChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {caseShillerChange >= 0 ? '+' : ''}{caseShillerChange}% YoY
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-1">S&P CoreLogic U.S. National • {caseShillerDate || 'Updated monthly'}</p>
            </div>

            {/* SD Unemployment */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">SD Unemployment Rate</p>
                <p className="text-2xl font-bold text-blue-400">{formatPercent(unemploymentRate)}</p>
                <p className="text-xs text-slate-500 mt-1">CA EDD LAUS • {unemploymentDate || 'Updated monthly'}</p>
            </div>

            {/* Fed Funds Rate */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fed Funds Rate</p>
                <p className="text-2xl font-bold text-teal-400">{formatPercent(fedFundsRate)}</p>
                <p className="text-xs text-slate-500 mt-1">FOMC Target • Updated weekly</p>
            </div>
        </div>
    );
}

// Mortgage vs Treasury Spread Data (26-year historical)
const spreadData = [
    { year: 2000, mortgage: 8.05, treasury: 6.03, spread: 2.02 },
    { year: 2001, mortgage: 6.97, treasury: 5.02, spread: 1.95 },
    { year: 2002, mortgage: 6.54, treasury: 4.61, spread: 1.93 },
    { year: 2003, mortgage: 5.83, treasury: 4.01, spread: 1.82 },
    { year: 2004, mortgage: 5.84, treasury: 4.27, spread: 1.57 },
    { year: 2005, mortgage: 5.87, treasury: 4.29, spread: 1.58 },
    { year: 2006, mortgage: 6.41, treasury: 4.80, spread: 1.61 },
    { year: 2007, mortgage: 6.34, treasury: 4.63, spread: 1.71 },
    { year: 2008, mortgage: 6.03, treasury: 3.66, spread: 2.37, event: 'Financial Crisis' },
    { year: 2009, mortgage: 5.04, treasury: 3.26, spread: 1.78 },
    { year: 2010, mortgage: 4.69, treasury: 3.22, spread: 1.47 },
    { year: 2011, mortgage: 4.45, treasury: 2.78, spread: 1.67 },
    { year: 2012, mortgage: 3.66, treasury: 1.80, spread: 1.86 },
    { year: 2013, mortgage: 3.98, treasury: 2.35, spread: 1.63 },
    { year: 2014, mortgage: 4.17, treasury: 2.54, spread: 1.63 },
    { year: 2015, mortgage: 3.85, treasury: 2.14, spread: 1.71 },
    { year: 2016, mortgage: 3.65, treasury: 1.84, spread: 1.81 },
    { year: 2017, mortgage: 3.99, treasury: 2.33, spread: 1.66 },
    { year: 2018, mortgage: 4.54, treasury: 2.91, spread: 1.63 },
    { year: 2019, mortgage: 3.94, treasury: 2.14, spread: 1.80 },
    { year: 2020, mortgage: 3.11, treasury: 0.89, spread: 2.22, event: 'COVID' },
    { year: 2021, mortgage: 2.96, treasury: 1.45, spread: 1.51 },
    { year: 2022, mortgage: 5.34, treasury: 2.95, spread: 2.39, event: 'Rate Hikes' },
    { year: 2023, mortgage: 6.81, treasury: 3.96, spread: 2.85 },
    { year: 2024, mortgage: 6.72, treasury: 4.20, spread: 2.52 },
    { year: 2025, mortgage: 6.91, treasury: 4.17, spread: 2.74 },
    { year: 2026, mortgage: 6.06, treasury: 4.55, spread: 1.51, event: 'Now' },
];

const historicalSpreadAverage = 1.78;

const SpreadTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-slate-800 p-3 border border-slate-600 rounded-lg shadow-lg">
                <p className="font-bold text-white">{label}</p>
                <p className="text-blue-400">30yr Mortgage: {d.mortgage.toFixed(2)}%</p>
                <p className="text-green-400">10yr Treasury: {d.treasury.toFixed(2)}%</p>
                <p className="text-orange-400 font-semibold">Spread: {d.spread.toFixed(2)}%</p>
                {d.event && <p className="text-red-400 text-sm mt-1">{d.event}</p>}
            </div>
        );
    }
    return null;
};

function MortgageSpreadChart() {
    // Get the current spread from the most recent entry in spreadData
    const currentSpreadData = spreadData[spreadData.length - 1];
    const currentSpread = currentSpreadData.spread;
    const isElevated = currentSpread > historicalSpreadAverage + 0.3;
    const isNormalized = currentSpread <= historicalSpreadAverage + 0.3;

    return (
        <div className="space-y-6">
            {/* Main Chart - Rates */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Interest Rates (25-Year View)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={spreadData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="year"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickFormatter={(value) => value.toString().slice(-2)}
                            stroke="#64748b"
                        />
                        <YAxis
                            domain={[0, 10]}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickFormatter={(value) => `${value}%`}
                            stroke="#64748b"
                        />
                        <Tooltip content={<SpreadTooltip />} />
                        <Legend wrapperStyle={{ color: '#94a3b8' }} />
                        <Line
                            type="monotone"
                            dataKey="mortgage"
                            name="30yr Mortgage"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#3b82f6' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="treasury"
                            name="10yr Treasury"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#22c55e' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Spread Chart */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Spread (Mortgage Rate − Treasury Yield)
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={spreadData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="year"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickFormatter={(value) => value.toString().slice(-2)}
                            stroke="#64748b"
                        />
                        <YAxis
                            domain={[1, 3.5]}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickFormatter={(value) => `${value}%`}
                            stroke="#64748b"
                        />
                        <Tooltip content={<SpreadTooltip />} />
                        <ReferenceLine
                            y={historicalSpreadAverage}
                            stroke="#9ca3af"
                            strokeDasharray="5 5"
                            label={{ value: `Avg: ${historicalSpreadAverage}%`, position: 'right', fontSize: 11, fill: '#9ca3af' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="spread"
                            fill="rgba(249, 115, 22, 0.3)"
                            stroke="#f97316"
                            strokeWidth={2}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase">Historical Average</h3>
                    <p className="text-3xl font-bold text-white">1.7-1.8%</p>
                    <p className="text-sm text-slate-400">Normal spread range</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase">Current Spread</h3>
                    <p className={`text-3xl font-bold ${isElevated ? 'text-orange-400' : 'text-green-400'}`}>{currentSpread.toFixed(2)}%</p>
                    <p className="text-sm text-slate-400">{isElevated ? 'Elevated vs historical' : 'Near historical average'}</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase">Refi Trigger</h3>
                    <p className="text-3xl font-bold text-green-400">3.25%</p>
                    <p className="text-sm text-slate-400">10yr yield for 5.25% mortgage</p>
                </div>
            </div>

            {/* Analysis */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">Key Takeaways</h2>
                <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span><strong className="text-white">Current spread is {isElevated ? 'elevated' : 'normalized'}</strong> at {currentSpread.toFixed(2)}% vs the historical average of 1.7-1.8%</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span><strong className="text-white">Spreads widen during stress</strong> – 2008 financial crisis, 2020 COVID, 2022-23 rate hikes</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span><strong className="text-white">{isNormalized ? 'Spreads have normalized' : 'If spreads normalize'}</strong>{isNormalized ? ', showing reduced market stress' : ' to 1.8%, mortgage rates could drop 0.5-1% even without Treasury moves'}</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span><strong className="text-white">Watch for 10yr at 3.25%</strong> + normalized spread = potential 5.0-5.25% mortgages</span>
                    </li>
                </ul>
            </div>

            <p className="text-xs text-slate-500">
                Data: FRED (Freddie Mac MORTGAGE30US, Treasury DGS10). Annual averages 2000-2024, {currentSpreadData.year} current.
            </p>
        </div>
    );
}

export default function LendingDashboard() {
    const [data, setData] = useState(null);
    const [homePriceData, setHomePriceData] = useState(null);  // San Diego HPI
    const [usHomePriceData, setUsHomePriceData] = useState(null);  // US National HPI
    const [unemploymentData, setUnemploymentData] = useState(null);  // CA EDD unemployment
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSpread, setShowSpread] = useState(false);  // Toggle for Spread chart view

    useEffect(() => {
        Promise.all([
            fetch('/data/lending_data.json').then(res => res.ok ? res.json() : null),
            fetch('/data/home_price_index.json').then(res => res.ok ? res.json() : null),  // SD
            fetch('/data/us_home_price_index.json').then(res => res.ok ? res.json() : null),  // US National
            fetch('/data/unemployment_data.json').then(res => res.ok ? res.json() : null)  // CA EDD
        ])
            .then(([lendingData, sdHpiData, usHpiData, eddData]) => {
                setData(lendingData);
                setHomePriceData(sdHpiData);
                setUsHomePriceData(usHpiData);
                setUnemploymentData(eddData);
            })
            .catch(err => {
                console.error('Error loading data:', err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    const lendingData = data || defaultData;

    const chartData = useMemo(() => {
        if (!lendingData.rateHistory || lendingData.rateHistory.length === 0) return [];
        const historyData = lendingData.rateHistory.map(item => ({
            ...item,
            month: item.date ? item.date.split('-')[1] + '/' + item.date.split('-')[0].slice(2) : ''
        }));
        // Add current rates as the last point
        if (lendingData.currentRates) {
            historyData.push({
                date: 'Current',
                month: 'Now',
                rate30: lendingData.currentRates.rate30,
                rate15: lendingData.currentRates.rate15,
                rateARM: lendingData.currentRates.rateARM
            });
        }
        return historyData;
    }, [lendingData.rateHistory, lendingData.currentRates]);

    const hpiChartData = useMemo(() => {
        if (!homePriceData?.history || homePriceData.history.length === 0) return [];
        return homePriceData.history.map(item => ({
            ...item,
            month: item.date ? item.date.split('-')[1] + '/' + item.date.split('-')[0].slice(2) : ''
        }));
    }, [homePriceData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-teal-500 rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading FRED data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Subtle grid overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header with inline button */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {showSpread && (
                                <button
                                    onClick={() => setShowSpread(false)}
                                    className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                                </button>
                            )}
                            <div className="p-2 bg-teal-900/30 rounded-lg border border-teal-800/50">
                                <DollarSign className="w-6 h-6 text-teal-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {showSpread ? 'Mortgage Spread Analysis' : 'Lending & Rates'}
                            </h1>
                            {data?.meta?.lastUpdate && <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full">Updated {formatDate(data.meta.lastUpdate)}</span>}
                        </div>
                        <p className="text-slate-400">San Diego County • Mortgage Market Intelligence</p>
                    </div>

                    {/* Spread Button - Right aligned */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowSpread(!showSpread)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all shadow-lg group justify-center ${showSpread
                                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20'
                                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20'
                                }`}
                        >
                            <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                <BarChart2 className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-medium text-orange-200">View</p>
                                <p className="text-sm font-bold">Spread</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Conditional Content */}
                {showSpread ? (
                    <MortgageSpreadChart />
                ) : (
                    <>
                        {/* Current Rates Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            <RateCard
                                title="30-Year Fixed"
                                rate={lendingData.currentRates.rate30}
                                change={lendingData.weekChange.rate30}
                                icon={Home}
                                color="bg-teal-600"
                                subtitle="Conventional"
                            />
                            <RateCard
                                title="15-Year Fixed"
                                rate={lendingData.currentRates.rate15}
                                change={lendingData.weekChange.rate15}
                                icon={Home}
                                color="bg-blue-600"
                                subtitle="Conventional"
                            />
                            <RateCard
                                title="5/1 ARM"
                                rate={lendingData.currentRates.rateARM}
                                change={lendingData.weekChange.rateARM}
                                icon={TrendingDown}
                                color="bg-purple-600"
                                subtitle="Adjustable"
                            />
                            <RateCard
                                title="Jumbo"
                                rate={lendingData.currentRates.jumboRate}
                                change={0}
                                icon={DollarSign}
                                color="bg-amber-600"
                                subtitle="> $1.08M"
                            />
                            <RateCard
                                title="FHA"
                                rate={lendingData.currentRates.fhaRate}
                                change={0}
                                icon={Users}
                                color="bg-emerald-600"
                                subtitle="3.5% down"
                            />
                            <RateCard
                                title="VA"
                                rate={lendingData.currentRates.vaRate}
                                change={0}
                                icon={Home}
                                color="bg-red-600"
                                subtitle="0% down"
                            />
                        </div>

                        {/* Charts and Details */}
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            {/* Rate History Chart */}
                            <div className="md:col-span-2 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold">Rate History (12 Months)</h2>
                                    <div className="flex gap-4 text-xs">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-teal-500 rounded-full"></span>30-Yr</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>15-Yr</span>
                                    </div>
                                </div>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                                            <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                                labelStyle={{ color: '#94a3b8' }}
                                                formatter={(value) => value ? [`${value.toFixed(2)}%`] : ['N/A']}
                                            />
                                            <Line type="monotone" dataKey="rate30" stroke="#14b8a6" strokeWidth={2} dot={false} name="30-Year" connectNulls />
                                            <Line type="monotone" dataKey="rate15" stroke="#3b82f6" strokeWidth={2} dot={false} name="15-Year" connectNulls />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-500">
                                        <p>Run fetch script to load rate history</p>
                                    </div>
                                )}
                            </div>

                            {/* Key Indicators Panel */}
                            <KeyIndicatorsPanel homePriceData={usHomePriceData} unemploymentData={unemploymentData} lendingData={lendingData} formatPercent={formatPercent} />
                        </div>

                        {/* Loan Limits & Market Metrics */}
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            {/* San Diego Loan Limits */}
                            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-slate-500" />
                                    2025 San Diego Loan Limits
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                        <div>
                                            <p className="text-sm text-white">Conforming Limit</p>
                                            <p className="text-xs text-slate-500">Standard conventional loans</p>
                                        </div>
                                        <p className="text-lg font-bold text-teal-400">{formatCurrency(lendingData.loanLimits.conforming)}</p>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                        <div>
                                            <p className="text-sm text-white">High-Balance Limit</p>
                                            <p className="text-xs text-slate-500">High-cost area conforming</p>
                                        </div>
                                        <p className="text-lg font-bold text-blue-400">{formatCurrency(lendingData.loanLimits.highBalance)}</p>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                        <div>
                                            <p className="text-sm text-white">Jumbo Threshold</p>
                                            <p className="text-xs text-slate-500">Requires jumbo loan above this</p>
                                        </div>
                                        <p className="text-lg font-bold text-amber-400">{formatCurrency(lendingData.loanLimits.jumbo)}+</p>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <div>
                                            <p className="text-sm text-white">FHA Limit</p>
                                            <p className="text-xs text-slate-500">Maximum FHA loan amount</p>
                                        </div>
                                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(lendingData.loanLimits.fha)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Market Health Metrics */}
                            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-slate-500" />
                                    Economic Indicators
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <MetricCard
                                        title="SD Unemployment"
                                        value={lendingData.sanDiego?.unemploymentRate || 4.2}
                                        subtext="San Diego County"
                                        format="percent"
                                    />
                                    <MetricCard
                                        title="Fed Funds Rate"
                                        value={lendingData.currentRates.fedFunds}
                                        subtext="FOMC Target"
                                        format="percent"
                                    />
                                    <MetricCard
                                        title="30-Year Rate"
                                        value={lendingData.currentRates.rate30}
                                        subtext="Conventional"
                                        format="percent"
                                    />
                                    <MetricCard
                                        title="15-Year Rate"
                                        value={lendingData.currentRates.rate15}
                                        subtext="Conventional"
                                        format="percent"
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Rate Insight Panel */}
                        <div className="bg-gradient-to-r from-teal-900/30 to-blue-900/30 border border-teal-700/30 rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-teal-400" />
                                Rate Outlook
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-xs text-teal-400 uppercase tracking-wide mb-1">Fed Funds Rate</p>
                                    <p className="text-2xl font-bold text-white">{formatPercent(lendingData.currentRates.fedFunds)}</p>
                                    <p className="text-xs text-slate-400 mt-1">FOMC Target Rate</p>
                                </div>
                                <div>
                                    <p className="text-xs text-teal-400 uppercase tracking-wide mb-1">Next FOMC Meeting</p>
                                    <p className="text-2xl font-bold text-white">Jan 28-29</p>
                                    <p className="text-xs text-slate-400 mt-1">Rate decision expected</p>
                                </div>
                                <div>
                                    <p className="text-xs text-teal-400 uppercase tracking-wide mb-1">Market Expectation</p>
                                    <p className="text-2xl font-bold text-white">Hold</p>
                                    <p className="text-xs text-slate-400 mt-1">No change expected</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">Data sources: FRED (Federal Reserve Economic Data) • Updated daily</p>
                </div>
            </div>
        </div>
    );
}
