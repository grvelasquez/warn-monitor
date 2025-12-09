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

// Neighborhood row
function NeighborhoodRow({ name, data }) {
    const riskInfo = getRiskColor(data.risk);
    const unshelteredRate = Math.round((data.unsheltered / data.total) * 100);

    return (
        <div className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
            <div className={`w-2 h-2 ${riskInfo.bg} rounded-full flex-shrink-0`} />
            <span className="text-sm text-white flex-1 truncate">{name}</span>
            <span className="text-sm text-slate-400 w-12 text-right">{data.total}</span>
            <span className="text-xs text-slate-500 w-12 text-right">{unshelteredRate}%</span>
        </div>
    );
}

// Main component
export function HomelessSignals({ className = "" }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState('all');

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

    // Filter neighborhoods by region
    const filteredNeighborhoods = useMemo(() => {
        if (!data?.neighborhoods) return [];

        const entries = Object.entries(data.neighborhoods);

        // Sort by total descending
        entries.sort((a, b) => b[1].total - a[1].total);

        if (selectedRegion === 'all') return entries.slice(0, 12);

        // Simple region filtering based on neighborhood name patterns
        const regionPatterns = {
            central: ['Downtown', 'East Village', 'Gaslamp', 'Hillcrest', 'North Park', 'Normal Heights', 'South Park', 'University Heights', 'Mission Valley', 'Barrio Logan', 'Logan Heights', 'City Heights'],
            coastal: ['Pacific Beach', 'Ocean Beach', 'La Jolla', 'Mission Beach', 'Point Loma', 'Coronado'],
            south: ['Chula Vista', 'National City', 'Imperial Beach', 'San Ysidro'],
            east: ['El Cajon', 'La Mesa', 'Santee', 'Spring Valley', 'Lemon Grove'],
            north: ['Oceanside', 'Escondido', 'Vista', 'Carlsbad', 'Encinitas', 'San Marcos'],
        };

        if (regionPatterns[selectedRegion]) {
            return entries.filter(([name]) => regionPatterns[selectedRegion].includes(name));
        }

        return entries.slice(0, 12);
    }, [data, selectedRegion]);

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

            {/* Trend chart */}
            {historical && historical.length > 0 && (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-slate-400 mb-2">Historical Trend (Point-in-Time Count)</h4>
                    <ResponsiveContainer width="100%" height={100}>
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
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
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
                <div className="flex items-center gap-3 text-[10px] text-slate-500 pb-1 border-b border-slate-700">
                    <span className="w-2" />
                    <span className="flex-1">Neighborhood</span>
                    <span className="w-12 text-right">Total</span>
                    <span className="w-12 text-right">Unshltr</span>
                </div>

                {/* Rows */}
                <div className="max-h-48 overflow-y-auto">
                    {filteredNeighborhoods.map(([name, neighborhoodData]) => (
                        <NeighborhoodRow key={name} name={name} data={neighborhoodData} />
                    ))}
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
