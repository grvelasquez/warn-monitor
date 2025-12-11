import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Area } from 'recharts';
import { MapPin, Home, TrendingUp, Store, Coffee, Building, DollarSign, Clock, Package, Filter } from 'lucide-react';

// Region groupings by ZIP prefix
const REGIONS = {
    all: { label: 'All', prefix: '' },
    downtown: { label: 'Downtown/Central', prefix: '921', zips: ['92101', '92102', '92103', '92104', '92105', '92108', '92110', '92111', '92113', '92114', '92115', '92116'] },
    coastal: { label: 'Coastal', prefix: '', zips: ['92106', '92107', '92109', '92118', '92037', '92014', '92024', '92007', '92075'] },
    north: { label: 'North County', prefix: '920', zips: ['92054', '92056', '92057', '92058', '92008', '92009', '92010', '92011', '92064', '92065', '92069', '92078', '92081', '92082', '92083', '92084'] },
    east: { label: 'East County', prefix: '919', zips: ['91901', '91941', '91942', '91945', '92040', '92071', '92119', '92120', '92124', '92131'] },
    south: { label: 'South Bay', prefix: '919', zips: ['91902', '91910', '91911', '91913', '91914', '91915', '91932', '91950', '92154', '92173'] },
};

// Color palette by region
const getRegionColor = (zipCode) => {
    if (zipCode.startsWith('921')) {
        // Central SD - Blues
        const blues = ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
        return blues[parseInt(zipCode.slice(-1)) % blues.length];
    } else if (['92106', '92107', '92109', '92118', '92037', '92014', '92024', '92007', '92075', '92130'].includes(zipCode)) {
        // Coastal - Teals
        const teals = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];
        return teals[parseInt(zipCode.slice(-1)) % teals.length];
    } else if (zipCode.startsWith('920') && parseInt(zipCode) >= 92054) {
        // North County - Purples
        const purples = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'];
        return purples[parseInt(zipCode.slice(-1)) % purples.length];
    } else if (zipCode.startsWith('919')) {
        // South/East - Oranges/Greens
        const warm = ['#ea580c', '#f97316', '#fb923c', '#16a34a', '#22c55e', '#4ade80'];
        return warm[parseInt(zipCode.slice(-1)) % warm.length];
    }
    return '#6b7280';
};

// Metric Card Component
function MetricCard({ label, value, sublabel, icon: Icon, color = 'blue', trend }) {
    const colors = {
        blue: 'bg-blue-900/30 border-blue-800/50 text-blue-400',
        green: 'bg-green-900/30 border-green-800/50 text-green-400',
        purple: 'bg-purple-900/30 border-purple-800/50 text-purple-400',
        orange: 'bg-orange-900/30 border-orange-800/50 text-orange-400',
        pink: 'bg-pink-900/30 border-pink-800/50 text-pink-400',
        cyan: 'bg-cyan-900/30 border-cyan-800/50 text-cyan-400',
    };
    return (
        <div className={`rounded-xl p-4 border ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend && <p className={`text-sm ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>{trend > 0 ? '+' : ''}{trend}% YoY</p>}
            {sublabel && <p className="text-xs opacity-60 mt-1">{sublabel}</p>}
        </div>
    );
}

// Neighborhood Card
function NeighborhoodCard({ data, sdarData, isSelected, onClick }) {
    const zipCode = data.neighborhood.split('-')[0];
    const color = getRegionColor(zipCode);
    const totalBusinesses = Object.values(data.categories || {}).reduce((sum, cat) => sum + (cat?.count || 0), 0);

    // Get SDAR housing data
    const housing = sdarData?.detached || {};
    const medianPrice = housing.median_price_2025;

    return (
        <button
            onClick={onClick}
            className={`rounded-xl p-3 border text-left transition-all w-full ${isSelected
                    ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                    : 'hover:bg-gray-700/50'
                }`}
            style={{
                backgroundColor: isSelected ? color + '20' : 'rgb(30 41 59 / 0.5)',
                borderColor: isSelected ? color : 'rgb(51 65 85 / 0.5)',
                '--tw-ring-color': color
            }}
        >
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-medium text-white text-sm truncate">{data.neighborhood.split('-').slice(1).join('-') || data.neighborhood}</span>
            </div>
            <div className="text-xs text-gray-400">{zipCode}</div>
            <div className="flex justify-between mt-2 text-xs">
                <div>
                    <span className="text-gray-500">Businesses</span>
                    <p className="text-white font-medium">{totalBusinesses.toLocaleString()}</p>
                </div>
                {medianPrice && (
                    <div className="text-right">
                        <span className="text-gray-500">Median</span>
                        <p className="text-green-400 font-medium">${(medianPrice / 1000).toFixed(0)}k</p>
                    </div>
                )}
            </div>
        </button>
    );
}

export default function NeighborhoodEvolution() {
    const [osmData, setOsmData] = useState(null);
    const [sdarData, setSdarData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
    const [activeView, setActiveView] = useState('overview');
    const [sortBy, setSortBy] = useState('name');

    // Fetch both OSM and SDAR data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [osmRes, sdarRes] = await Promise.all([
                    fetch('/data/retail_data.json'),
                    fetch('/data/sdar_neighborhood_data.json')
                ]);

                if (osmRes.ok) {
                    const osm = await osmRes.json();
                    setOsmData(osm);
                }
                if (sdarRes.ok) {
                    const sdar = await sdarRes.json();
                    setSdarData(sdar);
                }
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Map SDAR data by zip code
    const sdarByZip = useMemo(() => {
        if (!sdarData?.neighborhoods) return {};
        return sdarData.neighborhoods.reduce((acc, n) => {
            acc[n.zip_code] = n;
            return acc;
        }, {});
    }, [sdarData]);

    // Filter neighborhoods by region
    const filteredNeighborhoods = useMemo(() => {
        if (!osmData?.neighborhoods) return [];

        let filtered = osmData.neighborhoods;

        if (selectedRegion !== 'all' && REGIONS[selectedRegion]?.zips) {
            filtered = filtered.filter(n => {
                const zip = n.neighborhood.split('-')[0];
                return REGIONS[selectedRegion].zips.includes(zip);
            });
        }

        // Sort
        if (sortBy === 'price') {
            filtered = [...filtered].sort((a, b) => {
                const zipA = a.neighborhood.split('-')[0];
                const zipB = b.neighborhood.split('-')[0];
                const priceA = sdarByZip[zipA]?.detached?.median_price_2025 || 0;
                const priceB = sdarByZip[zipB]?.detached?.median_price_2025 || 0;
                return priceB - priceA;
            });
        } else if (sortBy === 'businesses') {
            filtered = [...filtered].sort((a, b) => {
                const countA = Object.values(a.categories || {}).reduce((s, c) => s + (c?.count || 0), 0);
                const countB = Object.values(b.categories || {}).reduce((s, c) => s + (c?.count || 0), 0);
                return countB - countA;
            });
        }

        return filtered;
    }, [osmData, selectedRegion, sortBy, sdarByZip]);

    // Get selected neighborhood's SDAR data
    const selectedSdarData = useMemo(() => {
        if (!selectedNeighborhood) return null;
        const zip = selectedNeighborhood.neighborhood.split('-')[0];
        return sdarByZip[zip];
    }, [selectedNeighborhood, sdarByZip]);

    // Chart data for comparison view
    const comparisonData = useMemo(() => {
        return filteredNeighborhoods.slice(0, 15).map(n => {
            const zip = n.neighborhood.split('-')[0];
            const sdar = sdarByZip[zip];
            const totalBiz = Object.values(n.categories || {}).reduce((s, c) => s + (c?.count || 0), 0);
            return {
                name: n.neighborhood.split('-').slice(1).join('-').substring(0, 12) || zip,
                fullName: n.neighborhood,
                businesses: totalBiz,
                medianPrice: sdar?.detached?.median_price_2025 || 0,
                dom: sdar?.detached?.dom_2025 || 0,
            };
        });
    }, [filteredNeighborhoods, sdarByZip]);

    // Summary stats
    const summaryStats = useMemo(() => {
        if (!sdarData?.summary) return {};
        return sdarData.summary;
    }, [sdarData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-gray-600 border-t-purple-500 rounded-full" />
            </div>
        );
    }

    if (!osmData && !sdarData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">No data available. Run data scripts:</p>
                    <code className="bg-gray-800 px-3 py-2 rounded text-sm block mb-2">python scripts/fetch_retail_data.py</code>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold">San Diego Neighborhoods</h1>
                    </div>
                    <p className="text-sm text-gray-400">
                        {sdarData?.meta?.neighborhoods_count || 0} zip codes • OSM Business Data + SDAR November 2025 Housing Data
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                        label="Avg Detached Median"
                        value={`$${((summaryStats.avg_detached_median || 0) / 1000).toFixed(0)}k`}
                        sublabel="November 2025"
                        icon={Home}
                        color="green"
                    />
                    <MetricCard
                        label="Avg Attached Median"
                        value={`$${((summaryStats.avg_attached_median || 0) / 1000).toFixed(0)}k`}
                        sublabel="November 2025"
                        icon={Building}
                        color="blue"
                    />
                    <MetricCard
                        label="Highest Median"
                        value={`$${((summaryStats.highest_detached || 0) / 1000000).toFixed(1)}M`}
                        sublabel="Luxury market"
                        icon={TrendingUp}
                        color="purple"
                    />
                    <MetricCard
                        label="Lowest Median"
                        value={`$${((summaryStats.lowest_detached || 0) / 1000).toFixed(0)}k`}
                        sublabel="Entry market"
                        icon={DollarSign}
                        color="orange"
                    />
                </div>

                {/* Region Filter */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Region:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(REGIONS).map(([key, { label }]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setSelectedRegion(key);
                                    setSelectedNeighborhood(null);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedRegion === key
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-gray-400">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700"
                        >
                            <option value="name">Name</option>
                            <option value="price">Median Price</option>
                            <option value="businesses">Business Count</option>
                        </select>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'overview' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Grid View
                    </button>
                    <button
                        onClick={() => setActiveView('compare')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'compare' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Compare Chart
                    </button>
                    {selectedNeighborhood && (
                        <button
                            onClick={() => setActiveView('details')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'details' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Details: {selectedNeighborhood.neighborhood.split('-').slice(1).join('-').substring(0, 15) || selectedNeighborhood.neighborhood.split('-')[0]}
                        </button>
                    )}
                </div>

                {/* Grid View */}
                {activeView === 'overview' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredNeighborhoods.map((n) => {
                            const zip = n.neighborhood.split('-')[0];
                            return (
                                <NeighborhoodCard
                                    key={n.neighborhood}
                                    data={n}
                                    sdarData={sdarByZip[zip]}
                                    isSelected={selectedNeighborhood?.neighborhood === n.neighborhood}
                                    onClick={() => {
                                        setSelectedNeighborhood(n);
                                        setActiveView('details');
                                    }}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Compare Chart */}
                {activeView === 'compare' && (
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4">Price vs Business Count (Top 15)</h3>
                        <ResponsiveContainer width="100%" height={450}>
                            <ComposedChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} fontSize={11} />
                                <YAxis yAxisId="left" stroke="#22c55e" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                                    formatter={(value, name) => [
                                        name === 'medianPrice' ? `$${(value / 1000).toFixed(0)}k` : value,
                                        name === 'medianPrice' ? 'Median Price' : name === 'businesses' ? 'Businesses' : name
                                    ]}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="medianPrice" name="Median Price" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="businesses" name="Businesses" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Details View */}
                {activeView === 'details' && selectedNeighborhood && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Business Data (OSM) */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Store className="w-5 h-5 text-purple-400" />
                                Business Data (OSM)
                            </h3>
                            <div className="space-y-2">
                                {Object.entries(selectedNeighborhood.categories || {})
                                    .filter(([, cat]) => cat?.count > 0)
                                    .sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0))
                                    .slice(0, 12)
                                    .map(([key, cat]) => (
                                        <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{cat.icon || '📍'}</span>
                                                <span className="text-white">{cat.label || key}</span>
                                            </div>
                                            <span className="text-purple-400 font-medium">{cat.count}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Housing Data (SDAR) */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Home className="w-5 h-5 text-green-400" />
                                Housing Data (SDAR November 2025)
                            </h3>
                            {selectedSdarData ? (
                                <div className="space-y-4">
                                    {/* Detached */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-400 mb-2">Detached Homes</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-xs text-gray-500">Median Price</p>
                                                <p className="text-lg font-bold text-green-400">
                                                    ${((selectedSdarData.detached?.median_price_2025 || 0) / 1000).toFixed(0)}k
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    vs ${((selectedSdarData.detached?.median_price_2024 || 0) / 1000).toFixed(0)}k (2024)
                                                </p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-xs text-gray-500">Days on Market</p>
                                                <p className="text-lg font-bold text-blue-400">
                                                    {selectedSdarData.detached?.dom_2025 || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    vs {selectedSdarData.detached?.dom_2024 || 'N/A'} (2024)
                                                </p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-xs text-gray-500">Inventory</p>
                                                <p className="text-lg font-bold text-orange-400">
                                                    {selectedSdarData.detached?.inventory_2025 || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-xs text-gray-500">Months Supply</p>
                                                <p className="text-lg font-bold text-purple-400">
                                                    {selectedSdarData.detached?.months_supply_2025 || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attached */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-400 mb-2">Attached/Condos</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-xs text-gray-500">Median Price</p>
                                                <p className="text-lg font-bold text-green-400">
                                                    ${((selectedSdarData.attached?.median_price_2025 || 0) / 1000).toFixed(0)}k
                                                </p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-xs text-gray-500">Days on Market</p>
                                                <p className="text-lg font-bold text-blue-400">
                                                    {selectedSdarData.attached?.dom_2025 || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400">No SDAR data available for this zip code</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>Business data: OpenStreetMap • Housing data: SDAR November 2025</p>
                    <p className="mt-1">Run <code className="bg-gray-800 px-1 rounded">python scripts/fetch_retail_data.py</code> to update OSM data</p>
                </div>
            </div>
        </div>
    );
}
