import { useState, useEffect, useMemo } from 'react';
import { Home, Users, TrendingUp, TrendingDown, MapPin, AlertTriangle, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Risk colors
const getRiskColor = (risk) => {
    if (risk === 'critical') return { bg: 'bg-red-500', text: 'text-red-400' };
    if (risk === 'high') return { bg: 'bg-orange-500', text: 'text-orange-400' };
    if (risk === 'moderate') return { bg: 'bg-yellow-500', text: 'text-yellow-400' };
    return { bg: 'bg-green-500', text: 'text-green-400' };
};

// Stat card
function StatCard({ label, value, subValue, trend, icon: Icon, color = "text-slate-400" }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend > 0 ? '+' : ''}{trend}% YoY
                </div>
            )}
        </div>
    );
}

// Neighborhood to zip code mapping
const neighborhoodZipCodes = {
    'Downtown': '92101',
    'East Village': '92101',
    'Gaslamp': '92101',
    'Barrio Logan': '92113',
    'Logan Heights': '92113',
    'City Heights': '92105',
    'Hillcrest': '92103',
    'North Park': '92104',
    'Normal Heights': '92116',
    'University Heights': '92104',
    'South Park': '92102',
    'Mission Valley': '92108',
    'Pacific Beach': '92109',
    'Ocean Beach': '92107',
    'La Jolla': '92037',
    'Mission Beach': '92109',
    'Point Loma': '92106',
    'Chula Vista': '91910',
    'National City': '91950',
    'Imperial Beach': '91932',
    'San Ysidro': '92173',
    'El Cajon': '92020',
    'La Mesa': '91942',
    'Santee': '92071',
    'Spring Valley': '91977',
    'Oceanside': '92054',
    'Escondido': '92025',
    'Vista': '92083',
    'Carlsbad': '92008',
    'Encinitas': '92024',
    'San Marcos': '92069',
};

// Neighborhood row
function NeighborhoodRow({ name, data }) {
    const riskInfo = getRiskColor(data.risk);
    const unshelteredRate = Math.round((data.unsheltered / data.total) * 100);
    const zipCode = neighborhoodZipCodes[name] || '';

    return (
        <div className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
            <div className={`w-2 h-2 ${riskInfo.bg} rounded-full flex-shrink-0`} />
            <span className="text-sm text-white flex-1 truncate">
                {name} {zipCode && <span className="text-slate-500">({zipCode})</span>}
            </span>
            <span className="text-sm text-slate-400 w-16 text-right">{data.total}</span>
            <span className="text-xs text-slate-500 w-16 text-right">{unshelteredRate}%</span>
        </div>
    );
}

// Main component
export function HomelessSignals({ className = "" }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/data/homeless_data.json');
                if (res.ok) setData(await res.json());
            } catch (err) {
                console.error('Homeless data fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // Filter neighborhoods by region
    const filteredNeighborhoods = useMemo(() => {
        if (!data?.neighborhoods) return [];

        const entries = Object.entries(data.neighborhoods);

        // Filter first
        let filtered = [...entries];
        if (selectedRegion !== 'all') {
            const regionPatterns = {
                central: ['Downtown', 'East Village', 'Gaslamp', 'Hillcrest', 'North Park', 'Normal Heights', 'South Park', 'University Heights', 'Mission Valley', 'Barrio Logan', 'Logan Heights', 'City Heights'],
                coastal: ['Pacific Beach', 'Ocean Beach', 'La Jolla', 'Mission Beach', 'Point Loma', 'Coronado'],
                south: ['Chula Vista', 'National City', 'Imperial Beach', 'San Ysidro'],
                east: ['El Cajon', 'La Mesa', 'Santee', 'Spring Valley', 'Lemon Grove'],
                north: ['Oceanside', 'Escondido', 'Vista', 'Carlsbad', 'Encinitas', 'San Marcos'],
            };
            if (regionPatterns[selectedRegion]) {
                filtered = filtered.filter(([name]) => regionPatterns[selectedRegion].includes(name));
            }
        }

        // Then Sort
        return filtered.sort((a, b) => {
            let aValue = 0, bValue = 0;
            const itemA = a[1] || {};
            const itemB = b[1] || {};

            if (sortConfig.key === 'name') {
                aValue = a[0];
                bValue = b[0];
            } else if (sortConfig.key === 'unshelteredRate') {
                aValue = itemA.total > 0 ? (itemA.unsheltered / itemA.total) : 0;
                bValue = itemB.total > 0 ? (itemB.unsheltered / itemB.total) : 0;
            } else {
                aValue = itemA[sortConfig.key] || 0;
                bValue = itemB[sortConfig.key] || 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, selectedRegion, sortConfig]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-24">
                <div className="animate-spin w-5 h-5 border-2 border-slate-600 border-t-red-500 rounded-full" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm">
                    Run <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">python scripts/fetch_homeless_data.py</code> to load data
                </p>
            </div>
        );
    }

    const { summary, historical } = data;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard
                    label="County Total"
                    value={summary.county_total.toLocaleString()}
                    subValue="2024 PIT Count"
                    trend={summary.yoy_change_percent}
                    icon={Users}
                    color="text-red-400"
                />
                <StatCard
                    label="Unsheltered"
                    value={summary.county_unsheltered.toLocaleString()}
                    subValue={`${summary.unsheltered_rate}% of total`}
                    icon={Home}
                    color="text-orange-400"
                />
                <StatCard
                    label="Sheltered"
                    value={summary.county_sheltered.toLocaleString()}
                    subValue="In shelters/transitional"
                    icon={Home}
                    color="text-green-400"
                />
                <StatCard
                    label="Downtown"
                    value={data.neighborhoods?.Downtown?.total?.toLocaleString() || 'N/A'}
                    subValue="Highest concentration"
                    icon={MapPin}
                    color="text-purple-400"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Trend chart */}
                {historical && historical.length > 0 && (
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 h-fit">
                        <h4 className="text-xs font-medium text-slate-400 mb-2">Historical Trend (Point-in-Time Count)</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={historical}>
                                <defs>
                                    <linearGradient id="homelessGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis hide domain={['dataMin - 500', 'dataMax + 500']} />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                    labelStyle={{ color: '#fff' }}
                                    formatter={(value) => [value.toLocaleString(), 'Total']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#ef4444" fill="url(#homelessGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Neighborhoods by risk */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 h-fit">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-medium text-slate-400">By Neighborhood</h4>
                        <div className="relative">
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="appearance-none bg-slate-700 border border-slate-600 rounded px-2 py-1 pr-6 text-xs text-white cursor-pointer"
                            >
                                <option value="all">All Regions</option>
                                <option value="central">Central SD</option>
                                <option value="coastal">Coastal</option>
                                <option value="south">South Bay</option>
                                <option value="east">East County</option>
                                <option value="north">North County</option>
                            </select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 pb-1 border-b border-slate-700 select-none pr-4">
                        <span className="w-2" />
                        <button onClick={() => handleSort('name')} className="flex-1 text-left hover:text-slate-300 transition-colors flex items-center gap-1">
                            Neighborhood
                            {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </button>
                        <button onClick={() => handleSort('total')} className="w-16 text-right hover:text-slate-300 transition-colors flex items-center justify-end gap-1">
                            Total
                            {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </button>
                        <button onClick={() => handleSort('unshelteredRate')} className="w-16 text-right hover:text-slate-300 transition-colors flex items-center justify-end gap-1">
                            Unshltr
                            {sortConfig.key === 'unshelteredRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </button>
                    </div>

                    {/* Rows */}
                    <div className="max-h-[400px] overflow-y-auto pr-4">
                        {filteredNeighborhoods.map(([name, neighborhoodData]) => (
                            <NeighborhoodRow key={name} name={name} data={neighborhoodData} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-500">
                <span>Risk Level:</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> Critical</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full" /> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> Moderate</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> Low</span>
            </div>
        </div>
    );
}

export default HomelessSignals;
