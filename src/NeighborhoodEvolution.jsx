import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { MapPin, Home, TrendingUp, Building, DollarSign, Clock, Package, Filter, ArrowUpDown } from 'lucide-react';

// Region groupings by ZIP prefix (for SDAR)
const REGIONS = {
    all: { label: 'All', zips: null },
    downtown: { label: 'Downtown/Central', zips: ['92101', '92102', '92103', '92104', '92105', '92108', '92110', '92111', '92113', '92114', '92115', '92116'] },
    coastal: { label: 'Coastal', zips: ['92106', '92107', '92109', '92118', '92037', '92014', '92024', '92007', '92075', '92130'] },
    north: { label: 'North County', zips: ['92054', '92056', '92057', '92058', '92008', '92009', '92010', '92011', '92064', '92065', '92067', '92069', '92078', '92081', '92082', '92083', '92084', '92091'] },
    east: { label: 'East County', zips: ['91901', '91941', '91942', '91945', '92040', '92071', '92119', '92120', '92124', '92131', '92127', '92128', '92129'] },
    south: { label: 'South Bay', zips: ['91902', '91910', '91911', '91913', '91914', '91915', '91932', '91935', '91945', '91950', '92139', '92154', '92173'] },
};

// Map Yelp neighborhoods to SDAR zip codes


// Color palette by region
const getRegionColor = (zipCode) => {
    if (['92101', '92102', '92103', '92104', '92105', '92108', '92110', '92111', '92113', '92114', '92115', '92116'].includes(zipCode)) {
        const blues = ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
        return blues[parseInt(zipCode.slice(-1)) % blues.length];
    } else if (['92106', '92107', '92109', '92118', '92037', '92014', '92024', '92007', '92075', '92130'].includes(zipCode)) {
        const teals = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];
        return teals[parseInt(zipCode.slice(-1)) % teals.length];
    } else if (zipCode.startsWith('920') && parseInt(zipCode) >= 92054) {
        const purples = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'];
        return purples[parseInt(zipCode.slice(-1)) % purples.length];
    } else if (zipCode.startsWith('919')) {
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
            {trend !== undefined && <p className={`text-sm ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>{trend > 0 ? '+' : ''}{trend.toFixed(1)}% YoY</p>}
            {sublabel && <p className="text-xs opacity-60 mt-1">{sublabel}</p>}
        </div>
    );
}

// Neighborhood Card (SDAR + Yelp data)
function NeighborhoodCard({ data, isSelected, onClick }) {
    const color = getRegionColor(data.zip_code);
    const detached = data.detached || {};

    const priceChange = detached.median_price_2024 && detached.median_price_2025
        ? ((detached.median_price_2025 - detached.median_price_2024) / detached.median_price_2024 * 100)
        : null;

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
                <span className="font-medium text-white text-sm truncate">{data.neighborhood}</span>
            </div>
            <div className="text-xs text-gray-400 mb-2">{data.zip_code}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <span className="text-gray-500">Median</span>
                    <p className="text-green-400 font-medium">
                        ${detached.median_price_2025 ? (detached.median_price_2025 / 1000).toFixed(0) + 'k' : 'N/A'}
                    </p>
                </div>
                <div>
                    <span className="text-gray-500">DOM</span>
                    <p className="text-blue-400 font-medium">{detached.dom_2025 || 'N/A'}</p>
                </div>
            </div>
            {priceChange !== null && (
                <div className={`mt-2 text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(1)}% YoY
                </div>
            )}
        </button>
    );
}

export default function NeighborhoodEvolution() {
    const [sdarData, setSdarData] = useState(null);

    const [zillowData, setZillowData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
    const [activeView, setActiveView] = useState('overview');
    const [sortBy, setSortBy] = useState('name');
    const [propertyType, setPropertyType] = useState('detached');

    // Fetch SDAR, Yelp, and Zillow data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sdarRes, zillowRes] = await Promise.all([
                    fetch('/data/sdar_neighborhood_data.json'),
                    fetch('/data/zillow_rental_data.json')
                ]);

                if (sdarRes.ok) {
                    const data = await sdarRes.json();
                    setSdarData(data);
                    if (data.neighborhoods?.length > 0) {
                        setSelectedNeighborhood(data.neighborhoods[0]);
                    }
                }
                if (zillowRes.ok) {
                    const data = await zillowRes.json();
                    setZillowData(data);
                }
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);



    // Map Zillow rent data by zip code
    const zillowByZip = useMemo(() => {
        if (!zillowData?.neighborhoods) return {};
        const map = {};
        zillowData.neighborhoods.forEach(n => {
            map[n.zip_code] = n;
        });
        return map;
    }, [zillowData]);

    // Filter neighborhoods by region
    const filteredNeighborhoods = useMemo(() => {
        if (!sdarData?.neighborhoods) return [];

        let filtered = sdarData.neighborhoods;

        if (selectedRegion !== 'all' && REGIONS[selectedRegion]?.zips) {
            filtered = filtered.filter(n => REGIONS[selectedRegion].zips.includes(n.zip_code));
        }

        // Sort
        if (sortBy === 'price') {
            filtered = [...filtered].sort((a, b) => {
                const priceA = propertyType === 'detached'
                    ? (a.detached?.median_price_2025 || 0)
                    : (a.attached?.median_price_2025 || 0);
                const priceB = propertyType === 'detached'
                    ? (b.detached?.median_price_2025 || 0)
                    : (b.attached?.median_price_2025 || 0);
                return priceB - priceA;
            });
        } else if (sortBy === 'change') {
            filtered = [...filtered].sort((a, b) => {
                const calcChange = (n) => {
                    const prop = propertyType === 'detached' ? n.detached : n.attached;
                    if (!prop?.median_price_2024 || !prop?.median_price_2025) return -999;
                    return ((prop.median_price_2025 - prop.median_price_2024) / prop.median_price_2024 * 100);
                };
                return calcChange(b) - calcChange(a);
            });
        } else if (sortBy === 'dom') {
            filtered = [...filtered].sort((a, b) => {
                const domA = propertyType === 'detached' ? (a.detached?.dom_2025 || 999) : (a.attached?.dom_2025 || 999);
                const domB = propertyType === 'detached' ? (b.detached?.dom_2025 || 999) : (b.attached?.dom_2025 || 999);
                return domA - domB;
            });
        }


        return filtered;
    }, [sdarData, selectedRegion, sortBy, propertyType]);



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

    if (!sdarData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">No SDAR housing data available</p>
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
                        <h1 className="text-xl sm:text-2xl font-bold">SD County Neighborhoods</h1>
                    </div>
                    <p className="text-sm text-gray-400">
                        {sdarData?.meta?.neighborhoods_count || 0} zip codes • SDAR Housing + Zillow Rentals
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                        label="Avg Detached Median"
                        value={`$${((summaryStats.avg_detached_median || 0) / 1000).toFixed(0)}k`}
                        sublabel="County-wide"
                        icon={Home}
                        color="green"
                    />
                    <MetricCard
                        label="Avg Attached Median"
                        value={`$${((summaryStats.avg_attached_median || 0) / 1000).toFixed(0)}k`}
                        sublabel="Condos/Townhomes"
                        icon={Building}
                        color="blue"
                    />
                    <MetricCard
                        label="Median Rent"
                        value={`$${(zillowData?.summary?.avg_rent || 0).toLocaleString()}`}
                        sublabel={zillowData?.summary?.avg_yoy_change ? `${zillowData.summary.avg_yoy_change > 0 ? '+' : ''}${zillowData.summary.avg_yoy_change}% YoY` : 'Zillow ZORI'}
                        icon={Home}
                        color="purple"
                        trend={zillowData?.summary?.avg_yoy_change > 0 ? 'up' : zillowData?.summary?.avg_yoy_change < 0 ? 'down' : null}
                    />

                </div>

                {/* Filters Row */}
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
                </div>

                {/* Sort & Property Type */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="price">Sort by Price (High→Low)</option>
                            <option value="change">Sort by YoY Change</option>
                            <option value="dom">Sort by Days on Market</option>

                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        <select
                            value={propertyType}
                            onChange={(e) => setPropertyType(e.target.value)}
                            className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700"
                        >
                            <option value="detached">Detached Homes</option>
                            <option value="attached">Attached/Condos</option>
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
                        Grid View ({filteredNeighborhoods.length})
                    </button>

                    {selectedNeighborhood && (
                        <button
                            onClick={() => setActiveView('details')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'details' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Details: {selectedNeighborhood.neighborhood.substring(0, 15)}
                        </button>
                    )}
                </div>

                {/* Grid View */}
                {activeView === 'overview' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredNeighborhoods.map((n) => (
                            <NeighborhoodCard
                                key={n.zip_code}
                                data={n}

                                isSelected={selectedNeighborhood?.zip_code === n.zip_code}
                                onClick={() => {
                                    setSelectedNeighborhood(n);
                                    setActiveView('details');
                                }}
                            />
                        ))}
                    </div>
                )}



                {/* Details View */}
                {activeView === 'details' && selectedNeighborhood && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Housing Data (SDAR) */}
                        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Home className="w-5 h-5 text-green-400" />
                                Housing Data (SDAR)
                            </h3>
                            <div className="space-y-4">
                                {/* Detached */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400 mb-2">Detached Homes</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Median 2025</p>
                                            <p className="text-lg font-bold text-green-400">
                                                ${((selectedNeighborhood.detached?.median_price_2025 || 0) / 1000).toFixed(0)}k
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">DOM</p>
                                            <p className="text-lg font-bold text-blue-400">
                                                {selectedNeighborhood.detached?.dom_2025 || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Inventory</p>
                                            <p className="text-lg font-bold text-orange-400">
                                                {selectedNeighborhood.detached?.inventory_2025 || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Attached */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400 mb-2">Attached/Condos</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Median 2025</p>
                                            <p className="text-lg font-bold text-green-400">
                                                ${((selectedNeighborhood.attached?.median_price_2025 || 0) / 1000).toFixed(0)}k
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">DOM</p>
                                            <p className="text-lg font-bold text-blue-400">
                                                {selectedNeighborhood.attached?.dom_2025 || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Inventory</p>
                                            <p className="text-lg font-bold text-orange-400">
                                                {selectedNeighborhood.attached?.inventory_2025 || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>Housing: SDAR {sdarData?.meta?.report_period}</p>
                </div>
            </div>
        </div>
    );
}
