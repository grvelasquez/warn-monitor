import { useState, useEffect, useMemo } from 'react';
import {
    Coffee, Utensils, Pizza, Wine, Beer, ShoppingCart,
    Sprout, Store, Shirt, Laptop, Dog, Cookie,
    Landmark, CreditCard, Scissors, Wrench, Fuel,
    Pill, Dumbbell, Stethoscope, Smile, GraduationCap,
    Book, Trees, Briefcase, IceCream, MapPin, Search,
    TrendingUp, Construction, Zap, Star, ChevronDown, ChevronUp,
    Flame, Sun, Activity
} from 'lucide-react';
import { MAJOR_PROJECTS } from '../data/development_projects';

// Icon mapping for OSM categories
const CATEGORY_ICONS = {
    // Food & Drink
    coffee_specialty: Coffee,
    restaurant: Utensils,
    fast_food: Pizza,
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
    laundromat: Shirt,
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
    place_of_worship: MapPin,
    coworking: Briefcase,
};

// Helper to find projects for a neighborhood
function getProjects(neighborhoodName) {
    if (!neighborhoodName) return [];
    const cleanName = neighborhoodName.replace(/^\d+-/, '');
    return MAJOR_PROJECTS.filter(p =>
        cleanName.includes(p.location) || p.location.includes(cleanName)
    );
}

// Momentum / Trend Card
function NeighborhoodCard({ neighborhood, filterCategory = 'all' }) {
    const [expanded, setExpanded] = useState(false);

    const categories = Object.entries(neighborhood.categories || {})
        .filter(([, data]) => data.count > 0)
        .sort((a, b) => b[1].count - a[1].count);

    // Find growing categories
    const growingCategories = Object.entries(neighborhood.categories || {})
        .filter(([, data]) => data.new_openings > 0)
        .sort((a, b) => b[1].new_openings - a[1].new_openings);

    const totalBusinesses = neighborhood.total_businesses || 0;
    const newOpenings = neighborhood.total_new_openings || 0;
    const boutiqueRatio = neighborhood.boutique_ratio || 0;
    const projects = getProjects(neighborhood.name);
    const projectCount = projects.length;

    // Extract Zip
    const zipCode = neighborhood.name.match(/^\d+/)?.[0] || "";

    // Logic for "Vibe" fallback
    const vibe = neighborhood.vibe || zipCode;

    // Clean name
    const displayName = neighborhood.name.replace(/^\d+-/, '');

    // "Hype Score" calculation
    const hypeScore = Math.min(100, (newOpenings * 10) + (projectCount * 15) + (boutiqueRatio > 80 ? 10 : 0));
    const isHot = hypeScore >= 40;

    // Status Logic
    let statusIcon = Activity;
    let statusColor = "text-slate-400";
    let statusText = "Steady";

    if (hypeScore > 60) {
        statusIcon = Flame;
        statusColor = "text-orange-500";
        statusText = "Heating Up";
    } else if (hypeScore > 30) {
        statusIcon = TrendingUp;
        statusColor = "text-green-500";
        statusText = "Growth Mode";
    } else if (projectCount > 0) {
        statusIcon = Construction;
        statusColor = "text-amber-500";
        statusText = "Developing";
    } else {
        statusIcon = Sun;
        statusColor = "text-yellow-400";
        statusText = "Steady";
    }

    const StatusIcon = statusIcon;

    // Filter Mode Logic: Select data to show in highlight slot
    let highlightIcon = TrendingUp;
    let highlightLabel = "Top Mover";
    let highlightValue = "";
    let highlightSubtext = "";

    if (filterCategory !== 'all') {
        const catData = neighborhood.categories?.[filterCategory];
        const Icon = CATEGORY_ICONS[filterCategory] || Store;
        highlightIcon = Icon;
        highlightLabel = filterCategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        highlightValue = `${catData?.count || 0} Locations`;
        highlightSubtext = catData?.new_openings > 0 ? `+${catData.new_openings} New` : '';
    } else if (growingCategories.length > 0) {
        const [key, data] = growingCategories[0];
        const Icon = CATEGORY_ICONS[key] || Store;
        highlightIcon = Icon;
        highlightLabel = "Top Mover: " + data.label;
        highlightValue = `+${data.new_openings} New`;
    }

    const HighlightIcon = highlightIcon;

    // Default "Trend" Mode
    return (
        <div
            className={`relative flex flex-col bg-slate-900/40 border transition-all duration-300 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-purple-900/10 ${expanded ? 'ring-1 ring-purple-500/50 z-10 scale-[1.02]' : 'hover:scale-[1.01]'} ${isHot ? 'border-purple-500/50' : 'border-slate-800'}`}
        >
            {/* Vibe Badge */}
            <div className="absolute top-0 right-0 bg-slate-950/90 backdrop-blur px-3 py-1 rounded-bl-xl border-b border-l border-slate-800 shadow-sm z-10">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">{vibe}</span>
            </div>

            {/* Main Content Clickable Area */}
            <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="mb-4 pr-24">
                    <h3 className="text-lg font-bold text-white leading-tight">{displayName}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
                        <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
                    </div>
                </div>

                {/* Hype Meter */}
                <div className="mb-4 space-y-1">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Market Velocity</span>
                        <span className="text-slate-300">{hypeScore}/100</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${isHot ? 'from-orange-500 to-red-600' : 'from-blue-500 to-purple-500'}`}
                            style={{ width: `${hypeScore}%` }}
                        />
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Momentum */}
                    <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30 relative overflow-hidden">
                        <div className="flex items-center gap-1.5 h-full">
                            <TrendingUp className={`w-4 h-4 ${newOpenings > 0 ? 'text-green-400' : (isHot ? 'text-orange-500' : 'text-slate-600')}`} />
                            <span className="text-sm font-bold text-white">{newOpenings > 0 ? `+${newOpenings} New` : (isHot ? 'Hot' : 'Stable')}</span>
                        </div>
                    </div>
                    {/* Pipeline */}
                    <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30">
                        <div className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Pipeline</div>
                        <div className="flex items-center gap-1.5">
                            <Construction className={`w-4 h-4 ${projectCount > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
                            <span className="text-sm font-bold text-white">{projectCount > 0 ? `${projectCount} Projects` : 'No Major Projects'}</span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Highlight (Top Mover OR Selected Category) */}
                {((filterCategory !== 'all') || (growingCategories.length > 0)) && !expanded && (
                    <div className="flex items-center gap-2 text-xs bg-green-900/10 border border-green-900/30 rounded-lg px-2 py-1.5 text-green-300 mb-2">
                        {filterCategory === 'all' && <TrendingUp className="w-3 h-3" />}
                        <span className={filterCategory !== 'all' ? "text-slate-400" : ""}>{filterCategory !== 'all' ? "" : ""}</span>
                        <span className="font-bold flex items-center gap-1">
                            <HighlightIcon className="w-3 h-3" />
                            {highlightLabel} ({highlightValue}) {highlightSubtext}
                        </span>
                    </div>
                )}

                {/* Expand Hint */}
                <div className="flex justify-center mt-2">
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-slate-800 bg-slate-900/60 pt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">

                    {/* Detailed Growth */}
                    {newOpenings > 0 ? (
                        <div>
                            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                                <Activity className="w-3 h-3 text-green-400" />
                                Recent Openings (L12M)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {growingCategories.map(([key, data]) => {
                                    const Icon = CATEGORY_ICONS[key] || Store;
                                    return (
                                        <div key={key} className="flex items-center gap-1.5 text-[11px] bg-slate-800 text-slate-200 px-2 py-1 rounded border border-slate-700">
                                            <Icon className="w-3 h-3 text-purple-400" />
                                            <span>{data.label}</span>
                                            <span className="bg-green-500/20 text-green-400 px-1 rounded font-bold text-[9px]">{data.new_openings > 0 ? `+${data.new_openings}` : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500 italic">No verified new openings detected in last 12 months.</div>
                    )}

                    {/* Project Details */}
                    {projects.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                                <Construction className="w-3 h-3 text-amber-400" />
                                Development Pipeline
                            </h4>
                            <div className="space-y-2">
                                {projects.map((p, i) => (
                                    <div key={i} className="bg-slate-800 p-2 rounded border border-slate-700/50">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-medium text-white block">{p.name}</span>
                                            <span className={`text-[9px] px-1 rounded ${p.status.includes('Under') ? 'bg-amber-900/30 text-amber-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                {p.completion}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                                            <span>{p.type}</span>
                                            <span>•</span>
                                            <span>{p.sqft !== '0' ? p.sqft : `${p.units} Units`}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vibe / Boutique Context */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400">Neighborhood Composition</span>
                            <span className="text-purple-300">{boutiqueRatio}% Independent</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${boutiqueRatio}%` }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sort options
const SORT_OPTIONS = [
    { value: 'momentum_desc', label: 'Highest Momentum (New Openings)' },
    { value: 'hype_desc', label: 'Highest Hype (Velocity)' },
    { value: 'pipeline_desc', label: 'Development Pipeline' },
    { value: 'total_desc', label: 'Total Volume' },
    { value: 'name_asc', label: 'Name (A-Z)' },
];

// Main component
export function RetailSignals({ className = "" }) {
    const [retailData, setRetailData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('momentum_desc');
    const [showAll, setShowAll] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Add cache-busting to ensure we get the latest data
                const res = await fetch(`/data/retail_data.json?t=${Date.now()}`);
                if (res.ok) setRetailData(await res.json());
            } catch (err) {
                console.error('Data fetch error:', err);
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
            result.sort((a, b) => (b.categories?.[filterCategory]?.count || 0) - (a.categories?.[filterCategory]?.count || 0));
            return result;
        }

        // Helper functions
        const getMomentum = (n) => n.total_new_openings || 0;
        const getBoutique = (n) => n.boutique_ratio || 0;
        const getPipeline = (n) => getProjects(n.name).length;
        const getHype = (n) => (getMomentum(n) * 10) + (getPipeline(n) * 15);

        switch (sortBy) {
            case 'momentum_desc':
                result.sort((a, b) => getMomentum(b) - getMomentum(a));
                break;
            case 'hype_desc':
                result.sort((a, b) => getHype(b) - getHype(a));
                break;
            case 'pipeline_desc':
                result.sort((a, b) => getPipeline(b) - getPipeline(a));
                break;
            case 'total_desc':
                result.sort((a, b) => (b.total_businesses || 0) - (a.total_businesses || 0));
                break;
            case 'name_asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                result.sort((a, b) => getMomentum(b) - getMomentum(a));
        }

        return result;
    }, [retailData, sortBy, filterCategory]);

    const displayCount = showAll ? sortedNeighborhoods.length : Math.min(12, sortedNeighborhoods.length);
    const displayedNeighborhoods = sortedNeighborhoods.slice(0, displayCount);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-purple-500 rounded-full" />
            </div>
        );
    }

    const neighborhoods = retailData?.neighborhoods || [];
    const totalNew = retailData?.summary?.totalNewOpenings || 0;
    const topDistricts = retailData?.summary?.topBusinessDistricts || [];
    const hasData = neighborhoods.some(n => n.total_new_openings > 0);

    // Category options
    const totalCounts = retailData?.summary?.totalCounts || {};
    const availableCategories = Object.keys(totalCounts).sort();

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header / Insight Banner */}
            <div className="bg-gradient-to-r from-purple-900/40 to-slate-900/40 border border-purple-500/20 rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-700"></div>

                <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">2026 Trends & Market Signals</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 relative z-10">
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800/50">
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-green-400" /> Growth Momentum
                        </div>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {hasData ? `+${totalNew}` : '--'} <span className="text-sm font-normal text-slate-400">New Openings (L12M)</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800/50">
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-amber-400" /> Top Hub
                        </div>
                        <div className="text-xl font-bold text-white truncate">{topDistricts[0] ? topDistricts[0].replace(/^\d+-/, '') : 'Downtown'}</div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800/50">
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-purple-400" /> Hot Sector
                        </div>
                        <div className="text-xl font-bold text-white flex items-center gap-2">
                            Specialty Coffee <span className="text-[10px] text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded border border-purple-500/30">High Growth</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 text-sm overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    {SORT_OPTIONS.map(opt => {
                        const isActive = sortBy === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setSortBy(opt.value)}
                                className={`px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${isActive ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
                            >
                                {opt.label.split(' (')[0]}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
                    >
                        <option value="all">All Categories</option>
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Neighborhoods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedNeighborhoods.map((n) => (
                    <NeighborhoodCard key={n.name} neighborhood={n} filterCategory={filterCategory} />
                ))}
            </div>

            {/* Show more/less button */}
            {sortedNeighborhoods.length > 12 && (
                <div className="text-center pt-2">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-6 py-2 text-sm font-medium text-slate-400 hover:text-white border border-slate-700/50 hover:border-purple-500/50 rounded-full transition-colors hover:shadow-lg hover:shadow-purple-900/10"
                    >
                        {showAll ? 'Show Less' : `Show All ${sortedNeighborhoods.length} Neighborhoods`}
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 pt-6 border-t border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" /> Growth</span>
                    <span className="flex items-center gap-1"><Construction className="w-3 h-3 text-amber-500" /> Pipeline</span>
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> High Velocity</span>
                </div>
                <span>Data: OpenStreetMap Live Feed • Permits: Major Projects Database • Updated: {retailData?.meta?.generated ? new Date(retailData.meta.generated).toLocaleDateString() : 'Today'}</span>
            </div>
        </div>
    );
}

export default RetailSignals;
