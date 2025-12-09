import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, MapPin, Users, Calendar, TrendingDown, Building2, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import NewsFeed from './NewsFeed';

// Region and risk color schemes - aligned with SDAR Real Estate regions
const regionColors = {
    "Coastal": { bg: "bg-cyan-900/30", border: "border-cyan-500", text: "text-cyan-400" },
    "Urban San Diego": { bg: "bg-rose-900/30", border: "border-rose-500", text: "text-rose-400" },
    "Central San Diego": { bg: "bg-blue-900/30", border: "border-blue-500", text: "text-blue-400" },
    "North County Inland": { bg: "bg-emerald-900/30", border: "border-emerald-500", text: "text-emerald-400" },
    "East County": { bg: "bg-purple-900/30", border: "border-purple-500", text: "text-purple-400" },
    "South County": { bg: "bg-amber-900/30", border: "border-amber-500", text: "text-amber-400" },
};

const riskColors = {
    "Critical": { bg: "bg-red-900/40", border: "border-red-500", text: "text-red-400", dot: "bg-red-500" },
    "High": { bg: "bg-orange-900/40", border: "border-orange-500", text: "text-orange-400", dot: "bg-orange-500" },
    "Moderate": { bg: "bg-yellow-900/40", border: "border-yellow-600", text: "text-yellow-400", dot: "bg-yellow-500" },
    "Low": { bg: "bg-green-900/40", border: "border-green-600", text: "text-green-400", dot: "bg-green-500" },
};

function RiskBadge({ level }) {
    const colors = riskColors[level] || riskColors["Low"];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`}></span>
            {level}
        </span>
    );
}

function MetricCard({ icon: Icon, label, value, subtext }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between">
                <div className="p-2 bg-slate-700/50 rounded-lg">
                    <Icon className="w-5 h-5 text-slate-400" />
                </div>
            </div>
            <div className="mt-3">
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                <p className="text-sm text-slate-400 mt-1">{label}</p>
                {subtext && <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>}
            </div>
        </div>
    );
}

function ZipCodeCard({ zipcode, data, notices }) {
    const [expanded, setExpanded] = useState(false);
    const colors = riskColors[data.risk_level] || riskColors["Low"];
    const zipNotices = notices.filter(n => n.zipcode === zipcode);

    return (
        <div className={`${colors.bg} border ${colors.border} rounded-xl overflow-hidden transition-all duration-300`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-mono font-bold text-white">{zipcode}</span>
                            <RiskBadge level={data.risk_level} />
                        </div>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {zipNotices[0]?.neighborhood || zipNotices[0]?.city || 'San Diego'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xl font-bold text-white">{data.total_employees}</p>
                        <p className="text-xs text-slate-500">employees affected</p>
                    </div>
                    <div className={`p-1 rounded ${expanded ? 'bg-white/10' : ''}`}>
                        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 border-t border-white/10">
                    <div className="mt-3 space-y-2">
                        {zipNotices.map(notice => (
                            <div key={notice.notice_id} className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-white">{notice.company_name}</p>
                                    <p className="text-xs text-slate-500">{notice.notice_type} • {notice.layoff_date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">{notice.employees_affected}</p>
                                    <p className="text-xs text-slate-500">employees</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {data.factors && data.factors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-slate-500 mb-2">Risk Factors</p>
                            <div className="flex flex-wrap gap-2">
                                {data.factors.map((factor, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-black/30 rounded text-slate-400">
                                        {factor}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RegionSummary({ region, data, onClick, isSelected }) {
    const colors = regionColors[region] || regionColors["Central San Diego"];

    return (
        <button
            onClick={onClick}
            className={`w-full text-left ${colors.bg} border-2 ${isSelected ? 'border-white ring-2 ring-white/20' : colors.border} rounded-lg p-4 transition-all hover:scale-[1.02] hover:brightness-110 cursor-pointer`}
        >
            <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${colors.text}`}>{region}</span>
                <span className="text-xs text-slate-500">{data.notice_count} notices</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{data.total_employees.toLocaleString()}</p>
            <p className="text-xs text-slate-500">employees affected</p>
            {isSelected && <p className="text-xs text-white/70 mt-1">✓ Filtered</p>}
        </button>
    );
}

function TimelineItem({ notice }) {
    const colors = regionColors[notice.region] || regionColors["Central San Diego"];
    const daysUntil = Math.ceil((new Date(notice.layoff_date) - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${colors.border.replace('border', 'bg')}`}></div>
                <div className="w-0.5 h-full bg-slate-700"></div>
            </div>
            <div className="pb-6 flex-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-white">{notice.company_name}</p>
                        <p className="text-xs text-slate-500">{notice.city} • {notice.zipcode}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-white">{notice.employees_affected}</p>
                        <span className={`text-xs ${daysUntil <= 30 ? 'text-red-400' : daysUntil <= 60 ? 'text-yellow-400' : 'text-slate-500'}`}>
                            {daysUntil > 0 ? `${daysUntil} days` : 'Imminent'}
                        </span>
                    </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>{notice.region}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">{notice.notice_type}</span>
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-12">
            <div className="p-4 bg-slate-800/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No WARN Notices</h3>
            <p className="text-slate-400 text-sm">No layoff notices currently on file for San Diego County.</p>
            <p className="text-slate-500 text-xs mt-2">Data is refreshed every Tuesday and Thursday.</p>
        </div>
    );
}

export default function WarnDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [sortBy, setSortBy] = useState('risk');
    const [unemploymentData, setUnemploymentData] = useState(null);

    useEffect(() => {
        // Fetch WARN data
        fetch('/data/warn_data.json')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load data');
                return res.json();
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));

        // Fetch unemployment data
        fetch('/data/unemployment_data.json')
            .then(res => res.ok ? res.json() : null)
            .then(setUnemploymentData)
            .catch(() => { });
    }, []);

    const sortedZipCodes = useMemo(() => {
        if (!data?.risk_scores) return [];
        const entries = Object.entries(data.risk_scores);

        if (sortBy === 'risk') {
            const riskOrder = { 'Critical': 0, 'High': 1, 'Moderate': 2, 'Low': 3 };
            return entries.sort((a, b) => riskOrder[a[1].risk_level] - riskOrder[b[1].risk_level]);
        } else if (sortBy === 'employees') {
            return entries.sort((a, b) => b[1].total_employees - a[1].total_employees);
        }
        return entries.sort((a, b) => a[0].localeCompare(b[0]));
    }, [data?.risk_scores, sortBy]);

    const filteredZipCodes = useMemo(() => {
        if (!data?.notices) return sortedZipCodes;
        if (selectedRegion === 'all') return sortedZipCodes;
        return sortedZipCodes.filter(([zip]) => {
            const notice = data.notices.find(n => n.zipcode === zip);
            return notice?.region === selectedRegion;
        });
    }, [sortedZipCodes, selectedRegion, data?.notices]);

    const upcomingLayoffs = useMemo(() => {
        if (!data?.notices) return [];
        return [...data.notices]
            .filter(n => new Date(n.layoff_date) > new Date())
            .sort((a, b) => new Date(a.layoff_date) - new Date(b.layoff_date));
    }, [data?.notices]);

    const criticalCount = useMemo(() => {
        if (!data?.risk_scores) return 0;
        return Object.values(data.risk_scores).filter(r => r.risk_level === 'Critical' || r.risk_level === 'High').length;
    }, [data?.risk_scores]);

    const imminentCount = useMemo(() => {
        return upcomingLayoffs.filter(n => {
            const days = Math.ceil((new Date(n.layoff_date) - new Date()) / (1000 * 60 * 60 * 24));
            return days <= 30 && days > 0;
        }).length;
    }, [upcomingLayoffs]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-white rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading WARN data...</p>
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

    const hasData = data?.notices?.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Subtle grid overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-900/30 rounded-lg border border-red-800/50">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">WARN Monitor</h1>
                        </div>
                        <p className="text-slate-400">San Diego County • Pre-Distress Intelligence</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">Last updated</p>
                        <p className="text-sm text-slate-400">{data?.meta?.generated ? new Date(data.meta.generated).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        icon={Building2}
                        label="Active Notices"
                        value={data?.meta?.total_notices || 0}
                        subtext="In San Diego County"
                    />
                    <MetricCard
                        icon={Users}
                        label="Employees Affected"
                        value={(data?.meta?.total_employees_affected || 0).toLocaleString()}
                        subtext="Total displacement"
                    />
                    <MetricCard
                        icon={MapPin}
                        label="Zip Codes at Risk"
                        value={criticalCount}
                        subtext="High or Critical"
                    />
                    <MetricCard
                        icon={Calendar}
                        label="Next 30 Days"
                        value={imminentCount}
                        subtext="Imminent layoffs"
                    />
                </div>

                {!hasData ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Region Summary */}
                        {data?.by_region && Object.keys(data.by_region).length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <TrendingDown className="w-5 h-5 text-slate-500" />
                                        Impact by Region
                                        <span className="text-xs text-slate-500 font-normal">(click to filter)</span>
                                    </h2>
                                    {selectedRegion !== 'all' && (
                                        <button
                                            onClick={() => setSelectedRegion('all')}
                                            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700"
                                        >
                                            Clear filter
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    {Object.entries(data.by_region).map(([region, regionData]) => (
                                        <RegionSummary
                                            key={region}
                                            region={region}
                                            data={regionData}
                                            onClick={() => setSelectedRegion(selectedRegion === region ? 'all' : region)}
                                            isSelected={selectedRegion === region}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Zip Code Risk List */}
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-slate-500" />
                                        Zip Code Risk Analysis
                                    </h2>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedRegion}
                                            onChange={(e) => setSelectedRegion(e.target.value)}
                                            className="text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300"
                                        >
                                            <option value="all">All Regions</option>
                                            {data?.by_region && Object.keys(data.by_region).map(region => (
                                                <option key={region} value={region}>{region}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300"
                                        >
                                            <option value="risk">Sort by Risk</option>
                                            <option value="employees">Sort by Employees</option>
                                            <option value="zipcode">Sort by Zip Code</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {filteredZipCodes.map(([zipcode, riskData]) => (
                                        <ZipCodeCard
                                            key={zipcode}
                                            zipcode={zipcode}
                                            data={riskData}
                                            notices={data.notices}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* News Feed */}
                            <div className="space-y-6">
                                {/* Unemployment Chart */}
                                {unemploymentData && (
                                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-amber-500" />
                                                <h3 className="text-sm font-semibold text-white">SD Unemployment</h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-amber-400">{unemploymentData.currentRate}%</span>
                                                <p className="text-[10px] text-slate-500">Current Rate</p>
                                            </div>
                                        </div>
                                        <ResponsiveContainer width="100%" height={150}>
                                            <AreaChart data={unemploymentData.history.slice(-12).map(d => ({ ...d, month: d.date.split('-')[1] + '/' + d.date.split('-')[0].slice(2) }))}>
                                                <defs>
                                                    <linearGradient id="unemploymentGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                                                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} tickFormatter={v => `${v}%`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                                                    formatter={(value) => [`${value}%`, 'Rate']}
                                                />
                                                <Area type="monotone" dataKey="rate" stroke="#f59e0b" fill="url(#unemploymentGradient)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                        <p className="text-[10px] text-slate-600 text-center mt-2">Source: FRED (CASAND5URN)</p>
                                    </div>
                                )}
                                <NewsFeed />
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-600">
                        Threshold Advisory Group • Pre-Distress Intelligence Platform
                    </p>
                </div>
            </div>
        </div>
    );
}
