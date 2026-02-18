import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Map, Home, TrendingUp, TrendingDown, DollarSign, X, Filter, Layers, ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { regions } from './sdarData';

// San Diego County coordinates - simple arrays for reliable production builds
const SD_CENTER = [32.83, -117.05];
const SD_BOUNDS_COORDS = {
    south: 32.53,
    west: -117.45,
    north: 33.45,
    east: -116.55
};

// Component to set view on mount - creates bounds inside useEffect for production reliability
function SetViewOnMount() {
    const map = useMap();

    useEffect(() => {
        // Create bounds using Leaflet inside the effect (after map is ready)
        const bounds = L.latLngBounds(
            L.latLng(SD_BOUNDS_COORDS.south, SD_BOUNDS_COORDS.west),
            L.latLng(SD_BOUNDS_COORDS.north, SD_BOUNDS_COORDS.east)
        );

        // Function to properly initialize the map
        const initializeMap = () => {
            map.invalidateSize({ animate: false });  // Force recalculation of map size
            map.setView(SD_CENTER, 10);
            map.fitBounds(bounds, { padding: [10, 10], maxZoom: 10 });
        };

        // Call immediately
        initializeMap();

        // Call multiple times with staggered delays to ensure it catches the right moment
        const timeouts = [
            setTimeout(initializeMap, 100),
            setTimeout(initializeMap, 300),
            setTimeout(initializeMap, 500),
            setTimeout(initializeMap, 1000)
        ];

        // Also call on whenReady
        map.whenReady(initializeMap);

        // Listen for window resize to handle any edge cases
        const handleResize = () => map.invalidateSize({ animate: false });
        window.addEventListener('resize', handleResize);

        return () => {
            timeouts.forEach(t => clearTimeout(t));
            window.removeEventListener('resize', handleResize);
        };
    }, [map]);

    return null;
}

// Price tier colors (sequential from low to high)
const PRICE_TIERS = [
    { min: 0, max: 500000, color: '#22c55e', label: 'Under $500K' },
    { min: 500000, max: 750000, color: '#84cc16', label: '$500K - $750K' },
    { min: 750000, max: 1000000, color: '#eab308', label: '$750K - $1M' },
    { min: 1000000, max: 1500000, color: '#f97316', label: '$1M - $1.5M' },
    { min: 1500000, max: 2000000, color: '#ef4444', label: '$1.5M - $2M' },
    { min: 2000000, max: Infinity, color: '#dc2626', label: '$2M+' }
];

// Get color for a price
const getPriceColor = (price) => {
    if (!price || price === 0) return '#6b7280'; // Gray for no data
    const tier = PRICE_TIERS.find(t => price >= t.min && price < t.max);
    return tier ? tier.color : PRICE_TIERS[PRICE_TIERS.length - 1].color;
};

// Format currency
const formatCurrency = (value) => {
    if (!value || value === 0) return 'N/A';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${(value / 1000).toFixed(0)}K`;
};

// Format full currency
const formatCurrencyFull = (value) => {
    if (!value || value === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

// Stat card component
function StatCard({ label, value, icon: Icon, color = 'blue', subtext }) {
    const colorClasses = {
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        red: 'bg-red-500/20 text-red-400 border-red-500/30',
        purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} backdrop-blur-sm`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider opacity-80">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {subtext && <div className="text-xs mt-1 opacity-70">{subtext}</div>}
        </div>
    );
}

// Legend component
function Legend({ onClose }) {
    return (
        <div className="absolute bottom-6 left-6 z-[1000] bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">Median Price</h4>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-700 rounded-lg transition-colors -mr-1"
                    aria-label="Close legend"
                >
                    <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
            </div>
            <div className="space-y-2">
                {PRICE_TIERS.map((tier, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: tier.color }} />
                        <span className="text-xs text-gray-300">{tier.label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-700">
                    <div className="w-4 h-4 rounded bg-gray-500" />
                    <span className="text-xs text-gray-400">No Data</span>
                </div>
            </div>
        </div>
    );
}

// Detail panel component
function DetailPanel({ data, onClose, propertyType }) {
    if (!data) return null;

    const propData = data[propertyType] || {};
    const priceChange = propData.median_price_ytd_pct_change || 0;

    return (
        <div className="absolute top-6 right-6 z-[1000] w-80 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">{data.neighborhood}</h3>
                        <p className="text-sm text-gray-400">ZIP: {data.zip_code}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-3xl font-bold text-white">
                        {formatCurrencyFull(propData.median_price_2026)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        {priceChange > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : priceChange < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : null}
                        <span className={`text-sm ${priceChange > 0 ? 'text-green-400' : priceChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}% YTD
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Closed Sales</div>
                        <div className="text-lg font-semibold text-white">{propData.closed_sales_2026 || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Days on Market</div>
                        <div className="text-lg font-semibold text-white">{propData.dom_2026 || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Inventory</div>
                        <div className="text-lg font-semibold text-white">{propData.inventory_2026 || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Sale-to-List</div>
                        <div className="text-lg font-semibold text-white">{propData.pct_orig_price_2026 ? `${propData.pct_orig_price_2026}%` : 'N/A'}</div>
                    </div>
                </div>

                <div className="text-xs text-gray-500 text-center">
                    Report: {data.report_month}
                </div>
            </div>
        </div>
    );
}

// Zip to region mapping helper
const getZipRegion = (zipCode) => {
    for (const [regionKey, region] of Object.entries(regions)) {
        if (regionKey === 'all') continue;
        for (const area of region.areas || []) {
            if (area.zips && area.zips.includes(zipCode)) {
                return regionKey;
            }
        }
    }
    return null;
};

// Main component
export default function MapDashboard({ setActiveView }) {
    const [geoData, setGeoData] = useState(null);
    const [neighborhoodData, setNeighborhoodData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedZip, setSelectedZip] = useState(null);
    const [hoveredZip, setHoveredZip] = useState(null);
    const [propertyType, setPropertyType] = useState('detached');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [showLegend, setShowLegend] = useState(true);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [geoRes, dataRes] = await Promise.all([
                    fetch('/data/sd_zipcodes.json'),
                    fetch('/data/sdar_neighborhood_data.json')
                ]);

                const geo = await geoRes.json();
                const data = await dataRes.json();

                setGeoData(geo);
                setNeighborhoodData(data);
            } catch (error) {
                console.error('Error fetching map data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Create zip to data lookup
    const zipDataMap = useMemo(() => {
        if (!neighborhoodData?.neighborhoods) return {};
        const map = {};
        neighborhoodData.neighborhoods.forEach(n => {
            map[n.zip_code] = n;
        });
        return map;
    }, [neighborhoodData]);

    // Stats calculations
    const stats = useMemo(() => {
        if (!neighborhoodData?.neighborhoods) return null;

        const prices = neighborhoodData.neighborhoods
            .map(n => n[propertyType]?.median_price_2026)
            .filter(p => p && p > 0);

        const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
        const max = Math.max(...prices);
        const min = Math.min(...prices);

        const maxNeighborhood = neighborhoodData.neighborhoods.find(n => n[propertyType]?.median_price_2026 === max);
        const minNeighborhood = neighborhoodData.neighborhoods.find(n => n[propertyType]?.median_price_2026 === min);

        return {
            avg,
            max,
            min,
            maxName: maxNeighborhood?.neighborhood || 'N/A',
            minName: minNeighborhood?.neighborhood || 'N/A',
            count: neighborhoodData.neighborhoods.length
        };
    }, [neighborhoodData, propertyType]);

    // GeoJSON style function
    const getFeatureStyle = (feature) => {
        const zipCode = feature.properties.ZIPCODE;
        const zipData = zipDataMap[zipCode];
        const price = zipData?.[propertyType]?.median_price_2026 || 0;
        const isHovered = hoveredZip === zipCode;
        const isSelected = selectedZip?.zip_code === zipCode;

        // Check region filter
        const region = getZipRegion(zipCode);
        const isFiltered = selectedRegion !== 'all' && region !== selectedRegion;

        return {
            fillColor: isFiltered ? '#374151' : getPriceColor(price),
            weight: isSelected ? 3 : isHovered ? 2 : 1,
            opacity: 1,
            color: isSelected ? '#fff' : isHovered ? '#60a5fa' : '#374151',
            fillOpacity: isFiltered ? 0.2 : isHovered ? 0.9 : 0.7
        };
    };

    // Event handlers for each feature
    const onEachFeature = (feature, layer) => {
        const zipCode = feature.properties.ZIPCODE;
        const zipData = zipDataMap[zipCode];
        const name = zipData?.neighborhood || feature.properties.NAME || 'Unknown';
        const price = zipData?.[propertyType]?.median_price_2026;

        layer.bindTooltip(`
      <div class="text-sm">
        <div class="font-bold">${name}</div>
        <div class="text-gray-300">${zipCode}</div>
        <div class="text-blue-400 font-semibold">${formatCurrency(price)}</div>
      </div>
    `, {
            sticky: true,
            className: 'leaflet-tooltip-custom'
        });

        layer.on({
            mouseover: () => setHoveredZip(zipCode),
            mouseout: () => setHoveredZip(null),
            click: () => setSelectedZip(zipData)
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-gray-400">Loading map data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <div className="sticky top-14 z-40 p-4 sm:p-6 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <button
                                    onClick={() => setActiveView('realestate')}
                                    className="p-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                                </button>
                                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Map className="w-6 h-6 text-blue-400" />
                                    San Diego Real Estate Map
                                </h1>
                            </div>
                            <p className="text-gray-400 text-sm pl-11">
                                Interactive map showing median home prices by zip code
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Property Type Toggle */}
                            <div className="flex items-center bg-gray-800 rounded-lg p-1">
                                <button
                                    onClick={() => setPropertyType('detached')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${propertyType === 'detached'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <Home className="w-4 h-4 inline mr-1" />
                                    Detached
                                </button>
                                <button
                                    onClick={() => setPropertyType('attached')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${propertyType === 'attached'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <Layers className="w-4 h-4 inline mr-1" />
                                    Attached
                                </button>
                            </div>

                            {/* Region Filter */}
                            <div className="relative">
                                <select
                                    value={selectedRegion}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                    className="appearance-none bg-gray-800 text-gray-200 text-sm rounded-lg px-4 py-2 pr-8 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="all">All Regions</option>
                                    {Object.entries(regions).filter(([k]) => k !== 'all').map(([key, region]) => (
                                        <option key={key} value={key}>{region.name}</option>
                                    ))}
                                </select>
                                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                            <StatCard
                                label="County Average"
                                value={formatCurrency(stats.avg)}
                                icon={DollarSign}
                                color="blue"
                                subtext={`${propertyType === 'detached' ? 'Detached' : 'Attached'} homes`}
                            />
                            <StatCard
                                label="Highest"
                                value={formatCurrency(stats.max)}
                                icon={TrendingUp}
                                color="green"
                                subtext={stats.maxName}
                            />
                            <StatCard
                                label="Lowest"
                                value={formatCurrency(stats.min)}
                                icon={TrendingDown}
                                color="orange"
                                subtext={stats.minName}
                            />
                            <StatCard
                                label="Coverage"
                                value={stats.count}
                                icon={Map}
                                color="purple"
                                subtext="Neighborhoods"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Map Container */}
            <div className="relative h-[calc(100vh-280px)] min-h-[400px]">
                <style>{`
          .leaflet-tooltip-custom {
            background: rgba(17, 24, 39, 0.95) !important;
            border: 1px solid rgba(75, 85, 99, 0.5) !important;
            border-radius: 8px !important;
            padding: 8px 12px !important;
            color: white !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
          }
          .leaflet-tooltip-custom::before {
            border-top-color: rgba(17, 24, 39, 0.95) !important;
          }
          .leaflet-container {
            background: #0f172a !important;
          }
        `}</style>

                {geoData && (
                    <MapContainer
                        center={SD_CENTER}
                        zoom={10}
                        minZoom={9}
                        maxZoom={14}
                        className="h-full w-full"
                        maxBounds={[[SD_BOUNDS_COORDS.south, SD_BOUNDS_COORDS.west], [SD_BOUNDS_COORDS.north, SD_BOUNDS_COORDS.east]]}
                        maxBoundsViscosity={1.0}
                        scrollWheelZoom={true}
                    >
                        <SetViewOnMount />
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <GeoJSON
                            key={`${propertyType}-${selectedRegion}-${hoveredZip}`}
                            data={geoData}
                            style={getFeatureStyle}
                            onEachFeature={onEachFeature}
                        />
                    </MapContainer>
                )}

                {showLegend ? (
                    <Legend onClose={() => setShowLegend(false)} />
                ) : (
                    <button
                        onClick={() => setShowLegend(true)}
                        className="absolute bottom-6 left-6 z-[1000] bg-gray-900/95 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-700 shadow-xl text-sm text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                        aria-label="Show legend"
                    >
                        <div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
                        <span>Legend</span>
                    </button>
                )}

                {selectedZip && (
                    <DetailPanel
                        data={selectedZip}
                        onClose={() => setSelectedZip(null)}
                        propertyType={propertyType}
                    />
                )}
            </div>
        </div>
    );
}
