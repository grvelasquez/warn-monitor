import { useState, useEffect } from 'react';
import { Coffee, Dumbbell, Beer, Palette, Store, Dog, Briefcase, MapPin } from 'lucide-react';

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

// Compact neighborhood card
function NeighborhoodCard({ neighborhood, rank }) {
    const scoreInfo = getScoreColor(neighborhood.gentrificationScore);

    return (
        <div className={`bg-slate-800/50 border rounded-lg p-3 ${rank <= 3 ? 'border-orange-500/40' : 'border-slate-700/50'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {rank <= 3 && <span className="text-orange-400 text-xs">#{rank}</span>}
                    <span className="text-sm font-medium text-white truncate">{neighborhood.name}</span>
                </div>
                <span className={`text-xs font-medium ${scoreInfo.text}`}>
                    {(neighborhood.gentrificationScore * 100).toFixed(0)}%
                </span>
            </div>
            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${scoreInfo.bg}`} style={{ width: `${neighborhood.gentrificationScore * 100}%` }} />
            </div>
        </div>
    );
}

// Main component - simplified
export function RetailSignals({ className = "" }) {
    const [retailData, setRetailData] = useState(null);
    const [loading, setLoading] = useState(true);

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
    const summaryItems = Object.entries(summary).slice(0, 6);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Quick stats row */}
            {summaryItems.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {summaryItems.map(([key, count]) => {
                        const Icon = CATEGORY_ICONS[key] || Store;
                        const color = CATEGORY_COLORS[key] || 'text-slate-400';
                        return (
                            <div key={key} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 text-center">
                                <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                                <p className="text-lg font-bold text-white">{count}</p>
                                <p className="text-[10px] text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Neighborhoods grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {neighborhoods.slice(0, 8).map((n, idx) => (
                    <NeighborhoodCard key={n.name} neighborhood={n} rank={idx + 1} />
                ))}
            </div>

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
