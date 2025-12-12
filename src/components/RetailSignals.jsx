import { useState, useEffect, useMemo } from 'react';
import {
    Coffee, Utensils, Pizza, Wine, Beer, ShoppingCart,
    Sprout, Store, Shirt, Laptop, Dog, Cookie,
    Landmark, CreditCard, Scissors, Wrench, Fuel,
    Pill, Dumbbell, Stethoscope, Smile, GraduationCap,
    Book, Trees, Briefcase, IceCream, MapPin, Search
} from 'lucide-react';

// Icon mapping for OSM categories
const CATEGORY_ICONS = {
    // Food & Drink
    coffee_specialty: Coffee,
    restaurant: Utensils,
    fast_food: Pizza, // or Store
    bar: Wine,
    brewery_taproom: Beer,
    ice_cream: IceCream,

    // Retail
    grocery: ShoppingCart,
    organic_grocery: Sprout,
    convenience: Store,
    clothing: Shirt,
    electronics: Laptop,
    pet_shop: Dog,
    bakery: Cookie,

    // Services
    bank: Landmark,
    atm: CreditCard,
    laundromat: Shirt, // Close enough
    hair_salon: Scissors,
    car_repair: Wrench,
    gas_station: Fuel,

    // Health
    pharmacy: Pill,
    fitness: Dumbbell,
    clinic: Stethoscope,
    dentist: Smile,

    // Community
    school: GraduationCap,
    library: Book,
    park: Trees,
    place_of_worship: MapPin, // Generic
    coworking: Briefcase,
};

// Compact neighborhood card for OSM data structure
function NeighborhoodCard({ neighborhood }) {
    // Get all categories with counts
    const categories = Object.entries(neighborhood.categories || {})
        .filter(([, data]) => data.count > 0)
        .sort((a, b) => b[1].count - a[1].count);

    const totalBusinesses = neighborhood.total_businesses || 0;

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white truncate pr-2" title={neighborhood.name}>
                    {neighborhood.name.replace(/^\d+-/, '')} {/* Remove zip prefix for cleaner display */}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0 bg-slate-800 px-1.5 py-0.5 rounded">
                    {totalBusinesses}
                </span>
            </div>
            {/* Top categories icons */}
            <div className="flex gap-1.5 flex-wrap">
                {categories.slice(0, 6).map(([key, data]) => {
                    const Icon = CATEGORY_ICONS[key] || Store;
                    return (
                        <div key={key} className="flex items-center gap-1 text-[10px] bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/30" title={data.label}>
                            <Icon className="w-3 h-3 text-slate-300" />
                            <span className="text-slate-400 font-medium">{data.count}</span>
                        </div>
                    );
                })}
                {categories.length > 6 && (
                    <span className="text-[10px] text-slate-500 self-center">+{categories.length - 6}</span>
                )}
            </div>
        </div>
    );
}

// Sort options
const SORT_OPTIONS = [
    { value: 'total_desc', label: 'Most Businesses' },
    { value: 'name_asc', label: 'Name: A-Z' },
    { value: 'coffee_desc', label: 'Most Coffee Shops' },
    { value: 'restaurant_desc', label: 'Most Restaurants' },
    { value: 'fitness_desc', label: 'Most Fitness' },
    { value: 'park_desc', label: 'Most Parks' },
];

// Main component
export function RetailSignals({ className = "" }) {
    const [retailData, setRetailData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('total_desc');
    const [showAll, setShowAll] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/data/retail_data.json');
                if (res.ok) setRetailData(await res.json());
            } catch (err) {
                console.error('OSM data fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter and sort neighborhoods
    const sortedNeighborhoods = useMemo(() => {
        if (!retailData?.neighborhoods) return [];

        let result = [...retailData.neighborhoods];

        // Filter by specific category if selected
        if (filterCategory !== 'all') {
            result = result.filter(n => (n.categories?.[filterCategory]?.count || 0) > 0);
        }

        // Helper functions
        const getCount = (n, cat) => n.categories?.[cat]?.count || 0;

        switch (sortBy) {
            case 'total_desc':
                result.sort((a, b) => (b.total_businesses || 0) - (a.total_businesses || 0));
                break;
            case 'name_asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'coffee_desc':
                result.sort((a, b) => getCount(b, 'coffee_specialty') - getCount(a, 'coffee_specialty'));
                break;
            case 'restaurant_desc':
                result.sort((a, b) => getCount(b, 'restaurant') - getCount(a, 'restaurant'));
                break;
            case 'fitness_desc':
                result.sort((a, b) => getCount(b, 'fitness') - getCount(a, 'fitness'));
                break;
            case 'park_desc':
                result.sort((a, b) => getCount(b, 'park') - getCount(a, 'park'));
                break;
            default:
                result.sort((a, b) => (b.total_businesses || 0) - (a.total_businesses || 0));
        }

        return result;
    }, [retailData, sortBy, filterCategory]);

    const displayCount = showAll ? sortedNeighborhoods.length : Math.min(12, sortedNeighborhoods.length);
    const displayedNeighborhoods = sortedNeighborhoods.slice(0, displayCount);

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
                    Run <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">python scripts/fetch_retail_data.py</code> to load OSM data
                </p>
            </div>
        );
    }

    // Get summary counts
    const totalCounts = retailData?.summary?.totalCounts || {};

    // Get all available categories for filter dropdown
    const availableCategories = Object.keys(totalCounts).sort();

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Quick stats row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                    { key: 'coffee_specialty', label: 'Coffee', Icon: Coffee },
                    { key: 'restaurant', label: 'Restaurants', Icon: Utensils },
                    { key: 'fitness', label: 'Fitness', Icon: Dumbbell },
                    { key: 'park', label: 'Parks', Icon: Trees },
                    { key: 'school', label: 'Schools', Icon: GraduationCap },
                    { key: 'grocery', label: 'Grocery', Icon: ShoppingCart },
                ].map(({ key, label, Icon }) => (
                    <div
                        key={key}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 text-center"
                    >
                        <Icon className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{(totalCounts[key] || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 capitalize truncate">{label}</p>
                    </div>
                ))}
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Sort dropdown */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                    {SORT_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                {/* Category Filter */}
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 max-w-[180px]"
                >
                    <option value="all">All Categories</option>
                    {availableCategories.map(cat => (
                        <option key={cat} value={cat}>
                            {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({totalCounts[cat] || 0})
                        </option>
                    ))}
                </select>

                <div className="flex-1" />
                <span className="text-xs text-slate-500">
                    {displayedNeighborhoods.length} areas
                </span>
            </div>

            {/* Neighborhoods grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {displayedNeighborhoods.map((n) => (
                    <NeighborhoodCard key={n.name} neighborhood={n} />
                ))}
            </div>

            {/* Show more/less button */}
            {sortedNeighborhoods.length > 12 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2 text-sm text-slate-400 hover:text-white border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors"
                >
                    {showAll ? 'Show Less' : `Show All ${sortedNeighborhoods.length} Neighborhoods`}
                </button>
            )}

            <div className="text-center text-[10px] text-slate-600 mt-2">
                Data: OpenStreetMap • Last updated: {retailData?.meta?.generated ? new Date(retailData.meta.generated).toLocaleDateString() : 'Unknown'}
            </div>
        </div>
    );
}

export default RetailSignals;
