import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, Legend } from 'recharts';
import { Home, TrendingUp, TrendingDown, MapPin, Clock, Package, DollarSign } from 'lucide-react';

// Format helpers
const formatPrice = (val) => val ? `$${(val / 1000).toFixed(0)}K` : 'N/A';
const formatPriceFull = (val) => val ? `$${val.toLocaleString()}` : 'N/A';

// Price tier colors
const getPriceTier = (price) => {
    if (!price) return { label: 'N/A', color: 'bg-slate-700', textColor: 'text-slate-400' };
    if (price >= 2000000) return { label: 'Luxury', color: 'bg-purple-900/50', textColor: 'text-purple-400' };
    if (price >= 1000000) return { label: 'Premium', color: 'bg-blue-900/50', textColor: 'text-blue-400' };
    if (price >= 700000) return { label: 'Mid-Range', color: 'bg-green-900/50', textColor: 'text-green-400' };
    return { label: 'Entry', color: 'bg-amber-900/50', textColor: 'text-amber-400' };
};

// Stat card component
function StatCard({ label, value, sublabel, icon: Icon, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-900/30 border-blue-800/50 text-blue-400',
        green: 'bg-green-900/30 border-green-800/50 text-green-400',
        purple: 'bg-purple-900/30 border-purple-800/50 text-purple-400',
        amber: 'bg-amber-900/30 border-amber-800/50 text-amber-400',
    };

    return (
        <div className={`rounded-xl p-4 border ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            {sublabel && <p className="text-xs opacity-60 mt-1">{sublabel}</p>}
        </div>
    );
}

// Neighborhood card
function NeighborhoodCard({ data, propertyType }) {
    const metrics = data[propertyType] || {};
    const price = metrics.median_price_2025;
    const tier = getPriceTier(price);
    const dom = metrics.dom_2025;
    const inventory = metrics.inventory_2025;

    return (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/60 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-white">{data.neighborhood}</h3>
                    <p className="text-xs text-slate-500">{data.zip_code}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${tier.color} ${tier.textColor}`}>
                    {tier.label}
                </span>
            </div>

            <div className="text-2xl font-bold text-white mb-3">
                {formatPriceFull(price)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{dom ? `${dom} days` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                    <Package className="w-3 h-3" />
                    <span>{inventory ? `${inventory} homes` : 'N/A'}</span>
                </div>
            </div>
        </div>
    );
}

export function SDARNeighborhoodDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [propertyType, setPropertyType] = useState('detached');
    const [sortBy, setSortBy] = useState('price_desc');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        // Fetch main data first
        fetch('/data/sdar_neighborhood_data.json')
            .then(res => res.json())
            .then(sdarData => {
                setData(sdarData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load main neighborhood data:', err);
                setLoading(false);
            });
    }, []);

    // Sort and filter neighborhoods
    const sortedNeighborhoods = useMemo(() => {
        if (!data?.neighborhoods) return [];

        let items = [...data.neighborhoods].filter(n =>
            n[propertyType]?.median_price_2025 != null
        );

        switch (sortBy) {
            case 'price_asc':
                items.sort((a, b) =>
                    (a[propertyType]?.median_price_2025 || 0) - (b[propertyType]?.median_price_2025 || 0)
                );
                break;
            case 'name_asc':
                items.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
                break;
            case 'dom_asc':
                items.sort((a, b) =>
                    (a[propertyType]?.dom_2025 || 999) - (b[propertyType]?.dom_2025 || 999)
                );
                break;
            case 'change_best':
                items.sort((a, b) =>
                    (b[propertyType]?.median_price_pct_change || -999) - (a[propertyType]?.median_price_pct_change || -999)
                );
                break;
            case 'change_worst':
                items.sort((a, b) =>
                    (a[propertyType]?.median_price_pct_change || 999) - (b[propertyType]?.median_price_pct_change || 999)
                );
                break;
            default: // price_desc
                items.sort((a, b) =>
                    (b[propertyType]?.median_price_2025 || 0) - (a[propertyType]?.median_price_2025 || 0)
                );
        }

        return items;
    }, [data, propertyType, sortBy]);

    // Chart data for price comparison
    const chartData = useMemo(() => {
        return sortedNeighborhoods.slice(0, 15).map(n => ({
            name: n.neighborhood || n.zip_code || 'Unknown',
            price: n[propertyType]?.median_price_2025 || 0,
            dom: n[propertyType]?.dom_2025 || 0,
        }));
    }, [sortedNeighborhoods, propertyType]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                Loading neighborhood data...
            </div>
        );
    }

    if (!data || !data.neighborhoods?.length) {
        return (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
                <p className="text-slate-400 mb-2">No neighborhood data available</p>
                <p className="text-xs text-slate-500">Run: python scripts/process_sdar_pdfs.py</p>
            </div>
        );
    }

    const displayedNeighborhoods = showAll ? sortedNeighborhoods : sortedNeighborhoods.slice(0, 8);

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Avg Detached"
                    value={formatPriceFull(data.summary?.avg_detached_median)}
                    sublabel={`${data.meta?.neighborhoods_count} areas`}
                    icon={Home}
                    color="blue"
                />
                <StatCard
                    label="Avg Attached"
                    value={formatPriceFull(data.summary?.avg_attached_median)}
                    sublabel="Condos/Townhomes"
                    icon={Home}
                    color="green"
                />
                <StatCard
                    label="Highest"
                    value={formatPriceFull(data.summary?.highest_detached)}
                    sublabel="Detached median"
                    icon={TrendingUp}
                    color="purple"
                />
                <StatCard
                    label="Most Affordable"
                    value={formatPriceFull(data.summary?.lowest_detached)}
                    sublabel="Detached median"
                    icon={TrendingDown}
                    color="amber"
                />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    <button
                        onClick={() => setPropertyType('detached')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${propertyType === 'detached'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        🏠 Detached
                    </button>
                    <button
                        onClick={() => setPropertyType('attached')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${propertyType === 'attached'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        🏢 Attached
                    </button>
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
                >
                    <option value="price_desc">Price: High to Low</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="change_best">% Change: Best to Worst</option>
                    <option value="change_worst">% Change: Worst to Best</option>
                    <option value="name_asc">Name: A-Z</option>
                    <option value="dom_asc">Fastest Selling</option>
                </select>

                <span className="text-xs text-slate-500">
                    {data.meta?.report_period} • {sortedNeighborhoods.length} areas
                </span>
            </div>

            {/* Price Comparison Chart */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-4">
                    Median Price by Neighborhood ({propertyType === 'detached' ? 'Single Family' : 'Condos/Townhomes'})
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis
                                type="number"
                                tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                                stroke="#64748b"
                                fontSize={10}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={10}
                                width={80}
                            />
                            <Tooltip
                                formatter={(val) => formatPriceFull(val)}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            />
                            <Bar
                                dataKey="price"
                                fill={propertyType === 'detached' ? '#3b82f6' : '#22c55e'}
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Neighborhood Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-400">
                        All Neighborhoods
                    </h3>
                    {sortedNeighborhoods.length > 8 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                        >
                            {showAll ? 'Show Less' : `Show All (${sortedNeighborhoods.length})`}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {displayedNeighborhoods.map((n) => (
                        <NeighborhoodCard
                            key={n.zip_code}
                            data={n}
                            propertyType={propertyType}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SDARNeighborhoodDashboard;
