import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Home, Users, Calendar, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

function KeyIndicatorsPanel({ homePriceData, lendingData, formatPercent }) {
    const caseShillerValue = homePriceData?.current?.seasonallyAdjusted?.value;
    const caseShillerChange = homePriceData?.changes?.yearOverYear?.sa;
    const caseShillerDate = homePriceData?.current?.seasonallyAdjusted?.date;
    const unemploymentRate = lendingData?.sanDiego?.unemploymentRate || 4.2;
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
                <p className="text-xs text-slate-500 mt-1">San Diego County • FRED</p>
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

export default function LendingDashboard() {
    const [data, setData] = useState(null);
    const [homePriceData, setHomePriceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            fetch('/data/lending_data.json').then(res => res.ok ? res.json() : null),
            fetch('/data/home_price_index.json').then(res => res.ok ? res.json() : null)
        ])
            .then(([lendingData, hpiData]) => {
                setData(lendingData);
                setHomePriceData(hpiData);
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
        return lendingData.rateHistory.map(item => ({
            ...item,
            month: item.date ? item.date.split('-')[1] + '/' + item.date.split('-')[0].slice(2) : ''
        }));
    }, [lendingData.rateHistory]);

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
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-teal-900/30 rounded-lg border border-teal-800/50">
                                <DollarSign className="w-6 h-6 text-teal-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Lending & Rates</h1>
                            {data?.meta?.lastUpdate && <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full">Updated {formatDate(data.meta.lastUpdate)}</span>}
                        </div>
                        <p className="text-slate-400">San Diego County • Mortgage Market Intelligence</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">FRED Data as of</p>
                        <p className="text-sm text-slate-400">{data?.meta?.lastUpdate ? formatDate(data.meta.lastUpdate) : new Date().toLocaleDateString()}</p>
                    </div>
                </div>

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
                    <KeyIndicatorsPanel homePriceData={homePriceData} lendingData={lendingData} formatPercent={formatPercent} />
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

                {/* San Diego Home Price Index */}
                {homePriceData && (
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-orange-400" />
                                San Diego Home Price Index
                            </h2>
                            <span className="text-xs text-slate-500">S&P CoreLogic Case-Shiller • Jan 2000 = 100</span>
                        </div>

                        {/* Current Values */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Seasonally Adjusted</p>
                                <p className="text-2xl font-bold text-orange-400">{homePriceData.current?.seasonallyAdjusted?.value?.toFixed(1)}</p>
                                <p className="text-xs text-slate-500">{homePriceData.current?.seasonallyAdjusted?.date}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Not Seasonally Adj.</p>
                                <p className="text-2xl font-bold text-amber-400">{homePriceData.current?.notSeasonallyAdjusted?.value?.toFixed(1)}</p>
                                <p className="text-xs text-slate-500">{homePriceData.current?.notSeasonallyAdjusted?.date}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Year-over-Year (SA)</p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-2xl font-bold ${homePriceData.changes?.yearOverYear?.sa >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {homePriceData.changes?.yearOverYear?.sa >= 0 ? '+' : ''}{homePriceData.changes?.yearOverYear?.sa}%
                                    </p>
                                    {homePriceData.changes?.yearOverYear?.sa >= 0 ?
                                        <TrendingUp className="w-4 h-4 text-green-400" /> :
                                        <TrendingDown className="w-4 h-4 text-red-400" />
                                    }
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Month-over-Month (SA)</p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-2xl font-bold ${homePriceData.changes?.monthOverMonth?.sa >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {homePriceData.changes?.monthOverMonth?.sa >= 0 ? '+' : ''}{homePriceData.changes?.monthOverMonth?.sa}%
                                    </p>
                                    {homePriceData.changes?.monthOverMonth?.sa >= 0 ?
                                        <TrendingUp className="w-4 h-4 text-green-400" /> :
                                        <TrendingDown className="w-4 h-4 text-red-400" />
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        {hpiChartData.length > 0 && (
                            <div>
                                <div className="flex gap-4 text-xs mb-2">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full"></span>Seasonally Adjusted</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span>Not Seasonally Adjusted</span>
                                </div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={hpiChartData}>
                                        <defs>
                                            <linearGradient id="colorSa" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                                        <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                            labelStyle={{ color: '#94a3b8' }}
                                            formatter={(value) => value ? [value.toFixed(1)] : ['N/A']}
                                        />
                                        <Area type="monotone" dataKey="sa" stroke="#f97316" strokeWidth={2} fill="url(#colorSa)" name="SA" connectNulls />
                                        <Line type="monotone" dataKey="nsa" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="NSA" connectNulls strokeDasharray="4 2" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

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

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-500">Data sources: FRED (Federal Reserve Economic Data) • Updated weekly</p>
                    <p className="text-xs text-slate-600">Gregory Velasquez | LPT Realty | DRE #02252032</p>
                </div>
            </div>
        </div>
    );
}
