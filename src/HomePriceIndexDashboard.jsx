import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, ArrowLeft, Sparkles } from 'lucide-react';

export default function HomePriceIndexDashboard({ setActiveView }) {
    const [homePriceData, setHomePriceData] = useState(null);  // San Diego HPI
    const [usHomePriceData, setUsHomePriceData] = useState(null);  // US National HPI
    const [laHomePriceData, setLaHomePriceData] = useState(null);  // Los Angeles HPI
    const [sfHomePriceData, setSfHomePriceData] = useState(null);  // San Francisco HPI
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/data/home_price_index.json').then(res => res.ok ? res.json() : null),  // SD
            fetch('/data/us_home_price_index.json').then(res => res.ok ? res.json() : null),  // US National
            fetch('/data/la_home_price_index.json').then(res => res.ok ? res.json() : null),  // Los Angeles
            fetch('/data/sf_home_price_index.json').then(res => res.ok ? res.json() : null),  // San Francisco
        ])
            .then(([sdHpiData, usHpiData, laHpiData, sfHpiData]) => {
                setHomePriceData(sdHpiData);
                setUsHomePriceData(usHpiData);
                setLaHomePriceData(laHpiData);
                setSfHomePriceData(sfHpiData);
            })
            .catch(err => {
                console.error('Error loading data:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    // Combine all indices into one chart dataset - All NSA (Not Seasonally Adjusted)
    const combinedChartData = useMemo(() => {
        if (!homePriceData?.history) return [];

        const sdData = {};
        const usData = {};
        const laData = {};
        const sfData = {};

        homePriceData.history.forEach(item => {
            sdData[item.date] = item;
        });

        if (usHomePriceData?.history) {
            usHomePriceData.history.forEach(item => {
                usData[item.date] = item;
            });
        }

        if (laHomePriceData?.history) {
            laHomePriceData.history.forEach(item => {
                laData[item.date] = item;
            });
        }

        if (sfHomePriceData?.history) {
            sfHomePriceData.history.forEach(item => {
                sfData[item.date] = item;
            });
        }

        // Get all unique dates
        const allDates = [...new Set([...Object.keys(sdData), ...Object.keys(usData), ...Object.keys(laData), ...Object.keys(sfData)])].sort();

        return allDates.map(date => ({
            date,
            month: date.split('-')[1] + '/' + date.split('-')[0].slice(2),
            sd: sdData[date]?.nsa,  // All using NSA
            us: usData[date]?.nsa,
            la: laData[date]?.nsa,
            sf: sfData[date]?.nsa,
        }));
    }, [homePriceData, usHomePriceData, laHomePriceData, sfHomePriceData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-orange-500 rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading Case-Shiller data...</p>
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
                            <button
                                onClick={() => setActiveView('realestate')}
                                className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-400" />
                            </button>
                            <div className="p-2 bg-orange-900/30 rounded-lg border border-orange-800/50">
                                <BarChart3 className="w-6 h-6 text-orange-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Home Price Index</h1>
                        </div>
                        <p className="text-slate-400">S&P CoreLogic Case-Shiller • California Metro Comparison</p>
                    </div>
                    <div className="text-right">
                        <div className="mb-2">
                            <p className="text-xs text-slate-500">Data as of</p>
                            <p className="text-sm text-slate-400 font-medium">{homePriceData?.current?.notSeasonallyAdjusted?.date || 'Loading...'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Next Update</p>
                            <p className="text-sm text-slate-400 font-medium">Jan 27, 2026</p>
                        </div>
                    </div>
                </div>

                {/* Executive Summary - Full Width */}
                <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900/50 border border-indigo-500/30 rounded-xl p-6 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-24 h-24 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                            <Sparkles className="w-4 h-4 text-indigo-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Executive Summary</h3>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed relative z-10">
                        <p>
                            <strong className="text-orange-300">San Diego's housing market</strong> shows a slight cooling trend with a <strong className="text-white">0.6% year-over-year decline</strong> in the Home Price Index, contrasting with the <strong className="text-teal-300">U.S. National Index</strong> which rose by <strong className="text-white">1.4%</strong>. While national prices continue to inch upward, San Diego's dip suggests a localized market correction or stabilization after previous gains. <strong className="text-amber-300">Los Angeles</strong> and <strong className="text-purple-300">San Francisco</strong> remain relatively flat with negligible year-over-year movement (less than 1%), indicating a broader stabilization across California's major coastal metros compared to the national average.
                        </p>
                    </div>
                </div>

                {/* Main Chart - All NSA */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-orange-400" />
                            Case-Shiller Home Price Index Comparison
                        </h2>
                        <span className="text-xs text-slate-500">Not Seasonally Adjusted • Jan 2000 = 100</span>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-xs mb-4">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full"></span>San Diego</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded-full"></span>Los Angeles</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-full"></span>San Francisco</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-teal-500 rounded-full"></span>U.S. National</span>
                    </div>

                    {combinedChartData.length > 0 && (
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={combinedChartData}>
                                <defs>
                                    <linearGradient id="colorSd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorUs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                    formatter={(value, name) => {
                                        const labels = {
                                            sd: 'San Diego',
                                            la: 'Los Angeles',
                                            sf: 'San Francisco',
                                            us: 'U.S. National'
                                        };
                                        return value ? [value.toFixed(1), labels[name] || name] : ['N/A', name];
                                    }}
                                />
                                <Area type="monotone" dataKey="sd" stroke="#f97316" strokeWidth={2} fill="url(#colorSd)" name="sd" connectNulls />
                                <Area type="monotone" dataKey="la" stroke="#fbbf24" strokeWidth={2} fill="url(#colorLa)" name="la" connectNulls />
                                <Area type="monotone" dataKey="sf" stroke="#a855f7" strokeWidth={2} fill="url(#colorSf)" name="sf" connectNulls />
                                <Area type="monotone" dataKey="us" stroke="#14b8a6" strokeWidth={2} fill="url(#colorUs)" name="us" connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <h3 className="text-lg font-semibold text-white mb-4">Current Values (Not Seasonally Adjusted)</h3>
                {/* Current Values Cards - 4 columns - All NSA */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* San Diego */}
                    <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4">
                        <p className="text-xs text-orange-400 uppercase tracking-wide font-bold mb-1">San Diego</p>
                        <p className="text-2xl font-bold text-orange-400">{homePriceData?.current?.notSeasonallyAdjusted?.value?.toFixed(1)}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {homePriceData?.changes?.yearOverYear?.nsa >= 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{homePriceData?.changes?.yearOverYear?.nsa}% YoY
                                </span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {homePriceData?.changes?.yearOverYear?.nsa}% YoY
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Los Angeles */}
                    <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
                        <p className="text-xs text-amber-400 uppercase tracking-wide font-bold mb-1">Los Angeles</p>
                        <p className="text-2xl font-bold text-amber-400">{laHomePriceData?.current?.notSeasonallyAdjusted?.value?.toFixed(1) || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {laHomePriceData?.changes?.yearOverYear?.nsa >= 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{laHomePriceData?.changes?.yearOverYear?.nsa}% YoY
                                </span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {laHomePriceData?.changes?.yearOverYear?.nsa}% YoY
                                </span>
                            )}
                        </div>
                    </div>

                    {/* San Francisco */}
                    <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-4">
                        <p className="text-xs text-purple-400 uppercase tracking-wide font-bold mb-1">San Francisco</p>
                        <p className="text-2xl font-bold text-purple-400">{sfHomePriceData?.current?.notSeasonallyAdjusted?.value?.toFixed(1) || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {sfHomePriceData?.changes?.yearOverYear?.nsa !== undefined && (
                                sfHomePriceData?.changes?.yearOverYear?.nsa >= 0 ? (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        +{sfHomePriceData?.changes?.yearOverYear?.nsa}% YoY
                                    </span>
                                ) : (
                                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" />
                                        {sfHomePriceData?.changes?.yearOverYear?.nsa}% YoY
                                    </span>
                                )
                            )}
                        </div>
                    </div>

                    {/* US National */}
                    <div className="bg-teal-900/30 border border-teal-700/50 rounded-xl p-4">
                        <p className="text-xs text-teal-400 uppercase tracking-wide font-bold mb-1">U.S. National</p>
                        <p className="text-2xl font-bold text-teal-400">{usHomePriceData?.current?.notSeasonallyAdjusted?.value?.toFixed(1)}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {usHomePriceData?.changes?.yearOverYear?.nsa >= 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{usHomePriceData?.changes?.yearOverYear?.nsa}% YoY
                                </span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {usHomePriceData?.changes?.yearOverYear?.nsa}% YoY
                                </span>
                            )}
                        </div>
                    </div>
                </div>



                {/* Seasonally Adjusted Cards */}
                <h3 className="text-lg font-semibold text-white mb-4">Seasonally Adjusted (SA)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* San Diego SA */}
                    <div className="bg-orange-900/10 border border-orange-700/30 rounded-xl p-4">
                        <p className="text-xs text-orange-400 uppercase tracking-wide font-bold mb-1">San Diego</p>
                        <p className="text-2xl font-bold text-orange-400">{homePriceData?.current?.seasonallyAdjusted?.value?.toFixed(1) || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {homePriceData?.changes?.yearOverYear?.sa >= 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{homePriceData?.changes?.yearOverYear?.sa}% YoY
                                </span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {homePriceData?.changes?.yearOverYear?.sa}% YoY
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Los Angeles SA */}
                    <div className="bg-amber-900/10 border border-amber-700/30 rounded-xl p-4">
                        <p className="text-xs text-amber-400 uppercase tracking-wide font-bold mb-1">Los Angeles</p>
                        <p className="text-2xl font-bold text-amber-400">{laHomePriceData?.current?.seasonallyAdjusted?.value?.toFixed(1) || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {laHomePriceData?.changes?.yearOverYear?.sa !== undefined && (
                                laHomePriceData?.changes?.yearOverYear?.sa >= 0 ? (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        +{laHomePriceData?.changes?.yearOverYear?.sa}% YoY
                                    </span>
                                ) : (
                                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" />
                                        {laHomePriceData?.changes?.yearOverYear?.sa}% YoY
                                    </span>
                                )
                            )}
                        </div>
                    </div>

                    {/* San Francisco SA */}
                    <div className="bg-purple-900/10 border border-purple-700/30 rounded-xl p-4">
                        <p className="text-xs text-purple-400 uppercase tracking-wide font-bold mb-1">San Francisco</p>
                        <p className="text-2xl font-bold text-purple-400">{sfHomePriceData?.current?.seasonallyAdjusted?.value?.toFixed(1) || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {sfHomePriceData?.changes?.yearOverYear?.sa !== undefined && (
                                sfHomePriceData?.changes?.yearOverYear?.sa >= 0 ? (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        +{sfHomePriceData?.changes?.yearOverYear?.sa}% YoY
                                    </span>
                                ) : (
                                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" />
                                        {sfHomePriceData?.changes?.yearOverYear?.sa}% YoY
                                    </span>
                                )
                            )}
                        </div>
                    </div>

                    {/* US National SA */}
                    <div className="bg-teal-900/10 border border-teal-700/30 rounded-xl p-4">
                        <p className="text-xs text-teal-400 uppercase tracking-wide font-bold mb-1">U.S. National</p>
                        <p className="text-2xl font-bold text-teal-400">{usHomePriceData?.current?.seasonallyAdjusted?.value?.toFixed(1) || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {usHomePriceData?.changes?.yearOverYear?.sa >= 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{usHomePriceData?.changes?.yearOverYear?.sa}% YoY
                                </span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {usHomePriceData?.changes?.yearOverYear?.sa}% YoY
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* What is Case-Shiller? - Full Width */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-3">What is Case-Shiller?</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-400 leading-relaxed">
                        <div>
                            <p>
                                The <span className="text-slate-300 font-medium">S&P CoreLogic Case-Shiller Index</span> measures the change in value of single-family detached residences over time. It is widely considered the leading measure of U.S. residential real estate prices because it tracks the value of the same homes as they resell, rather than just averaging all sales.
                            </p>
                        </div>
                        <div>
                            <p>
                                <span className="text-slate-300 font-medium">What It Tracks:</span> Single-family homes only (excludes condos, co-ops, new construction). Only counts homes sold at least twice ("sales pairs") using arm's-length transactions—filtering out family transfers and non-market sales.
                            </p>
                        </div>
                        <div>
                            <p>
                                <span className="text-slate-300 font-medium">How It's Calculated:</span> The "repeat-sales" method compares prices of the same property over time. For example, if a San Diego home sold for $500K in 2015 and $800K in 2024, the index captures that appreciation across thousands of such pairs.
                            </p>
                        </div>
                        <div>
                            <p>
                                <span className="text-slate-300 font-medium">Lag Time:</span> Data is reported with a 2-month lag. For example, reports released in late December cover sales through October.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-500">Data sources: FRED (Federal Reserve Economic Data) • S&P CoreLogic Case-Shiller</p>
                    <p className="text-xs text-slate-600">Gregory Velasquez | LPT Realty | DRE #02252032</p>
                </div>
            </div>
        </div>
    );
}
