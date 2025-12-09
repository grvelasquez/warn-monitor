import { useState, useEffect } from 'react';
import { Coffee, Dumbbell, Beer, Palette, Store, Dog, Briefcase, TrendingUp, TrendingDown, MapPin } from 'lucide-react';

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

// Risk color based on gentrification score
const getScoreColor = (score) => {
    if (score >= 0.7) return { bg: 'bg-red-500', text: 'text-red-400', label: 'High' };
    if (score >= 0.5) return { bg: 'bg-orange-500', text: 'text-orange-400', label: 'Moderate' };
    if (score >= 0.3) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Low' };
    return { bg: 'bg-green-500', text: 'text-green-400', label: 'Stable' };
};

// Neighborhood card
function NeighborhoodCard({ neighborhood, isTop }) {
    const scoreInfo = getScoreColor(neighborhood.gentrificationScore);
    const totalGentrifying = Object.values(neighborhood.gentrifying || {}).reduce(
        (sum, cat) => sum + (cat.count || 0), 0
    );

    return (
        <div className={`bg-slate-800/50 border rounded-xl p-4 transition-all ${isTop ? 'border-orange-500/50' : 'border-slate-700/50'
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <h4 className="font-medium text-white">{neighborhood.name}</h4>
                    </div>
                    {isTop && (
                        <span className="text-xs text-orange-400 mt-1">🔥 Hot Zone</span>
                    )}
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${scoreInfo.bg}/20 ${scoreInfo.text}`}>
                    {(neighborhood.gentrificationScore * 100).toFixed(0)}%
                </div>
            </div>

            {/* Score bar */}
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                    className={`h-full ${scoreInfo.bg} transition-all`}
                    style={{ width: `${neighborhood.gentrificationScore * 100}%` }}
                />
            </div>

            {/* Top categories */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(neighborhood.gentrifying || {}).slice(0, 4).map(([key, data]) => {
                    const Icon = CATEGORY_ICONS[key] || Store;
                    const color = CATEGORY_COLORS[key] || 'text-slate-400';

                    if (!data.count || data.count === 0) return null;

                    return (
                        <div key={key} className="flex items-center gap-1 text-xs">
                            <Icon className={`w-3 h-3 ${color}`} />
                            <span className="text-slate-400">{data.count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Category summary card
function CategorySummary({ data }) {
    const categories = Object.entries(data?.summary?.totalGentrifying || {});

    if (categories.length === 0) return null;

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                Gentrification Indicators (County-wide)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {categories.map(([key, count]) => {
                    const Icon = CATEGORY_ICONS[key] || Store;
                    const color = CATEGORY_COLORS[key] || 'text-slate-400';
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    return (
                        <div key={key} className="text-center">
                            <div className={`inline-flex p-3 rounded-full bg-slate-700/50 mb-2`}>
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                            <p className="text-2xl font-bold text-white">{count}</p>
                            <p className="text-xs text-slate-400">{label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Main component
export function RetailSignals({ className = "" }) {
    const [retailData, setRetailData] = useState(null);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                // Fetch OSM retail data
                const retailRes = await fetch('/data/retail_data.json');
                if (retailRes.ok) {
                    const data = await retailRes.json();
                    setRetailData(data);
                }

                // Fetch business license data
                const bizRes = await fetch('/data/business_licenses.json');
                if (bizRes.ok) {
                    const data = await bizRes.json();
                    setBusinessData(data);
                }
            } catch (err) {
                console.error('Error fetching retail data:', err);
                setError('Failed to load retail data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className={`bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 ${className}`}>
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-orange-500 rounded-full" />
                </div>
            </div>
        );
    }

    // Use available data or show placeholder
    const neighborhoods = retailData?.neighborhoods || businessData?.neighborhoods || [];
    const topNeighborhoods = neighborhoods.slice(0, 6);

    if (neighborhoods.length === 0 && !error) {
        return (
            <div className={`bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Store className="w-5 h-5 text-slate-500" />
                    Retail Signals
                </h3>
                <p className="text-slate-400 text-sm">
                    Retail data will be available after the next data update.
                    Run <code className="bg-slate-700 px-1 rounded">python scripts/fetch_retail_data.py</code>
                </p>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Category summary */}
            {retailData && <CategorySummary data={retailData} />}

            {/* Neighborhood grid */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-slate-500" />
                        Neighborhood Retail Index
                    </h3>
                    <span className="text-xs text-slate-500">
                        {retailData?.meta?.generated ?
                            `Updated ${new Date(retailData.meta.generated).toLocaleDateString()}` :
                            'From local data'
                        }
                    </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topNeighborhoods.map((n, idx) => (
                        <NeighborhoodCard
                            key={n.name || n.zip}
                            neighborhood={n}
                            isTop={idx < 3}
                        />
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap gap-4 text-xs">
                    <span className="text-slate-500">Gentrification Index:</span>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-slate-400">0-30% Stable</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span className="text-slate-400">30-50% Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-slate-400">50-70% Moderate</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-slate-400">70%+ High</span>
                    </div>
                </div>
            </div>

            {/* Data source footer */}
            <p className="text-xs text-slate-500 text-center">
                Sources: OpenStreetMap Overpass API, City of San Diego Business Tax Certificates
            </p>
        </div>
    );
}

export default RetailSignals;
