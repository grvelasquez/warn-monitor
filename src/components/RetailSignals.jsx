import { useState, useEffect, useMemo } from 'react';
import { Coffee, Dumbbell, Beer, Palette, Store, Dog, Briefcase, MapPin, ChevronDown, Filter } from 'lucide-react';

// Icon mapping for categories
const CATEGORY_ICONS = {
    coffee_specialty: Coffee,
    yoga_fitness: Dumbbell,
    brewery_taproom: Beer,
    art_gallery: Palette,
    organic_grocery: Store,
    pet_services: Dog,
    coworking: Briefcase,
};

const CATEGORY_COLORS = {
    coffee_specialty: 'text-amber-400',
    yoga_fitness: 'text-purple-400',
    brewery_taproom: 'text-orange-400',
    art_gallery: 'text-pink-400',
    organic_grocery: 'text-green-400',
    pet_services: 'text-blue-400',
    coworking: 'text-cyan-400',
};

// Region groupings
const REGIONS = {
    all: { label: 'All Neighborhoods', neighborhoods: null },
    central: {
        label: 'Central SD',
        neighborhoods: ['Downtown', 'Gaslamp', 'Little Italy', 'Hillcrest', 'North Park', 'South Park', 'University Heights', 'Normal Heights']
    },
    coastal: {
        label: 'Coastal',
        neighborhoods: ['La Jolla', 'Pacific Beach', 'Ocean Beach', 'Mission Beach', 'Coronado']
    },
    south: {
        label: 'South Bay',
        neighborhoods: ['Chula Vista', 'Barrio Logan', 'National City', 'Imperial Beach', 'San Ysidro']
    },
    east: {
        label: 'East County',
        neighborhoods: ['City Heights', 'El Cajon', 'La Mesa', 'Santee', 'Spring Valley']
    },
    north: {
        label: 'North County',
        neighborhoods: ['Oceanside', 'Carlsbad', 'Encinitas', 'Escondido', 'Vista', 'San Marcos']
    },
};

// Risk color based on score
const getScoreColor = (score) => {
    if (score >= 0.7) return { bg: 'bg-red-500', text: 'text-red-400', label: 'High' };
    if (score >= 0.5) return { bg: 'bg-orange-500', text: 'text-orange-400', label: 'Moderate' };
    if (score >= 0.3) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Low' };
    return { bg: 'bg-green-500', text: 'text-green-400', label: 'Stable' };
};

// Compact neighborhood card
function NeighborhoodCard({ neighborhood, rank }) {
    const scoreInfo = getScoreColor(neighborhood.gentrificationScore);

    // Sum gentrifying counts
    const genCount = Object.values(neighborhood.gentrifying || {}).reduce(
        (sum, cat) => sum + (cat.count || 0), 0
    );

    return (
        <div className={`bg-slate-800/50 border rounded-lg p-3 ${rank <= 3 ? 'border-orange-500/40' : 'border-slate-700/50'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    {rank <= 3 && <span className="text-orange-400 text-xs font-medium">#{rank}</span>}
                    <span className="text-sm font-medium text-white truncate">{neighborhood.name}</span>
                </div>
                <span className={`text-xs font-medium ${scoreInfo.text} flex-shrink-0`}>
                    {(neighborhood.gentrificationScore * 100).toFixed(0)}%
                </span>
            </div>
            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className={`h-full ${scoreInfo.bg}`} style={{ width: `${neighborhood.gentrificationScore * 100}%` }} />
            </div>
            {/* Quick category icons */}
            <div className="flex gap-1.5 flex-wrap">
                {Object.entries(neighborhood.gentrifying || {}).slice(0, 4).map(([key, data]) => {
                    if (!data.count) return null;
                    const Icon = CATEGORY_ICONS[key] || Store;
                    const color = CATEGORY_COLORS[key] || 'text-slate-400';
                    return (
                        <div key={key} className="flex items-center gap-0.5 text-[10px]">
                            <Icon className={`w-3 h-3 ${color}`} />
                            <span className="text-slate-400">{data.count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Sort options - by category
const SORT_OPTIONS = [
    { value: 'name_asc', label: 'Name: A-Z' },
    { value: 'coffee_desc', label: 'Most Coffee Shops' },
    { value: 'yoga_desc', label: 'Most Yoga/Fitness' },
    { value: 'brewery_desc', label: 'Most Breweries/Pubs' },
    { value: 'gallery_desc', label: 'Most Art Galleries' },
    { value: 'grocery_desc', label: 'Most Grocery/Markets' },
    { value: 'pet_desc', label: 'Most Pet Services' },
];

// Main component with filtering
export function RetailSignals({ className = "" }) {
    const [retailData, setRetailData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [sortBy, setSortBy] = useState('score_desc');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/data/retail_data.json');
                if (res.ok) setRetailData(await res.json());
            } catch (err) {
                console.error('Retail data fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter and sort neighborhoods
    const filteredNeighborhoods = useMemo(() => {
        if (!retailData?.neighborhoods) return [];

        let result = [...retailData.neighborhoods];

        // Filter by region
        if (selectedRegion !== 'all' && REGIONS[selectedRegion]?.neighborhoods) {
            const regionNames = REGIONS[selectedRegion].neighborhoods;
            result = result.filter(n => regionNames.includes(n.name));
        }

        // Sort by category
        const getCategoryCount = (n, category) => n.gentrifying?.[category]?.count || 0;

        switch (sortBy) {
            case 'name_asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'coffee_desc':
                result.sort((a, b) => getCategoryCount(b, 'coffee_specialty') - getCategoryCount(a, 'coffee_specialty'));
                break;
            case 'yoga_desc':
                result.sort((a, b) => getCategoryCount(b, 'yoga_fitness') - getCategoryCount(a, 'yoga_fitness'));
                break;
            case 'brewery_desc':
                result.sort((a, b) => getCategoryCount(b, 'brewery_taproom') - getCategoryCount(a, 'brewery_taproom'));
                break;
            case 'gallery_desc':
                result.sort((a, b) => getCategoryCount(b, 'art_gallery') - getCategoryCount(a, 'art_gallery'));
                break;
            case 'grocery_desc':
                result.sort((a, b) => getCategoryCount(b, 'organic_grocery') - getCategoryCount(a, 'organic_grocery'));
                break;
            case 'pet_desc':
                result.sort((a, b) => getCategoryCount(b, 'pet_services') - getCategoryCount(a, 'pet_services'));
                break;
            default:
                result.sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [retailData, selectedRegion, sortBy]);

    // Display count
    const displayCount = showAll ? filteredNeighborhoods.length : Math.min(8, filteredNeighborhoods.length);
    const displayedNeighborhoods = filteredNeighborhoods.slice(0, displayCount);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-24">
                <div className="animate-spin w-5 h-5 border-2 border-slate-600 border-t-orange-500 rounded-full" />
            </div>
        );
    }

    const neighborhoods = retailData?.neighborhoods || [];

    if (neighborhoods.length === 0) {
        return (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm">
                    Run <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">python scripts/fetch_retail_data.py</code> to load retail data
                </p>
            </div>
        );
    }

    // Get summary counts
    const summary = retailData?.summary?.totalGentrifying || {};
    const summaryItems = Object.entries(summary).filter(([k, v]) => v > 0).slice(0, 6);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Quick stats row - clickable to sort */}
            {summaryItems.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {summaryItems.map(([key, count]) => {
                        const Icon = CATEGORY_ICONS[key] || Store;
                        const color = CATEGORY_COLORS[key] || 'text-slate-400';
                        const sortValue = `${key.replace('_', '_')}_desc`;
                        // Map category keys to sort values
                        const sortMap = {
                            'coffee_specialty': 'coffee_desc',
                            'yoga_fitness': 'yoga_desc',
                            'brewery_taproom': 'brewery_desc',
                            'art_gallery': 'gallery_desc',
                            'organic_grocery': 'grocery_desc',
                            'pet_services': 'pet_desc',
                        };
                        const thisSortValue = sortMap[key];
                        const isActive = sortBy === thisSortValue;

                        return (
                            <button
                                key={key}
                                onClick={() => thisSortValue && setSortBy(thisSortValue)}
                                className={`bg-slate-800/40 border rounded-lg p-2 text-center transition-all cursor-pointer hover:bg-slate-700/50 ${isActive
                                        ? 'border-purple-500 ring-1 ring-purple-500/50'
                                        : 'border-slate-700/50 hover:border-slate-600'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                                <p className="text-lg font-bold text-white">{count}</p>
                                <p className="text-[10px] text-slate-500 capitalize truncate">{key.replace(/_/g, ' ')}</p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Filters row */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Region filter */}
                <div className="relative">
                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 pr-8 text-sm text-white cursor-pointer hover:border-slate-600 focus:outline-none focus:border-purple-500"
                    >
                        {Object.entries(REGIONS).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Sort filter */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 pr-8 text-sm text-white cursor-pointer hover:border-slate-600 focus:outline-none focus:border-purple-500"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Count badge */}
                <span className="text-xs text-slate-500 ml-auto">
                    Showing {displayedNeighborhoods.length} of {filteredNeighborhoods.length} neighborhoods
                </span>
            </div>

            {/* Neighborhoods grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {displayedNeighborhoods.map((n, idx) => (
                    <NeighborhoodCard key={n.name} neighborhood={n} rank={idx + 1} />
                ))}
            </div>

            {/* Show more/less button */}
            {filteredNeighborhoods.length > 8 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2 text-sm text-slate-400 hover:text-white border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors"
                >
                    {showAll ? 'Show Less' : `Show All ${filteredNeighborhoods.length} Neighborhoods`}
                </button>
            )}

            {/* Compact legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-500">
                <span>Risk:</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> Stable</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full" /> Moderate</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> High</span>
            </div>
        </div>
    );
}

export default RetailSignals;
