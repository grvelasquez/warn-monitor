import { useState, useEffect, useMemo } from 'react';
import { Coffee, Dumbbell, Beer, Palette, Store, Dog, Briefcase, MapPin, ChevronDown, Filter, Scissors, Sparkles, Heart, Cannabis, Home, Building } from 'lucide-react';

// Icon mapping for categories - expanded for Yelp data
const CATEGORY_ICONS = {
    // Dining & Nightlife
    restaurants: Store,
    bars: Beer,
    breweries: Beer,
    coffee: Coffee,
    juicebars: Coffee,
    vegan: Heart,
    wine_bars: Beer,
    cocktailbars: Beer,
    // Creative / Hipster
    tattoo: Sparkles,
    galleries: Palette,
    vintage: Store,
    thrift_stores: Store,
    antiques: Store,
    vinyl_records: Store,
    bookstores: Store,
    // Personal Services
    hair_salons: Scissors,
    barbers: Scissors,
    nail_salons: Sparkles,
    spas: Sparkles,
    skincare: Sparkles,
    waxing: Sparkles,
    // Fitness
    yoga: Dumbbell,
    pilates: Dumbbell,
    gyms: Dumbbell,
    crossfit: Dumbbell,
    boxing: Dumbbell,
    cycling: Dumbbell,
    // Pet Services
    pet_stores: Dog,
    pet_groomers: Dog,
    dog_walkers: Dog,
    pet_boarding: Dog,
    veterinarians: Dog,
    // Retail
    shopping: Store,
    bicycles: Store,
    florists: Store,
    cannabis: Cannabis,
    furniture: Home,
    home_decor: Home,
    // Hospitality
    hotels: Building,
    hostels: Building,
    vacation_rentals: Building,
    coworking: Briefcase,
    // Traditional
    laundromat: Store,
    check_cashing: Store,
    pawn_shops: Store,
    payday_loans: Store,
    dollar_stores: Store,
    fast_food: Store,
    taquerias: Store,
    auto_repair: Store,
    tire_shops: Store,
};

// Color by type - more balanced distribution
const TYPE_COLORS = {
    gentrifying: 'text-purple-400',
    traditional: 'text-amber-400',
    core: 'text-blue-400',
    neutral: 'text-gray-400',
};

// Category type mapping - rebalanced for better color distribution
const CATEGORY_TYPES = {
    // Core (blue) - standard businesses
    restaurants: 'core', bars: 'core', hotels: 'core', gyms: 'core',
    nail_salons: 'core', veterinarians: 'core', shopping: 'core',
    furniture: 'core', hostels: 'core', hair_salons: 'core',
    // Gentrifying (purple) - hipster/upscale indicators
    breweries: 'gentrifying', coffee: 'gentrifying', juicebars: 'gentrifying',
    vegan: 'gentrifying', wine_bars: 'gentrifying', cocktailbars: 'gentrifying',
    galleries: 'gentrifying', vintage: 'gentrifying', yoga: 'gentrifying',
    pilates: 'gentrifying', coworking: 'gentrifying', cycling: 'gentrifying',
    // Traditional (amber) - established community businesses  
    barbers: 'traditional', laundromat: 'traditional', check_cashing: 'traditional',
    pawn_shops: 'traditional', payday_loans: 'traditional', dollar_stores: 'traditional',
    fast_food: 'traditional', taquerias: 'traditional', auto_repair: 'traditional',
    tire_shops: 'traditional',
    // Neutral (gray) - mixed indicators
    tattoo: 'neutral', thrift_stores: 'neutral', antiques: 'neutral',
    vinyl_records: 'neutral', bookstores: 'neutral', spas: 'neutral',
    skincare: 'neutral', waxing: 'neutral', crossfit: 'neutral', boxing: 'neutral',
    pet_stores: 'neutral', pet_groomers: 'neutral', dog_walkers: 'neutral',
    pet_boarding: 'neutral', bicycles: 'neutral', florists: 'neutral',
    cannabis: 'neutral', home_decor: 'neutral', vacation_rentals: 'neutral',
};

// Region groupings
const REGIONS = {
    all: { label: 'All Neighborhoods', neighborhoods: null },
    central: {
        label: 'Central SD',
        neighborhoods: ['Downtown (Gaslamp)', 'East Village', 'Little Italy', 'Hillcrest', 'North Park', 'South Park', 'University Heights', 'Normal Heights', 'Kensington', 'Mission Hills']
    },
    coastal: {
        label: 'Coastal',
        neighborhoods: ['La Jolla', 'Pacific Beach', 'Ocean Beach', 'Coronado', 'Del Mar', 'Point Loma', 'Bay Park']
    },
    north: {
        label: 'North',
        neighborhoods: ['Clairemont']
    },
};

// Risk color based on score (0-100 now) - wider thresholds
const getScoreColor = (score) => {
    if (score >= 70) return { bg: 'bg-purple-500', text: 'text-purple-400', label: 'High' };
    if (score >= 55) return { bg: 'bg-blue-500', text: 'text-blue-400', label: 'Moderate' };
    if (score >= 40) return { bg: 'bg-green-500', text: 'text-green-400', label: 'Emerging' };
    return { bg: 'bg-slate-500', text: 'text-slate-400', label: 'Stable' };
};

// Compact neighborhood card - updated for Yelp data structure
function NeighborhoodCard({ neighborhood, rank }) {
    // Calculate score from gentrifying vs traditional counts
    const genCount = Object.entries(neighborhood.categories || {})
        .filter(([key]) => CATEGORY_TYPES[key] === 'gentrifying')
        .reduce((sum, [, cat]) => sum + (cat.count || 0), 0);

    const tradCount = Object.entries(neighborhood.categories || {})
        .filter(([key]) => CATEGORY_TYPES[key] === 'traditional')
        .reduce((sum, [, cat]) => sum + (cat.count || 0), 0);

    const total = genCount + tradCount;
    const score = total > 0 ? Math.round((genCount / total) * 100) : 50;
    const scoreInfo = getScoreColor(score);

    // Top categories by count
    const topCategories = Object.entries(neighborhood.categories || {})
        .filter(([, cat]) => cat.count > 0)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

    return (
        <div className={`bg-slate-800/50 border rounded-lg p-3 ${rank <= 3 ? 'border-purple-500/40' : 'border-slate-700/50'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    {rank <= 3 && <span className="text-purple-400 text-xs font-medium">#{rank}</span>}
                    <span className="text-sm font-medium text-white truncate">{neighborhood.name}</span>
                </div>
                <span className={`text-xs font-medium ${scoreInfo.text} flex-shrink-0`}>
                    {score}%
                </span>
            </div>
            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className={`h-full ${scoreInfo.bg}`} style={{ width: `${score}%` }} />
            </div>
            {/* Quick category icons */}
            <div className="flex gap-1.5 flex-wrap">
                {topCategories.map(([key, data]) => {
                    const Icon = CATEGORY_ICONS[key] || Store;
                    const catType = CATEGORY_TYPES[key] || 'core';
                    const color = TYPE_COLORS[catType];
                    return (
                        <div key={key} className="flex items-center gap-0.5 text-[10px]" title={data.label}>
                            <Icon className={`w-3 h-3 ${color}`} />
                            <span className="text-slate-400">{data.count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Sort options
const SORT_OPTIONS = [
    { value: 'score_desc', label: 'Gentrification Score' },
    { value: 'name_asc', label: 'Name: A-Z' },
    { value: 'restaurants_desc', label: 'Most Restaurants' },
    { value: 'coffee_desc', label: 'Most Coffee Shops' },
    { value: 'breweries_desc', label: 'Most Breweries' },
    { value: 'tattoo_desc', label: 'Most Tattoo Shops' },
    { value: 'yoga_desc', label: 'Most Yoga Studios' },
    { value: 'pet_stores_desc', label: 'Most Pet Stores' },
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
                const res = await fetch('/data/yelp_snapshot.json');
                if (res.ok) setRetailData(await res.json());
            } catch (err) {
                console.error('Yelp data fetch error:', err);
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

        // Helper to get category count from Yelp data
        const getCategoryCount = (n, category) => n.categories?.[category]?.count || 0;

        // Helper to calculate gentrification score
        const getGenScore = (n) => {
            const genCount = Object.entries(n.categories || {})
                .filter(([key]) => CATEGORY_TYPES[key] === 'gentrifying')
                .reduce((sum, [, cat]) => sum + (cat.count || 0), 0);
            const tradCount = Object.entries(n.categories || {})
                .filter(([key]) => CATEGORY_TYPES[key] === 'traditional')
                .reduce((sum, [, cat]) => sum + (cat.count || 0), 0);
            const total = genCount + tradCount;
            return total > 0 ? (genCount / total) * 100 : 50;
        };

        switch (sortBy) {
            case 'score_desc':
                result.sort((a, b) => getGenScore(b) - getGenScore(a));
                break;
            case 'name_asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'restaurants_desc':
                result.sort((a, b) => getCategoryCount(b, 'restaurants') - getCategoryCount(a, 'restaurants'));
                break;
            case 'coffee_desc':
                result.sort((a, b) => getCategoryCount(b, 'coffee') - getCategoryCount(a, 'coffee'));
                break;
            case 'breweries_desc':
                result.sort((a, b) => getCategoryCount(b, 'breweries') - getCategoryCount(a, 'breweries'));
                break;
            case 'tattoo_desc':
                result.sort((a, b) => getCategoryCount(b, 'tattoo') - getCategoryCount(a, 'tattoo'));
                break;
            case 'yoga_desc':
                result.sort((a, b) => getCategoryCount(b, 'yoga') - getCategoryCount(a, 'yoga'));
                break;
            case 'pet_stores_desc':
                result.sort((a, b) => getCategoryCount(b, 'pet_stores') - getCategoryCount(a, 'pet_stores'));
                break;
            default:
                result.sort((a, b) => getGenScore(b) - getGenScore(a));
        }

        return result;
    }, [retailData, selectedRegion, sortBy]);


    // Display count
    const displayCount = showAll ? filteredNeighborhoods.length : Math.min(8, filteredNeighborhoods.length);
    const displayedNeighborhoods = filteredNeighborhoods.slice(0, displayCount);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-24">
                <div className="animate-spin w-5 h-5 border-2 border-slate-600 border-t-purple-500 rounded-full" />
            </div>
        );
    }

    const neighborhoods = retailData?.neighborhoods || [];

    if (neighborhoods.length === 0) {
        return (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm">
                    Run <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">python scripts/fetch_yelp_data.py</code> to load Yelp data
                </p>
            </div>
        );
    }

    // Get summary counts from Yelp data - pick key categories
    const totalCounts = retailData?.summary?.total_counts || {};
    const keyCategories = ['restaurants', 'coffee', 'breweries', 'tattoo', 'yoga', 'pet_stores', 'hair_salons', 'laundromat'];
    const summaryItems = keyCategories
        .filter(key => totalCounts[key] > 0)
        .slice(0, 6)
        .map(key => [key, totalCounts[key]]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Quick stats row - clickable to sort */}
            {summaryItems.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {summaryItems.map(([key, count]) => {
                        const Icon = CATEGORY_ICONS[key] || Store;
                        const catType = CATEGORY_TYPES[key] || 'core';
                        const color = TYPE_COLORS[catType];
                        // Map category keys to sort values
                        const sortMap = {
                            'restaurants': 'restaurants_desc',
                            'coffee': 'coffee_desc',
                            'breweries': 'breweries_desc',
                            'tattoo': 'tattoo_desc',
                            'yoga': 'yoga_desc',
                            'pet_stores': 'pet_stores_desc',
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
                                <p className="text-lg font-bold text-white">{count.toLocaleString()}</p>
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

            {/* Compact legend with last fetched date */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
                <div className="flex flex-wrap items-center gap-3">
                    <span>Categories:</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full" /> Gentrifying</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Core</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full" /> Traditional</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-500 rounded-full" /> Neutral</span>
                </div>
                <div className="text-slate-500">
                    Yelp data: {retailData?.meta?.generated ? new Date(retailData.meta.generated).toLocaleDateString() : 'Unknown'}
                </div>
            </div>
        </div>
    );
}

export default RetailSignals;
