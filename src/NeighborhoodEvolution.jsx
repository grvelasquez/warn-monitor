import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { MapPin, Home, TrendingUp, Building, DollarSign, Clock, Package, Filter, ArrowUpDown, Shield, X, Sparkles, ArrowLeft } from 'lucide-react';
import neighborhoodDescriptions from './data/neighborhood_descriptions.json';
import { regions } from './sdarData';

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
function NeighborhoodCard({ data, isSelected, onClick, propertyType }) {
    const color = getRegionColor(data.zip_code);
    const stats = data[propertyType] || {};

    const priceChange = stats.median_price_ytd_pct_change || 0;

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
                        ${stats.median_price_ytd_2026 ? stats.median_price_ytd_2026.toLocaleString() : 'N/A'}
                    </p>
                </div>
                <div>
                    <span className="text-gray-500">DOM</span>
                    <p className="text-blue-400 font-medium">{stats.dom_ytd_2026 || 'N/A'}</p>
                </div>
            </div>
            {priceChange !== null && (
                <div className={`mt-2 text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(1)}% YTD
                </div>
            )}
        </button>
    );
}

export default function NeighborhoodEvolution({ setActiveView }) {
    const [sdarData, setSdarData] = useState(null);
    const [militaryData, setMilitaryData] = useState({});

    const [zillowData, setZillowData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedArea, setSelectedArea] = useState('all');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
    const [activeView, setActiveViewLocal] = useState('details');
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

                // Fetch military data
                const militaryRes = await fetch('/data/military_income_floor_2025.csv');
                if (militaryRes.ok) {
                    const text = await militaryRes.text();
                    const rows = text.split('\n').filter(row => row.trim() !== '');
                    const headers = rows[0].split(',');
                    const parsed = {};
                    rows.slice(1).forEach(row => {
                        const values = row.split(',');
                        const obj = headers.reduce((acc, h, i) => {
                            acc[h.trim()] = values[i]?.trim();
                            return acc;
                        }, {});
                        parsed[obj.zip_code] = obj;
                    });
                    setMilitaryData(parsed);
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

    // Available areas based on region selection
    const availableAreas = useMemo(() => {
        let areas = [];
        if (selectedRegion === 'all') {
            areas = Object.values(regions).filter(r => r.areas).flatMap(r => r.areas);
        } else {
            areas = regions[selectedRegion]?.areas || [];
        }

        // Sort by zip code (using the first zip in the array)
        return [...areas].sort((a, b) => {
            const zipA = a.zips && a.zips.length > 0 ? parseInt(a.zips[0]) : 0;
            const zipB = b.zips && b.zips.length > 0 ? parseInt(b.zips[0]) : 0;
            return zipA - zipB;
        });
    }, [selectedRegion]);

    // Clear filters function
    const clearFilters = () => {
        setSelectedRegion('all');
        setSelectedArea('all');
        setSelectedNeighborhood(null);
    };

    const hasActiveFilters = selectedRegion !== 'all' || selectedArea !== 'all';

    // Filter neighborhoods by region and area
    const filteredNeighborhoods = useMemo(() => {
        if (!sdarData?.neighborhoods) return [];

        let filtered = sdarData.neighborhoods;

        // Filter by selected area (specific neighborhood with zips)
        if (selectedArea !== 'all') {
            const area = availableAreas.find(a => a.id === selectedArea);
            if (area?.zips) {
                filtered = filtered.filter(n => area.zips.includes(n.zip_code));
            }
        } else if (selectedRegion !== 'all') {
            // Filter by region if no specific area selected
            const regionAreas = regions[selectedRegion]?.areas || [];
            const regionZips = regionAreas.flatMap(a => a.zips);
            filtered = filtered.filter(n => regionZips.includes(n.zip_code));
        }

        // Sort
        if (sortBy === 'price') {
            filtered = [...filtered].sort((a, b) => {
                const priceA = propertyType === 'detached'
                    ? (a.detached?.median_price_ytd_2026 || 0)
                    : (a.attached?.median_price_ytd_2026 || 0);
                const priceB = propertyType === 'detached'
                    ? (b.detached?.median_price_ytd_2026 || 0)
                    : (b.attached?.median_price_ytd_2026 || 0);
                return priceB - priceA;
            });
        } else if (sortBy === 'price_low') {
            filtered = [...filtered].sort((a, b) => {
                const priceA = propertyType === 'detached'
                    ? (a.detached?.median_price_ytd_2026 || 0)
                    : (a.attached?.median_price_ytd_2026 || 0);
                const priceB = propertyType === 'detached'
                    ? (b.detached?.median_price_ytd_2026 || 0)
                    : (b.attached?.median_price_ytd_2026 || 0);
                return priceA - priceB;
            });
        } else if (sortBy === 'change') {
            filtered = [...filtered].sort((a, b) => {
                const getChange = (n) => {
                    const prop = propertyType === 'detached' ? n.detached : n.attached;
                    return prop?.median_price_ytd_pct_change || -999;
                };
                return getChange(b) - getChange(a);
            });
        } else if (sortBy === 'change_worst') {
            filtered = [...filtered].sort((a, b) => {
                const getChange = (n) => {
                    const prop = propertyType === 'detached' ? n.detached : n.attached;
                    return prop?.median_price_ytd_pct_change || 999;
                };
                return getChange(a) - getChange(b);
            });
        } else if (sortBy === 'dom') {
            filtered = [...filtered].sort((a, b) => {
                const domA = propertyType === 'detached' ? (a.detached?.dom_ytd_2026 || 999) : (a.attached?.dom_ytd_2026 || 999);
                const domB = propertyType === 'detached' ? (b.detached?.dom_ytd_2026 || 999) : (b.attached?.dom_ytd_2026 || 999);
                return domA - domB;
            });
        }


        return filtered;
    }, [sdarData, selectedRegion, selectedArea, availableAreas, sortBy, propertyType]);



    // Summary stats
    const summaryStats = useMemo(() => {
        if (!sdarData?.summary || !sdarData?.county_wide) return {};
        return { ...sdarData.summary, county_wide: sdarData.county_wide };
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
                        <button
                            onClick={() => setActiveView('realestate')}
                            className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold">SD County Neighborhoods</h1>
                    </div>
                    <p className="text-sm text-gray-400">
                        {sdarData?.meta?.neighborhoods_count || 0} zip codes
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Source: SDAR Housing Data + Zillow ZORI Rentals</p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                        label="County Median YTD"
                        value={`$${(summaryStats.county_wide?.detached?.median_price_ytd_2026 || 0).toLocaleString()}`}
                        sublabel="Detached Homes"
                        icon={Home}
                        color="green"
                    />
                    <MetricCard
                        label="County Median YTD"
                        value={`$${(summaryStats.county_wide?.attached?.median_price_ytd_2026 || 0).toLocaleString()}`}
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
                        trend={zillowData?.summary?.avg_yoy_change}
                    />
                </div>

                {/* AI Executive Summary */}
                <div className="mb-6 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden transition-all group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-16 h-16 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2 mb-4 text-indigo-300">
                        <Sparkles className="w-4 h-4" />
                        <h4 className="text-sm font-bold uppercase tracking-wider">AI Executive Summary</h4>
                        <span className="ml-2 px-2 py-0.5 bg-indigo-600/30 text-indigo-300 text-xs font-medium rounded-full">2026 Analysis</span>
                    </div>
                    <div className="space-y-4 text-slate-300 leading-relaxed">
                        <p>
                            <strong className="text-white">San Diego's 2026 housing market</strong> reflects a complex equilibrium shaped by persistent affordability constraints and sustained demand.
                            With <strong className="text-indigo-300">detached home prices holding near $1.1M</strong> and condos stabilizing around $650K, the county continues to experience a
                            <strong className="text-amber-300"> seller's market</strong> with sub-3-month inventory levels, though the pace of appreciation has moderated compared to 2021-2022.
                        </p>
                        <p>
                            <strong className="text-white">Key dynamics for 2026:</strong> Military BAH increases (+4.2% average) are providing incremental buying power for coastal zip codes,
                            while <strong className="text-emerald-300">rental growth has cooled to 2-3% YoY</strong> after aggressive 2023 increases. Days on Market (DOM) averaging 35-45 days
                            suggests healthy absorption, though luxury segments (&gt;$2M) are seeing extended timelines.
                        </p>
                        <p>
                            <strong className="text-white">Neighborhood watch:</strong> North County coastal (92024, 92075) and Central San Diego (92103, 92104) remain the most competitive,
                            with multiple offers common. East County (91941, 91942) and South Bay (91950, 92154) offer relative affordability for first-time buyers, with median prices
                            30-40% below county averages. The condo market presents opportunities for investors eyeing ADU-friendly lots or cash flow plays.
                        </p>
                    </div>
                </div>

                {/* Filter Panel - Matching Real Estate Tab */}
                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[160px]">
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Region</label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => { setSelectedRegion(e.target.value); setSelectedArea('all'); setSelectedNeighborhood(null); }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
                            >
                                <option value="all">All San Diego</option>
                                <option value="northCoast">🌊 North Coast</option>
                                <option value="northInland">🏔️ North Inland</option>
                                <option value="centralCoastal">🏖️ Central Coastal</option>
                                <option value="central">🏘️ Central</option>
                                <option value="eastSuburbs">🏡 East Suburbs</option>
                                <option value="eastCounty">⛰️ East County</option>
                                <option value="southBay">🌴 South Bay</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[160px]">
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Neighborhood</label>
                            <select
                                value={selectedArea}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedArea(val);

                                    if (val !== 'all') {
                                        const area = availableAreas.find(a => a.id === val);
                                        if (area && area.zips && area.zips.length > 0 && sdarData?.neighborhoods) {
                                            const match = sdarData.neighborhoods.find(n => n.zip_code === area.zips[0]);
                                            if (match) {
                                                setSelectedNeighborhood(match);
                                                setActiveViewLocal('details');
                                            } else {
                                                setSelectedNeighborhood(null);
                                            }
                                        }
                                    } else {
                                        setSelectedNeighborhood(null);
                                        setActiveViewLocal('overview');
                                    }
                                }}
                                disabled={availableAreas.length === 0}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 disabled:opacity-50"
                            >
                                <option value="all">All Areas</option>
                                {availableAreas.map(a => <option key={a.id} value={a.id}>{a.name} ({a.zips.join(', ')})</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Property Type</label>
                            <select
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
                            >
                                <option value="detached">🏠 Detached Homes</option>
                                <option value="attached">🏢 Attached/Condos</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
                            >
                                <option value="name">Name</option>
                                <option value="price">Price (High→Low)</option>
                                <option value="price_low">Price (Low→High)</option>
                                <option value="change">YTD Change (Best→Worst)</option>
                                <option value="change_worst">YTD Change (Worst→Best)</option>
                                <option value="dom">Days on Market</option>
                            </select>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-all font-medium">
                                <X className="w-4 h-4" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveViewLocal('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'overview' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Grid View ({filteredNeighborhoods.length})
                    </button>

                    {selectedNeighborhood && (
                        <button
                            onClick={() => setActiveViewLocal('details')}
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
                                propertyType={propertyType}
                                isSelected={selectedNeighborhood?.zip_code === n.zip_code}
                                onClick={() => {
                                    setSelectedNeighborhood(n);
                                    setActiveViewLocal('details');
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
                                            <p className="text-xs text-gray-500">Median YTD 2025</p>
                                            <p className="text-lg font-bold text-green-400">
                                                ${(selectedNeighborhood.detached?.median_price_ytd_2026 || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">DOM YTD</p>
                                            <p className="text-lg font-bold text-blue-400">
                                                {selectedNeighborhood.detached?.dom_ytd_2026 || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Inventory</p>
                                            <p className="text-lg font-bold text-orange-400">
                                                {selectedNeighborhood.detached?.inventory_2026 || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Attached */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400 mb-2">Attached/Condos</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Median YTD 2025</p>
                                            <p className="text-lg font-bold text-green-400">
                                                ${(selectedNeighborhood.attached?.median_price_ytd_2026 || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">DOM YTD</p>
                                            <p className="text-lg font-bold text-blue-400">
                                                {selectedNeighborhood.attached?.dom_ytd_2026 || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Inventory</p>
                                            <p className="text-lg font-bold text-orange-400">
                                                {selectedNeighborhood.attached?.inventory_2026 || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Military Income Floor Data */}
                        {militaryData[selectedNeighborhood.zip_code] && (
                            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-400" />
                                    Military Income Floor (2025)
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${militaryData[selectedNeighborhood.zip_code].mha_code === 'CA024'
                                            ? 'bg-teal-900/30 text-teal-400'
                                            : 'bg-blue-900/30 text-blue-400'
                                            }`}>
                                            {militaryData[selectedNeighborhood.zip_code].zone}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            MHA {militaryData[selectedNeighborhood.zip_code].mha_code}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">E-5 Single</p>
                                            <p className="text-lg font-bold text-indigo-400">
                                                ${parseInt(militaryData[selectedNeighborhood.zip_code].income_e5_without_dep).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-600">BAH: ${parseInt(militaryData[selectedNeighborhood.zip_code].bah_e5_without_dep).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">E-5 w/ Dependents</p>
                                            <p className="text-lg font-bold text-emerald-400">
                                                ${parseInt(militaryData[selectedNeighborhood.zip_code].income_e5_with_dep).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-600">BAH: ${parseInt(militaryData[selectedNeighborhood.zip_code].bah_e5_with_dep).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Income Floor = Base Pay + BAH + BAS. BAH is tax-free.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Neighborhood Details Card */}
                        {neighborhoodDescriptions.some(d => String(d.zipCode) === String(selectedNeighborhood.zip_code)) && (
                            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 lg:col-span-2">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    Neighborhood Snapshot
                                </h3>
                                <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
                                    {neighborhoodDescriptions
                                        .filter(d => String(d.zipCode) === String(selectedNeighborhood.zip_code))
                                        .map((details, idx) => (
                                            <div key={idx} className={`flex flex-col gap-2 ${idx > 0 ? 'pt-4 border-t border-gray-700/50' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
                                                        {details.region}
                                                    </span>
                                                    <span className="text-gray-400 text-sm">•</span>
                                                    <span className="text-white font-medium">{details.neighborhood}</span>
                                                </div>
                                                <p className="text-gray-300 italic">"{details.description}"</p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
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
