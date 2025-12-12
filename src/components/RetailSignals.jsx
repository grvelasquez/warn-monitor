import { useState, useEffect, useMemo } from 'react';
import { Coffee, Dumbbell, Beer, Palette, Store, Dog, Briefcase, MapPin } from 'lucide-react';

// Icon mapping for OSM categories
const CATEGORY_ICONS = {
    coffee_specialty: Coffee,
    yoga_fitness: Dumbbell,
    brewery_taproom: Beer,
    art_gallery: Palette,
    organic_grocery: Store,
    pet_services: Dog,
    coworking: Briefcase,
    laundromat: Store,
    fast_food: Store,
    check_cashing: Store,
};

// Colors for gentrifying vs traditional
const TYPE_COLORS = {
    gentrifying: 'text-purple-400',
    traditional: 'text-amber-400',
};



// Compact neighborhood card for OSM data structure
function NeighborhoodCard({ neighborhood }) {
    // Get all categories with counts
    const genCategories = Object.entries(neighborhood.gentrifying || {})
        .filter(([, data]) => data.count > 0)
        .sort((a, b) => b[1].count - a[1].count);

    const tradCategories = Object.entries(neighborhood.traditional || {})
        .filter(([, data]) => data.count > 0)
        .sort((a, b) => b[1].count - a[1].count);

    const totalBusinesses = genCategories.reduce((sum, [, d]) => sum + d.count, 0) +
        tradCategories.reduce((sum, [, d]) => sum + d.count, 0);

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white truncate">{neighborhood.name}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">
                    {totalBusinesses} total
                </span>
            </div>
            {/* Category icons */}
            <div className="flex gap-1.5 flex-wrap">
                {genCategories.slice(0, 4).map(([key, data]) => {
                    const Icon = CATEGORY_ICONS[key] || Store;
                    return (
                        <div key={key} className="flex items-center gap-0.5 text-[10px]" title={data.label}>
                            <Icon className="w-3 h-3 text-purple-400" />
                            <span className="text-slate-400">{data.count}</span>
                        </div>
                    );
                })}
                {tradCategories.slice(0, 2).map(([key, data]) => {
                    const Icon = CATEGORY_ICONS[key] || Store;
                    return (
                        <div key={key} className="flex items-center gap-0.5 text-[10px]" title={data.label}>
                            <Icon className="w-3 h-3 text-amber-400" />
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
    { value: 'total_desc', label: 'Most Businesses' },
    { value: 'name_asc', label: 'Name: A-Z' },
    { value: 'coffee_desc', label: 'Most Coffee Shops' },
    { value: 'fitness_desc', label: 'Most Fitness Studios' },
    { value: 'brewery_desc', label: 'Most Breweries' },
];

// Main component
export function RetailSignals({ className = "" }) {
    const [retailData, setRetailData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('total_desc');
    const [showAll, setShowAll] = useState(false);

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

    // Helper to calculate total businesses for a neighborhood
    const getTotalBusinesses = (n) => {
        const genTotal = Object.values(n.gentrifying || {}).reduce((sum, d) => sum + (d.count || 0), 0);
        const tradTotal = Object.values(n.traditional || {}).reduce((sum, d) => sum + (d.count || 0), 0);
        return genTotal + tradTotal;
    };

    // Filter and sort neighborhoods
    const sortedNeighborhoods = useMemo(() => {
        if (!retailData?.neighborhoods) return [];

        let result = [...retailData.neighborhoods];

        // Helper functions
        const getCount = (n, type, cat) => n[type]?.[cat]?.count || 0;

        switch (sortBy) {
            case 'total_desc':
                result.sort((a, b) => getTotalBusinesses(b) - getTotalBusinesses(a));
                break;
            case 'name_asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'coffee_desc':
                result.sort((a, b) => getCount(b, 'gentrifying', 'coffee_specialty') - getCount(a, 'gentrifying', 'coffee_specialty'));
                break;
            case 'fitness_desc':
                result.sort((a, b) => getCount(b, 'gentrifying', 'yoga_fitness') - getCount(a, 'gentrifying', 'yoga_fitness'));
                break;
            case 'brewery_desc':
                result.sort((a, b) => getCount(b, 'gentrifying', 'brewery_taproom') - getCount(a, 'gentrifying', 'brewery_taproom'));
                break;
            default:
                result.sort((a, b) => getTotalBusinesses(b) - getTotalBusinesses(a));
        }

        return result;
    }, [retailData, sortBy]);

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
    const summary = retailData?.summary || {};
    const totalGen = summary.totalGentrifying || {};
    const totalTrad = summary.totalTraditional || {};

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Quick stats row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                    { key: 'coffee_specialty', label: 'Coffee', count: totalGen.coffee_specialty, Icon: Coffee, color: 'text-purple-400' },
                    { key: 'yoga_fitness', label: 'Fitness', count: totalGen.yoga_fitness, Icon: Dumbbell, color: 'text-purple-400' },
                    { key: 'brewery_taproom', label: 'Breweries', count: totalGen.brewery_taproom, Icon: Beer, color: 'text-purple-400' },
                    { key: 'organic_grocery', label: 'Grocery', count: totalGen.organic_grocery, Icon: Store, color: 'text-purple-400' },
                    { key: 'fast_food', label: 'Fast Food', count: totalTrad.fast_food, Icon: Store, color: 'text-amber-400' },
                    { key: 'laundromat', label: 'Laundromat', count: totalTrad.laundromat, Icon: Store, color: 'text-amber-400' },
                ].filter(item => item.count > 0).map(({ key, label, count, Icon, color }) => (
                    <div
                        key={key}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 text-center"
                    >
                        <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                        <p className="text-lg font-bold text-white">{count?.toLocaleString() || 0}</p>
                        <p className="text-[10px] text-slate-500 capitalize truncate">{label}</p>
                    </div>
                ))}
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Sort dropdown */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 pr-8 text-sm text-white cursor-pointer hover:border-slate-600 focus:outline-none focus:border-purple-500"
                    >
                        {SORT_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1" />
                <span className="text-xs text-slate-500">
                    Showing {displayedNeighborhoods.length} of {neighborhoods.length} neighborhoods
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

            {/* Footer with legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
                <div className="flex flex-wrap items-center gap-3">
                    <span>Categories:</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full" /> Gentrifying</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full" /> Traditional</span>
                </div>
                <div className="text-slate-500">
                    OSM data: {retailData?.meta?.generated ? new Date(retailData.meta.generated).toLocaleDateString() : 'Unknown'}
                </div>
            </div>
        </div>
    );
}

export default RetailSignals;
