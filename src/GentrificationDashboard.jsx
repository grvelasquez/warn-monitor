import { useState, useCallback, useMemo } from 'react';
import { MapPin, TrendingUp, TrendingDown, AlertTriangle, School, Home, Users, Activity, BarChart3, Map, Store } from 'lucide-react';
import { useGentrificationData } from './hooks/useGentrificationData';
import { TransitionChart } from './components/TransitionChart';
import { RetailSignals } from './components/RetailSignals';

// Risk color scale
const getRiskColor = (risk) => {
    if (risk >= 0.7) return { bg: 'bg-red-500', text: 'text-red-400', label: 'High Risk' };
    if (risk >= 0.5) return { bg: 'bg-orange-500', text: 'text-orange-400', label: 'Moderate Risk' };
    if (risk >= 0.3) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Low Risk' };
    return { bg: 'bg-green-500', text: 'text-green-400', label: 'Stable' };
};

// Format helpers
const formatPrice = (val) => `$${(val / 1000).toFixed(0)}K`;
const formatPercent = (val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;

// Summary Stat Card
function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'bg-slate-700' }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between">
                <div className={`p-2 ${color} rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(trend)}
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{title}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// District Map Card (simplified choropleth visualization)
function GentrificationMap({ districts, selectedId, onSelectDistrict, highlightedYear }) {
    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Map className="w-5 h-5 text-slate-500" />
                District Risk Map
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {districts.map((district) => {
                    const risk = getRiskColor(district.riskScore);
                    const isSelected = district.districtId === selectedId;

                    return (
                        <button
                            key={district.districtId}
                            onClick={() => onSelectDistrict?.(district.districtId)}
                            className={`relative p-3 rounded-lg border transition-all text-left ${isSelected
                                ? 'bg-slate-700/50 border-purple-500/50 ring-1 ring-purple-500/30'
                                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                                }`}
                        >
                            {/* Risk indicator dot */}
                            <div className={`absolute top-2 right-2 w-2.5 h-2.5 ${risk.bg} rounded-full`} />

                            <p className="text-sm font-medium text-white truncate pr-4">{district.name}</p>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Price</span>
                                    <span className={`text-xs ${district.priceVelocity > 5 ? 'text-red-400' : 'text-green-400'}`}>
                                        +{district.priceVelocity}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Enroll.</span>
                                    <span className={`text-xs ${district.enrollmentVelocity < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {district.enrollmentVelocity > 0 ? '+' : ''}{district.enrollmentVelocity}%
                                    </span>
                                </div>
                            </div>

                            {/* Risk bar */}
                            <div className="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${risk.bg} transition-all`}
                                    style={{ width: `${district.riskScore * 100}%` }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                <span className="text-slate-500">Risk Level:</span>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-slate-400">Stable</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-slate-400">Low</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-slate-400">Moderate</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-slate-400">High</span>
                </div>
            </div>
        </div>
    );
}

// Demographic Breakdown
function DemographicBreakdown({ data }) {
    if (!data || data.length === 0) return null;

    const latest = data[data.length - 1];
    const breakdown = latest.demographicBreakdown;

    const colors = {
        hispanic: 'bg-orange-500',
        white: 'bg-blue-400',
        asian: 'bg-emerald-500',
        black: 'bg-purple-500',
        other: 'bg-slate-500'
    };

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                Demographic Breakdown ({latest.year})
            </h3>

            {/* Stacked bar */}
            <div className="h-4 rounded-full overflow-hidden flex mb-4">
                {Object.entries(breakdown).map(([key, value]) => (
                    <div
                        key={key}
                        className={`${colors[key]} transition-all`}
                        style={{ width: `${value}%` }}
                        title={`${key}: ${value}%`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(breakdown).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${colors[key]} rounded`} />
                        <div>
                            <p className="text-xs text-slate-400 capitalize">{key}</p>
                            <p className="text-sm font-medium text-white">{value}%</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Velocity Timeline
function VelocityTimeline({ data }) {
    if (!data || data.length < 2) return null;

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-500" />
                Year-over-Year Velocity
            </h3>

            <div className="space-y-3">
                {data.slice(1).map((item) => (
                    <div key={item.year} className="flex items-center gap-4">
                        <span className="text-sm text-slate-400 w-12">{item.year}</span>

                        {/* Price velocity bar */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-slate-500 w-14">Price</span>
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.medianPriceVelocity > 10 ? 'bg-red-500' : item.medianPriceVelocity > 5 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, item.medianPriceVelocity * 5)}%` }}
                                    />
                                </div>
                                <span className={`text-xs w-12 text-right ${item.medianPriceVelocity > 5 ? 'text-red-400' : 'text-green-400'}`}>
                                    +{item.medianPriceVelocity?.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 w-14">Enroll.</span>
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.enrollmentVelocity < -3 ? 'bg-red-500' : item.enrollmentVelocity < 0 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, Math.abs(item.enrollmentVelocity) * 10)}%` }}
                                    />
                                </div>
                                <span className={`text-xs w-12 text-right ${item.enrollmentVelocity < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {item.enrollmentVelocity?.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main Dashboard Component
export default function GentrificationDashboard() {
    const [selectedDistrictId, setSelectedDistrictId] = useState("SD_unified");
    const [highlightedYear, setHighlightedYear] = useState(null);

    const { data, districts, summary, loading, error } = useGentrificationData(selectedDistrictId);

    // Chart interaction callbacks
    const handleYearHover = useCallback((year, yearData) => {
        setHighlightedYear(year);
    }, []);

    const handleYearClick = useCallback((yearData) => {
        console.log('Year clicked:', yearData);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-purple-500 rounded-full mx-auto mb-4" />
                    <p className="text-slate-400">Loading gentrification data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white font-medium">Error loading data</p>
                    <p className="text-slate-400 text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const latest = data[data.length - 1];
    const riskInfo = getRiskColor(summary?.currentRisk || 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Subtle grid overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-800/50">
                                <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Gentrification Trends</h1>
                        </div>
                        <p className="text-sm sm:text-base text-slate-400">School Demographics vs. Real Estate • Displacement Risk Analysis</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-lg ${riskInfo.bg}/20 border border-${riskInfo.bg.replace('bg-', '')}/30`}>
                            <span className={`text-sm font-medium ${riskInfo.text}`}>
                                {riskInfo.label}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">{summary?.period}</p>
                            <p className="text-sm text-slate-400">San Diego Unified</p>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <StatCard
                        title="Median Home Price"
                        value={formatPrice(latest?.medianPrice || 0)}
                        subtitle={summary?.period}
                        icon={Home}
                        trend={summary?.avgPriceVelocity}
                        color="bg-emerald-600"
                    />
                    <StatCard
                        title="School Enrollment"
                        value={`${((latest?.enrollment || 0) / 1000).toFixed(0)}K`}
                        subtitle="Current students"
                        icon={School}
                        trend={summary?.avgEnrollmentVelocity}
                        color="bg-blue-600"
                    />
                    <StatCard
                        title="Minority Students"
                        value={`${latest?.minorityPercent || 0}%`}
                        subtitle={`${summary?.totalMinorityChange > 0 ? '+' : ''}${summary?.totalMinorityChange || 0}% total change`}
                        icon={Users}
                        color="bg-purple-600"
                    />
                    <StatCard
                        title="Displacement Risk"
                        value={`${((summary?.currentRisk || 0) * 100).toFixed(0)}%`}
                        subtitle={riskInfo.label}
                        icon={AlertTriangle}
                        color={summary?.currentRisk > 0.5 ? "bg-red-600" : "bg-green-600"}
                    />
                </div>

                {/* Main Chart */}
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-slate-500" />
                        Demographic Transition Analysis
                    </h2>
                    <TransitionChart
                        data={data}
                        onYearHover={handleYearHover}
                        onYearClick={handleYearClick}
                        height={350}
                    />
                </div>

                {/* Map and Demographics Row */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
                    <GentrificationMap
                        districts={districts}
                        selectedId={selectedDistrictId}
                        onSelectDistrict={setSelectedDistrictId}
                        highlightedYear={highlightedYear}
                    />
                    <DemographicBreakdown data={data} />
                </div>

                {/* Velocity Timeline */}
                <VelocityTimeline data={data} />

                {/* Retail Signals Section */}
                <div className="mt-6 sm:mt-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Store className="w-5 h-5 text-orange-400" />
                        Retail Gentrification Signals
                    </h2>
                    <RetailSignals />
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">Data sources: California Dept. of Education, Zillow, Census Bureau, OpenStreetMap, City of San Diego • For research purposes only</p>
                </div>
            </div>
        </div>
    );
}
