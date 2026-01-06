// Simple Real Estate News Feed with static data and links
const newsItems = [
    {
        title: "San Diego Home Prices Hit Record High in December",
        source: "SDAR",
        time: "2h ago",
        tag: "RE",
        color: "bg-emerald-600",
        link: "https://www.sdar.com/blog"
    },
    {
        title: "New Luxury Development Breaks Ground in La Jolla",
        source: "Times of SD",
        time: "4h ago",
        tag: "RE",
        color: "bg-emerald-600",
        link: "https://timesofsandiego.com/category/business/"
    },
    {
        title: "Biotech Firm Expands San Diego Headquarters",
        source: "SDBN",
        time: "6h ago",
        tag: "BIO",
        color: "bg-blue-600",
        link: "https://sdbn.org/"
    },
    {
        title: "Housing Inventory Drops 15% Year-Over-Year",
        source: "Voice of SD",
        time: "8h ago",
        tag: "RE",
        color: "bg-emerald-600",
        link: "https://voiceofsandiego.org/category/topics/housing-development/"
    },
    {
        title: "Carmel Valley Schools Ranked Top in County",
        source: "Times of SD",
        time: "12h ago",
        tag: "BIZ",
        color: "bg-amber-600",
        link: "https://timesofsandiego.com/category/education/"
    },
    {
        title: "Del Mar Heights ADU Regulations Updated",
        source: "Voice of SD",
        time: "1d ago",
        tag: "RE",
        color: "bg-emerald-600",
        link: "https://voiceofsandiego.org/category/topics/housing-development/"
    },
    {
        title: "Tech Startup Relocates 200 Workers to UTC",
        source: "Times of SD",
        time: "1d ago",
        tag: "TECH",
        color: "bg-purple-600",
        link: "https://timesofsandiego.com/category/tech/"
    },
    {
        title: "Mortgage Rates Dip Below 7% for First Time",
        source: "SDAR",
        time: "2d ago",
        tag: "RE",
        color: "bg-emerald-600",
        link: "https://www.sdar.com/blog"
    }
];

export default function NewsFeed() {
    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-sm font-semibold text-white">Market News</h3>
                </div>
                <div className="flex gap-1">
                    <span className="px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 rounded text-[9px] font-bold">RE</span>
                    <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-400 rounded text-[9px] font-bold">BIO</span>
                    <span className="px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded text-[9px] font-bold">TECH</span>
                </div>
            </div>

            {/* News Items */}
            <div className="divide-y divide-slate-700/30">
                {newsItems.map((item, index) => (
                    <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 hover:bg-slate-700/30 transition-colors"
                    >
                        <div className="flex items-start gap-2">
                            <span className={`px-1.5 py-0.5 ${item.color} text-white rounded text-[9px] font-bold shrink-0 mt-0.5`}>
                                {item.tag}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-300 leading-snug line-clamp-2 hover:text-white transition-colors">
                                    {item.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-500">{item.source}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-[10px] text-slate-500">{item.time}</span>
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
                <p className="text-[10px] text-slate-600 text-center">San Diego Market Intelligence</p>
            </div>
        </div>
    );
}
