import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { MapPin, TrendingUp, Store, Coffee, Beer, UtensilsCrossed, Scissors, Dog, Dumbbell, Home, Sparkles, Building, ChevronDown } from 'lucide-react';

// Color palette for 18 unique neighborhoods
const NEIGHBORHOOD_COLORS = {
    'Downtown (Gaslamp)': '#1d4ed8',
    'East Village': '#4f46e5',
    'Little Italy': '#7c3aed',
    'North Park': '#16a34a',
    'Hillcrest': '#9333ea',
    'South Park': '#c026d3',
    'University Heights': '#ea580c',
    'Normal Heights': '#db2777',
    'Kensington': '#65a30d',
    'Mission Hills': '#a21caf',
    'La Jolla': '#0284c7',
    'Pacific Beach': '#d97706',
    'Ocean Beach': '#dc2626',
    'Del Mar': '#0d9488',
    'Coronado': '#0369a1',
    'Point Loma': '#047857',
    'Bay Park': '#0e7490',
    'Clairemont': '#6d28d9',
};

// Category groupings for display
const CATEGORY_GROUPS = {
    dining: {
        label: 'Dining & Nightlife',
        icon: UtensilsCrossed,
        categories: ['restaurants', 'bars', 'breweries', 'coffee', 'juicebars', 'vegan', 'wine_bars', 'cocktailbars']
    },
    creative: {
        label: 'Creative & Culture',
        icon: Sparkles,
        categories: ['tattoo', 'galleries', 'vintage', 'thrift_stores', 'antiques', 'vinyl_records', 'bookstores']
    },
    personal: {
        label: 'Personal Services',
        icon: Scissors,
        categories: ['hair_salons', 'barbers', 'nail_salons', 'spas', 'skincare', 'waxing']
    },
    fitness: {
        label: 'Fitness & Wellness',
        icon: Dumbbell,
        categories: ['yoga', 'pilates', 'gyms', 'crossfit', 'boxing', 'cycling']
    },
    pets: {
        label: 'Pet Services',
        icon: Dog,
        categories: ['pet_stores', 'pet_groomers', 'dog_walkers', 'pet_boarding', 'veterinarians']
    },
    hospitality: {
        label: 'Hospitality',
        icon: Building,
        categories: ['hotels', 'hostels', 'vacation_rentals', 'coworking']
    },
    traditional: {
        label: 'Traditional Services',
        icon: Store,
        categories: ['laundromat', 'check_cashing', 'pawn_shops', 'payday_loans', 'dollar_stores', 'fast_food', 'taquerias', 'auto_repair', 'tire_shops']
    }
};

// Region groupings
const REGIONS = {
    all: { label: 'All Neighborhoods', filter: () => true },
    downtown: { label: 'Downtown', filter: (n) => ['Downtown (Gaslamp)', 'East Village', 'Little Italy'].includes(n.name) },
    central: { label: 'Central', filter: (n) => ['North Park', 'Hillcrest', 'South Park', 'University Heights', 'Normal Heights', 'Kensington', 'Mission Hills'].includes(n.name) },
    coastal: { label: 'Coastal', filter: (n) => ['La Jolla', 'Pacific Beach', 'Ocean Beach', 'Del Mar', 'Coronado', 'Point Loma'].includes(n.name) },
    north: { label: 'North', filter: (n) => ['Bay Park', 'Clairemont'].includes(n.name) },
};

// Helper to sum category counts
const sumCategories = (categories, keys) => {
    return keys.reduce((sum, key) => sum + (categories?.[key]?.count || 0), 0);
};

// Metric Card Component
function MetricCard({ label, value, sublabel, icon: Icon, color = 'blue' }) {
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
            {sublabel && <p className="text-xs opacity-60 mt-1">{sublabel}</p>}
        </div>
    );
}

// Neighborhood Card for grid display
function NeighborhoodCard({ neighborhood, isSelected, onClick }) {
    const color = NEIGHBORHOOD_COLORS[neighborhood.name] || '#6b7280';
    const totalBusinesses = Object.values(neighborhood.categories || {}).reduce((sum, cat) => sum + (cat.count || 0), 0);
    const restaurants = neighborhood.categories?.restaurants?.count || 0;
    const coffee = neighborhood.categories?.coffee?.count || 0;

    return (
        <button
            onClick={onClick}
            className={`rounded-xl p-4 border text-left transition-all ${isSelected
                    ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                    : 'hover:bg-gray-700/50'
                }`}
            style={{
                backgroundColor: isSelected ? color + '30' : 'rgb(30 41 59 / 0.5)',
                borderColor: isSelected ? color : 'rgb(51 65 85 / 0.5)',
                '--tw-ring-color': color
            }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-medium text-white text-sm">{neighborhood.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <span className="text-gray-400">Restaurants</span>
                    <p className="text-white font-medium">{restaurants.toLocaleString()}</p>
                </div>
                <div>
                    <span className="text-gray-400">Coffee</span>
                    <p className="text-white font-medium">{coffee.toLocaleString()}</p>
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
                {totalBusinesses.toLocaleString()} total businesses
            </div>
        </button>
    );
}

export default function NeighborhoodEvolution() {
    const [yelpData, setYelpData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
    const [activeView, setActiveView] = useState('overview');

    // Fetch static Yelp data on mount (no API calls - reads pre-fetched JSON)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/data/yelp_snapshot.json');
                if (res.ok) {
                    const data = await res.json();
                    setYelpData(data);
                    if (data.neighborhoods?.length > 0) {
                        setSelectedNeighborhood(data.neighborhoods[0]);
                    }
                }
            } catch (err) {
                console.error('Failed to load Yelp data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter neighborhoods by region
    const filteredNeighborhoods = useMemo(() => {
        if (!yelpData?.neighborhoods) return [];
        return yelpData.neighborhoods.filter(REGIONS[selectedRegion].filter);
    }, [yelpData, selectedRegion]);

    // Prepare chart data for selected neighborhood
    const chartData = useMemo(() => {
        if (!selectedNeighborhood?.categories) return [];

        return Object.entries(CATEGORY_GROUPS).map(([key, group]) => ({
            name: group.label.split(' ')[0],
            fullName: group.label,
            count: sumCategories(selectedNeighborhood.categories, group.categories),
        })).filter(d => d.count > 0);
    }, [selectedNeighborhood]);

    // Top categories for selected neighborhood
    const topCategories = useMemo(() => {
        if (!selectedNeighborhood?.categories) return [];
        return Object.entries(selectedNeighborhood.categories)
            .filter(([, cat]) => cat.count > 0)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);
    }, [selectedNeighborhood]);

    // Comparison data for bar chart
    const comparisonData = useMemo(() => {
        if (!filteredNeighborhoods.length) return [];
        return filteredNeighborhoods.map(n => ({
            name: n.name.length > 12 ? n.name.substring(0, 12) + '...' : n.name,
            fullName: n.name,
            restaurants: n.categories?.restaurants?.count || 0,
            coffee: n.categories?.coffee?.count || 0,
            bars: n.categories?.bars?.count || 0,
            fitness: sumCategories(n.categories, CATEGORY_GROUPS.fitness.categories),
        })).sort((a, b) => b.restaurants - a.restaurants);
    }, [filteredNeighborhoods]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-gray-600 border-t-purple-500 rounded-full" />
            </div>
        );
    }

    if (!yelpData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">No Yelp data available</p>
                    <code className="bg-gray-800 px-3 py-2 rounded text-sm">
                        python scripts/fetch_yelp_data.py
                    </code>
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
                        <h1 className="text-xl sm:text-2xl font-bold">Neighborhood Business Data</h1>
                    </div>
                    <p className="text-sm text-gray-400">
                        Live Yelp data for {yelpData.meta?.neighborhoods_count || 0} San Diego neighborhoods •
                        Last updated: {yelpData.meta?.generated ? new Date(yelpData.meta.generated).toLocaleDateString() : 'Unknown'}
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                        label="Restaurants"
                        value={(yelpData.summary?.total_counts?.restaurants || 0).toLocaleString()}
                        sublabel="Across all neighborhoods"
                        icon={UtensilsCrossed}
                        color="green"
                    />
                    <MetricCard
                        label="Coffee Shops"
                        value={(yelpData.summary?.total_counts?.coffee || 0).toLocaleString()}
                        sublabel="Specialty & chains"
                        icon={Coffee}
                        color="orange"
                    />
                    <MetricCard
                        label="Breweries"
                        value={(yelpData.summary?.total_counts?.breweries || 0).toLocaleString()}
                        sublabel="Craft beer scene"
                        icon={Beer}
                        color="purple"
                    />
                    <MetricCard
                        label="Fitness"
                        value={(
                            (yelpData.summary?.total_counts?.yoga || 0) +
                            (yelpData.summary?.total_counts?.gyms || 0) +
                            (yelpData.summary?.total_counts?.pilates || 0)
                        ).toLocaleString()}
                        sublabel="Yoga, gyms, pilates"
                        icon={Dumbbell}
                        color="pink"
                    />
                </div>

                {/* Region Filter */}
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-gray-400">Filter by region:</span>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(REGIONS).map(([key, { label }]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setSelectedRegion(key);
                                    const filtered = yelpData.neighborhoods.filter(REGIONS[key].filter);
                                    if (filtered.length > 0 && !filtered.find(n => n.name === selectedNeighborhood?.name)) {
                                        setSelectedNeighborhood(filtered[0]);
                                    }
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

                {/* View Toggle */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'overview' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveView('compare')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'compare' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Compare Neighborhoods
                    </button>
                    <button
                        onClick={() => setActiveView('details')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'details' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Detailed Categories
                    </button>
                </div>

                {/* Neighborhood Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
                    {filteredNeighborhoods.map((n) => (
                        <NeighborhoodCard
                            key={n.name}
                            neighborhood={n}
                            isSelected={selectedNeighborhood?.name === n.name}
                            onClick={() => setSelectedNeighborhood(n)}
                        />
                    ))}
                </div>

                {/* Content based on active view */}
                {activeView === 'overview' && selectedNeighborhood && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category breakdown chart */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-lg font-semibold mb-4">{selectedNeighborhood.name} - Category Breakdown</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" stroke="#9ca3af" />
                                    <YAxis type="category" dataKey="name" stroke="#9ca3af" width={80} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                        formatter={(value, name, props) => [value.toLocaleString(), props.payload.fullName]}
                                    />
                                    <Bar dataKey="count" fill={NEIGHBORHOOD_COLORS[selectedNeighborhood.name] || '#6366f1'} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Categories List */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-lg font-semibold mb-4">Top 10 Categories</h3>
                            <div className="space-y-2">
                                {topCategories.map(([key, cat], idx) => (
                                    <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 text-sm w-6">{idx + 1}.</span>
                                            <span className="text-white">{cat.label || key.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="text-purple-400 font-medium">{cat.count.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'compare' && (
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4">Neighborhood Comparison - Key Categories</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                                />
                                <Legend />
                                <Bar dataKey="restaurants" name="Restaurants" fill="#16a34a" />
                                <Bar dataKey="coffee" name="Coffee" fill="#d97706" />
                                <Bar dataKey="bars" name="Bars" fill="#9333ea" />
                                <Bar dataKey="fitness" name="Fitness" fill="#db2777" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {activeView === 'details' && selectedNeighborhood && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(CATEGORY_GROUPS).map(([groupKey, group]) => {
                            const Icon = group.icon;
                            const groupTotal = sumCategories(selectedNeighborhood.categories, group.categories);
                            if (groupTotal === 0) return null;

                            return (
                                <div key={groupKey} className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon className="w-5 h-5 text-purple-400" />
                                        <h4 className="font-medium">{group.label}</h4>
                                        <span className="ml-auto text-purple-400 font-bold">{groupTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {group.categories.map(catKey => {
                                            const cat = selectedNeighborhood.categories?.[catKey];
                                            if (!cat || cat.count === 0) return null;
                                            return (
                                                <div key={catKey} className="flex justify-between text-sm">
                                                    <span className="text-gray-400">{cat.label || catKey.replace(/_/g, ' ')}</span>
                                                    <span className="text-white">{cat.count.toLocaleString()}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>Data source: Yelp Fusion API | {yelpData.meta?.categories_tracked?.length || 0} categories tracked</p>
                    <p className="mt-1">Run <code className="bg-gray-800 px-1 rounded">python scripts/fetch_yelp_data.py</code> to refresh data</p>
                </div>
            </div>
        </div>
    );
}
