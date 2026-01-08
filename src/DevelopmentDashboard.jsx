import { useState, useMemo, useEffect } from 'react';
import { Construction, Building2, Train, Hammer, TrendingUp, MapPin, Calendar, ArrowUpRight, Home, Warehouse, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Curated major projects - kept as these are manually verified
const MAJOR_PROJECTS = [
    { name: 'IQHQ Research District', location: 'Point Loma', type: 'Mixed Use', units: 0, sqft: '1.4M', status: 'Under Construction', completion: '2026', value: 1200 },
    { name: 'Riverwalk San Diego', location: 'Mission Valley', type: 'Mixed Use', units: 4300, sqft: '900K', status: 'Under Construction', completion: '2027', value: 2800 },
    { name: 'Horton Plaza Redevelopment', location: 'Downtown', type: 'Tech Campus', units: 0, sqft: '795K', status: 'Complete', completion: '2024', value: 400 },
    { name: 'San Diego State Mission Valley', location: 'Mission Valley', type: 'Stadium/Residential', units: 4600, sqft: '1.6M', status: 'Under Construction', completion: '2027', value: 3500 },
    { name: 'Newland Sierra', location: 'North County', type: 'Master Planned', units: 2135, sqft: '81K', status: 'Approved', completion: '2030', value: 850 },
    { name: 'Seaport San Diego', location: 'Downtown Waterfront', type: 'Mixed Use', units: 0, sqft: '4M', status: 'Under Construction', completion: '2027', value: 2200 },
    { name: 'One Paseo', location: 'Carmel Valley', type: 'Mixed Use', units: 608, sqft: '471K', status: 'Complete', completion: '2024', value: 600 },
    { name: 'Pacific Gate', location: 'Downtown', type: 'Residential', units: 215, sqft: '0', status: 'Complete', completion: '2024', value: 180 },
];

const TRANSIT_PROJECTS = [
    { name: 'Mid-Coast Trolley Extension', status: 'Complete', impact: 'La Jolla, UTC, UCSD access' },
    { name: 'Central Mobility Hub', status: 'Planning', impact: 'Downtown transit center' },
    { name: 'Purple Line (Kearny Mesa)', status: 'Environmental Review', impact: 'North-South corridor' },
    { name: 'South Bay Rapid', status: 'Under Construction', impact: 'Otay Mesa, Chula Vista' },
];

const HOT_ZONES = [
    { area: 'Mission Valley', trend: 'up', reason: 'Stadium site + Riverwalk', growth: 45 },
    { area: 'Downtown', trend: 'up', reason: 'Seaport + office conversions', growth: 32 },
    { area: 'UTC/La Jolla', trend: 'up', reason: 'Mid-Coast Trolley completed', growth: 28 },
    { area: 'North County', trend: 'neutral', reason: 'Water constraints', growth: 8 },
    { area: 'East County', trend: 'up', reason: 'Affordable new builds', growth: 22 },
];

// Default fallback data
const DEFAULT_DATA = {
    summary: { totalPermits: 4823, residentialUnits: 8420, totalValue: 2.1 },
    permitsByRegion: [
        { region: 'Coastal', permits: 412, value: 285, units: 580 },
        { region: 'Urban San Diego', permits: 1245, value: 892, units: 3240 },
        { region: 'Central San Diego', permits: 986, value: 425, units: 1850 },
        { region: 'North County Inland', permits: 892, value: 315, units: 1420 },
        { region: 'East County', permits: 745, value: 198, units: 890 },
        { region: 'South County', permits: 543, value: 235, units: 440 },
    ],
    permitsByType: [
        { type: 'Single Family', count: 1842, color: '#14b8a6' },
        { type: 'Multi-Family', count: 1456, color: '#3b82f6' },
        { type: 'Mixed Use', count: 623, color: '#a855f7' },
        { type: 'Commercial', count: 512, color: '#f59e0b' },
        { type: 'Renovation', count: 390, color: '#6366f1' },
    ],
};

// Format functions
const formatCurrency = (val) => `$${val.toLocaleString()}`;
const formatNumber = (val) => val?.toLocaleString() || '0';

function StatCard({ title, value, subtitle, icon: Icon, color, change }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between">
                <div className={`p-2 ${color} rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <ArrowUpRight className="w-3 h-3" />
                        {change >= 0 ? '+' : ''}{change}%
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                <p className="text-sm text-slate-400 mt-1">{title}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function ProjectCard({ project }) {
    const statusColors = {
        'Complete': 'bg-green-900/50 text-green-400 border-green-700/50',
        'Under Construction': 'bg-amber-900/50 text-amber-400 border-amber-700/50',
        'Approved': 'bg-blue-900/50 text-blue-400 border-blue-700/50',
        'Planning': 'bg-purple-900/50 text-purple-400 border-purple-700/50',
        'Environmental Review': 'bg-slate-700/50 text-slate-300 border-slate-600/50',
    };

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h4 className="text-sm font-semibold text-white">{project.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                    </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${statusColors[project.status]}`}>
                    {project.status}
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                {project.units > 0 && (
                    <div>
                        <p className="text-lg font-bold text-teal-400">{formatNumber(project.units)}</p>
                        <p className="text-[10px] text-slate-500">Units</p>
                    </div>
                )}
                {project.sqft !== '0' && (
                    <div>
                        <p className="text-lg font-bold text-blue-400">{project.sqft}</p>
                        <p className="text-[10px] text-slate-500">Sq Ft</p>
                    </div>
                )}
                <div>
                    <p className="text-lg font-bold text-amber-400">${project.value}M</p>
                    <p className="text-[10px] text-slate-500">Value</p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">{project.type}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {project.completion}
                </span>
            </div>
        </div>
    );
}

function HotZoneIndicator({ zone }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${zone.trend === 'up' ? 'bg-green-500' : zone.trend === 'down' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <span className="text-sm text-white">{zone.area}</span>
            </div>
            <div className="text-right">
                <span className={`text-sm font-bold ${zone.growth >= 20 ? 'text-green-400' : zone.growth >= 10 ? 'text-amber-400' : 'text-slate-400'}`}>
                    +{zone.growth}%
                </span>
                <p className="text-[10px] text-slate-500">{zone.reason}</p>
            </div>
        </div>
    );
}

export default function DevelopmentDashboard() {
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/data/development_data.json')
            .then(res => res.ok ? res.json() : null)
            .then(json => setData(json))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    // Use fetched data or fallback
    const devData = data || DEFAULT_DATA;

    const filteredProjects = useMemo(() => {
        if (selectedStatus === 'all') return MAJOR_PROJECTS;
        return MAJOR_PROJECTS.filter(p => p.status === selectedStatus);
    }, [selectedStatus]);

    const chartData = (devData.permitsByRegion || []).map(r => ({
        ...r,
        name: r.region.replace('San Diego', 'SD'),
    }));

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-orange-500 rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading development data...</p>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-900/30 rounded-lg border border-orange-800/50">
                                <Construction className="w-5 sm:w-6 h-5 sm:h-6 text-orange-400" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Development</h1>
                            {data && <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-full">LIVE</span>}
                        </div>
                        <p className="text-sm sm:text-base text-slate-400">San Diego County • Construction & Infrastructure Pipeline</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">{data ? 'City + County Data' : 'Curated Data'}</p>
                        <p className="text-sm text-slate-400">{data?.meta?.generated ? new Date(data.meta.generated).toLocaleDateString() : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Investor Insight Banner */}
                <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-700/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-orange-400" />
                        Investor Insight
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div>
                            <p className="text-xs text-orange-400 uppercase tracking-wide mb-1">Highest Activity</p>
                            <p className="text-xl font-bold text-white">Mission Valley</p>
                            <p className="text-xs text-slate-400 mt-1">8,900+ units in pipeline</p>
                        </div>
                        <div>
                            <p className="text-xs text-orange-400 uppercase tracking-wide mb-1">Fastest Growing</p>
                            <p className="text-xl font-bold text-white">East County</p>
                            <p className="text-xs text-slate-400 mt-1">+22% YoY permit growth</p>
                        </div>
                        <div>
                            <p className="text-xs text-orange-400 uppercase tracking-wide mb-1">Transit Premium</p>
                            <p className="text-xl font-bold text-white">UTC/La Jolla</p>
                            <p className="text-xs text-slate-400 mt-1">Mid-Coast Trolley impact</p>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <StatCard
                        title="Building Permits"
                        value={formatNumber(devData.summary?.totalPermits)}
                        subtitle="YTD"
                        icon={Hammer}
                        color="bg-orange-600"
                    />
                    <StatCard
                        title="Residential Units"
                        value={formatNumber(devData.summary?.residentialUnits)}
                        subtitle="In pipeline"
                        icon={Home}
                        color="bg-teal-600"
                    />
                    <StatCard
                        title="Total Value"
                        value={`$${devData.summary?.totalValue || 2.1}B`}
                        subtitle="Permit value"
                        icon={Building2}
                        color="bg-blue-600"
                    />
                    <StatCard
                        title="Major Projects"
                        value={MAJOR_PROJECTS.length}
                        subtitle="$10B+ total"
                        icon={Building}
                        color="bg-amber-600"
                    />
                    <StatCard
                        title="Transit Projects"
                        value={TRANSIT_PROJECTS.length}
                        subtitle="In progress"
                        icon={TrendingUp}
                        color="bg-purple-600"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
                    {/* Permits by Region */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-slate-500" />
                            Permits by Region
                        </h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" fontSize={11} />
                                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={90} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    formatter={(value, name) => [formatNumber(value), name === 'permits' ? 'Permits' : name]}
                                />
                                <Bar dataKey="permits" fill="#f97316" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Permits by Type */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-slate-500" />
                            Permits by Type
                        </h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={devData.permitsByType || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="type"
                                >
                                    {(devData.permitsByType || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    formatter={(value) => [formatNumber(value), 'Permits']}
                                />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Major Projects & Hot Zones */}
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    {/* Major Projects */}
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Warehouse className="w-5 h-5 text-slate-500" />
                                Major Projects
                            </h2>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="text-xs bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-300"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Under Construction">Under Construction</option>
                                <option value="Complete">Complete</option>
                                <option value="Approved">Approved</option>
                            </select>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {filteredProjects.map((project, idx) => (
                                <ProjectCard key={idx} project={project} />
                            ))}
                        </div>
                    </div>

                    {/* Hot Zones & Transit */}
                    <div className="space-y-6">
                        {/* Hot Investment Zones */}
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                Growth Zones
                            </h3>
                            <div className="space-y-1">
                                {HOT_ZONES.map((zone, idx) => (
                                    <HotZoneIndicator key={idx} zone={zone} />
                                ))}
                            </div>
                        </div>

                        {/* Transit Projects */}
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Train className="w-4 h-4 text-blue-500" />
                                Transit Developments
                            </h3>
                            <div className="space-y-3">
                                {TRANSIT_PROJECTS.map((project, idx) => (
                                    <div key={idx} className="border-b border-slate-700/30 last:border-0 pb-2 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-white">{project.name}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${project.status === 'Complete' ? 'bg-green-900/50 text-green-400' :
                                                project.status === 'Under Construction' ? 'bg-amber-900/50 text-amber-400' :
                                                    'bg-slate-700/50 text-slate-400'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{project.impact}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-500">Data sources: SanGIS, SANDAG, City of San Diego • Updated quarterly</p>
                    <p className="text-xs text-slate-600">Gregory Velasquez | LPT Realty | DRE #02252032</p>
                </div>
            </div>
        </div>
    );
}
