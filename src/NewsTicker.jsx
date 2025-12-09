import { useState, useEffect } from 'react';
import Marquee from 'react-fast-marquee';

// RSS Feed sources with tags
const RSS_FEEDS = [
    { url: 'https://timesofsandiego.com/category/life-sciences/feed/', tag: 'BIO', color: 'bg-blue-600' },
    { url: 'https://sdbn.org/feed/', tag: 'BIO', color: 'bg-blue-600' },
    { url: 'https://timesofsandiego.com/category/tech/feed/', tag: 'TECH', color: 'bg-purple-600' },
    { url: 'https://voiceofsandiego.org/category/topics/housing-development/feed/', tag: 'RE', color: 'bg-emerald-600' },
    { url: 'https://timesofsandiego.com/category/business/feed/', tag: 'BIZ', color: 'bg-amber-600' },
];

// Parse RSS XML to extract items
function parseRSS(xml, tag, color) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = doc.querySelectorAll('item');

    return Array.from(items).map(item => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';

        return {
            title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
            link,
            pubDate: new Date(pubDate),
            tag,
            color
        };
    });
}

// Format relative time
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NewsTicker() {
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchFeeds() {
            try {
                // Use a CORS proxy to fetch RSS feeds
                const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

                const feedPromises = RSS_FEEDS.map(async ({ url, tag, color }) => {
                    try {
                        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
                        if (!response.ok) return [];
                        const xml = await response.text();
                        return parseRSS(xml, tag, color);
                    } catch {
                        return [];
                    }
                });

                const results = await Promise.all(feedPromises);
                const allItems = results.flat();

                // Sort by date (newest first) and take top 20
                const sorted = allItems
                    .sort((a, b) => b.pubDate - a.pubDate)
                    .slice(0, 20);

                setNewsItems(sorted);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchFeeds();

        // Refresh every 10 minutes
        const interval = setInterval(fetchFeeds, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-gray-950 border-b border-gray-800 py-2">
                <div className="flex items-center justify-center gap-2 text-gray-500 font-mono text-xs">
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                    Loading San Diego news feeds...
                </div>
            </div>
        );
    }

    if (error || newsItems.length === 0) {
        return (
            <div className="bg-gray-950 border-b border-gray-800 py-2">
                <div className="flex items-center justify-center gap-3 text-gray-500 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded text-[10px] font-bold">FEED</span>
                    <span>San Diego market intelligence • Updating...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-950 border-b border-gray-800">
            {/* Header bar */}
            <div className="flex items-center gap-2 px-4 py-1 border-b border-gray-800/50 bg-gray-900/50">
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Live</span>
                </div>
                <span className="text-[10px] font-mono text-gray-600">|</span>
                <span className="text-[10px] font-mono text-gray-500">San Diego Market Intelligence</span>
                <div className="flex-1"></div>
                <div className="flex gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-400 rounded text-[9px] font-bold">BIO</span>
                    <span className="px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded text-[9px] font-bold">TECH</span>
                    <span className="px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 rounded text-[9px] font-bold">RE</span>
                    <span className="px-1.5 py-0.5 bg-amber-900/50 text-amber-400 rounded text-[9px] font-bold">BIZ</span>
                </div>
            </div>

            {/* Marquee ticker */}
            <Marquee
                pauseOnHover={true}
                speed={40}
                gradient={true}
                gradientColor="#030712"
                gradientWidth={50}
                className="py-2"
            >
                {newsItems.map((item, index) => (
                    <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mx-4 group"
                    >
                        <span className={`px-1.5 py-0.5 ${item.color} text-white rounded text-[10px] font-bold uppercase`}>
                            {item.tag}
                        </span>
                        <span className="font-mono text-xs text-gray-300 group-hover:text-white transition-colors max-w-md truncate">
                            {item.title}
                        </span>
                        <span className="font-mono text-[10px] text-gray-600">
                            {timeAgo(item.pubDate)}
                        </span>
                        <span className="text-gray-700 mx-2">•</span>
                    </a>
                ))}
            </Marquee>
        </div>
    );
}
