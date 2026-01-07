import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Home, Building2, DollarSign,
    BarChart3, Search, ArrowUpRight, ArrowDownRight, FileText,
    ChevronDown, ChevronUp, Package, Clock, Info, Warehouse, Lightbulb
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

// Format utilities
const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
};

const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

// Change indicator component
const ChangeIndicator = ({ value, inverted = false, className = '' }) => {
    if (value === null || value === undefined) return <span className="text-gray-400">--</span>;

    const isPositive = inverted ? value < 0 : value >= 0;
    const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400';
    const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;

    return (
        <span className={`flex items-center gap-1 ${colorClass} ${className}`}>
            <Icon className="w-3 h-3" />
            {formatPercent(value)}
        </span>
    );
};

// Summary Card Component
const SummaryCard = ({ icon: Icon, title, value, change, subValue, subLabel, iconColor = 'text-green-400' }) => (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-start justify-between mb-2">
            <div className={`p-2 rounded-lg bg-gray-700/50 ${iconColor}`}>
                <Icon className="w-5 h-5" />
            </div>
            <ChangeIndicator value={change} />
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-gray-400">{title}</div>
        {subValue && (
            <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-500">
                {subLabel}: <span className="text-gray-300">{subValue}</span>
            </div>
        )}
    </div>
);

// Data Table Component
const DataTable = ({ title, headers, rows, columnAligns = [] }) => (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-800/40">
                        {headers.map((header, i) => (
                            <th
                                key={i}
                                className={`px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider ${columnAligns[i] || (i === 0 ? 'text-left' : 'text-right')
                                    }`}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                    {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                            {row.map((cell, j) => (
                                <td
                                    key={j}
                                    className={`px-4 py-3 whitespace-nowrap ${columnAligns[j] || (j === 0 ? 'text-left text-gray-300' : 'text-right text-gray-200')
                                        }`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// Supply Comparison Table (All Properties, Single-Family, Condos)
const SupplyComparisonTable = ({ title, subtitle, data, valueFormatter = formatNumber }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-800/40">
                            <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-left" rowSpan="2"></th>
                            <th className="px-3 py-2 text-xs font-medium text-green-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">All Properties</th>
                            <th className="px-3 py-2 text-xs font-medium text-blue-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">Single-Family</th>
                            <th className="px-3 py-2 text-xs font-medium text-purple-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">Condos</th>
                        </tr>
                        <tr className="bg-gray-800/30">
                            {/* All Properties */}
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                            {/* Single-Family */}
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                            {/* Condos */}
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {data.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-3 py-2 text-gray-300 font-medium whitespace-nowrap">
                                    {item.category}
                                </td>
                                {/* All Properties */}
                                <td className="px-2 py-2 text-right text-gray-400">{valueFormatter(item.all_properties?.['2024'])}</td>
                                <td className="px-2 py-2 text-right text-green-400 font-medium">{valueFormatter(item.all_properties?.['2025'])}</td>
                                <td className="px-2 py-2 text-center"><ChangeIndicator value={item.all_properties?.change} className="justify-center" /></td>
                                {/* Single-Family */}
                                <td className="px-2 py-2 text-right text-gray-400">{valueFormatter(item.single_family?.['2024'])}</td>
                                <td className="px-2 py-2 text-right text-blue-400 font-medium">{valueFormatter(item.single_family?.['2025'])}</td>
                                <td className="px-2 py-2 text-center"><ChangeIndicator value={item.single_family?.change} className="justify-center" /></td>
                                {/* Condos */}
                                <td className="px-2 py-2 text-right text-gray-400">{valueFormatter(item.condos?.['2024'])}</td>
                                <td className="px-2 py-2 text-right text-purple-400 font-medium">{valueFormatter(item.condos?.['2025'])}</td>
                                <td className="px-2 py-2 text-center"><ChangeIndicator value={item.condos?.change} className="justify-center" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Bar Chart Component for supply data
const SupplyBarChart = ({ title, data, dataKey = 'all_properties' }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map(item => ({
        name: item.category.replace('$', '').replace(',000', 'K').replace(',001', 'K').replace(' and Below', '-').replace(' and Above', '+'),
        '2024': item[dataKey]?.['2024'] || 0,
        '2025': item[dataKey]?.['2025'] || 0,
        change: item[dataKey]?.change || 0
    }));

    return (
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            <div className="p-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                        <RechartsTooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #475569',
                                borderRadius: '0.5rem',
                                color: '#f8fafc'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="2024" fill="#6b7280" name="12-2024" />
                        <Bar dataKey="2025" fill="#22c55e" name="12-2025" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const FREDTrendChart = ({ data, title, subTitle }) => {
    if (!data || data.length === 0) return null;

    // Format dates for display (e.g., "2024-01-01" -> "Jan 24")
    const formattedData = data.map(item => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }));

    return (
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    {title}
                </h3>
                {subTitle && <div className="text-sm text-slate-400 mt-1">{subTitle}</div>}
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            tickLine={false}
                            axisLine={false}
                        />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                            itemStyle={{ color: '#818cf8' }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                            formatter={(value) => [formatNumber(value), 'Active Listings']}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#818cf8"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: '#818cf8', stroke: '#c7d2fe', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default function SupplyDashboard() {
    const [data, setData] = useState(null);
    const [fredData, setFredData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [supplyRes, fredRes] = await Promise.all([
                    fetch('/data/housing_supply_data.json'),
                    fetch('/data/supply_history.json')
                ]);

                if (!supplyRes.ok) throw new Error('Failed to load supply data');
                // Fred data is optional, don't fail hard if missing, but try to parse
                const supplyJson = await supplyRes.json();

                let fredJson = null;
                if (fredRes.ok) {
                    fredJson = await fredRes.json();
                }

                setData(supplyJson);
                setFredData(fredJson);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-red-400 bg-red-900/20 px-6 py-4 rounded-lg border border-red-500/30">
                    Error: {error}
                </div>
            </div>
        );
    }

    const pendingSales = data?.pending_sales || {};
    const closedSales = data?.closed_sales || {};
    const inventory = data?.inventory || {};
    const monthsSupply = data?.months_supply?.by_price_range || [];
    const medianPrice = data?.median_price?.by_sq_footage || [];
    const daysOnMarket = data?.days_on_market || {};
    const pctListPrice = data?.pct_list_price?.by_price_range || [];

    // Calculate totals for summary cards
    const totalPendingSales2025 = (pendingSales.by_price_range || []).reduce((sum, item) => sum + (item.all_properties?.['2025'] || 0), 0);
    const totalClosedSales2025 = (closedSales.by_price_range || []).reduce((sum, item) => sum + (item.all_properties?.['2025'] || 0), 0);
    const totalInventory2025 = (inventory.by_price_range || []).reduce((sum, item) => sum + (item.all_properties?.['2025'] || 0), 0);

    // Get months supply for mid-range
    const avgMonthsSupply = monthsSupply.find(m => m.category === '$750,001 to $1,000,000')?.all_properties?.['2025'] || 0;

    const tabs = [
        { id: 'summary', label: 'Summary', icon: BarChart3 },
        { id: 'pending', label: 'Pending', icon: TrendingUp },
        { id: 'closed', label: 'Closed', icon: Home },
        { id: 'median', label: 'Square Footage', icon: DollarSign },
        { id: 'pctlist', label: 'List %', icon: BarChart3 },
        { id: 'dom', label: 'DOM', icon: Clock },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'months', label: 'Months', icon: Clock }
    ];

    return (
        <div className="min-h-screen bg-gray-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-600/20 rounded-lg">
                                <Warehouse className="w-6 h-6 text-green-400" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                Housing Supply Overview
                            </h1>
                        </div>
                        <p className="text-gray-400 text-sm">
                            {data?.meta?.report_period} • Source: {data?.meta?.source}
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-green-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                    <div className="space-y-6">
                        {/* FRED Trend Chart */}
                        {fredData && fredData.history && (
                            <FREDTrendChart
                                data={fredData.history}
                                title="Historical Active Listings"
                                subTitle="San Diego County, CA - Last 10 Years"
                            />
                        )}

                        {/* Executive Summary Header */}
                        <div className="bg-gradient-to-r from-indigo-900/40 to-slate-800/40 rounded-xl border border-indigo-500/30 p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <FileText className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Executive Summary: The "Gridlock" Market</h3>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-lg">
                                The San Diego housing market is currently defined by a <strong className="text-indigo-400">massive supply shortage</strong> that has created a gridlock.
                                While inventory has collapsed by over <span className="text-rose-400 font-bold">50%</span>, prices have remained effectively flat
                                (<span className="text-emerald-400">+0.3%</span>). This indicates that while few homeowners are selling, buyer demand has also tempered
                                enough to prevent a price explosion. For a realtor, the key narrative is <strong className="text-amber-400">scarcity</strong>:
                                there is almost nothing to buy, but the homes that are available are taking longer to sell.
                            </p>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* 1. Inventory & Supply Crisis */}
                            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/60 transition-colors">
                                <h4 className="flex items-center gap-2 text-lg font-semibold text-rose-400 mb-4">
                                    <Package className="w-5 h-5" />
                                    1. Inventory & Supply Crisis
                                </h4>
                                <p className="text-sm text-slate-400 mb-3">The most critical data point: dramatic contraction in available homes.</p>
                                <ul className="space-y-3 text-sm text-slate-300">
                                    <li className="flex gap-2">
                                        <span className="text-rose-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Total Inventory:</strong> Dropped <span className="text-rose-400 font-bold">50.6%</span> YoY.
                                            Only 1,876 active listings vs 3,794 last year.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-rose-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Single-Family:</strong> Fell <span className="text-rose-400">54.7%</span> to just 1,027 units,
                                            resulting in <span className="text-amber-400 font-bold">0.8 months</span> of supply.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-rose-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Condo Supply:</strong> Dropped <span className="text-rose-400">44.5%</span>,
                                            leaving <span className="text-amber-400">1.3 months</span> of supply.
                                        </span>
                                    </li>
                                </ul>
                                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs text-slate-400">
                                    <strong className="text-slate-300">Context:</strong> A balanced market is 4–6 months of supply. At 0.8–1.3 months,
                                    San Diego is in "hyper-seller's market" territory regarding supply, yet price behavior suggests otherwise.
                                </div>
                            </div>

                            {/* 2. Pricing Stability */}
                            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/60 transition-colors">
                                <h4 className="flex items-center gap-2 text-lg font-semibold text-emerald-400 mb-4">
                                    <DollarSign className="w-5 h-5" />
                                    2. Pricing Stability
                                </h4>
                                <p className="text-sm text-slate-400 mb-3">Despite the inventory squeeze, prices are not skyrocketing—suggesting an affordability ceiling.</p>
                                <ul className="space-y-3 text-sm text-slate-300">
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Overall Median:</strong> Rose nominally by <span className="text-emerald-400">+0.3%</span> to
                                            <span className="text-white font-bold"> $900,000</span>.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-gray-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Single-Family:</strong> Completely flat at <span className="text-white font-bold">$1,050,500</span>
                                            (<span className="text-gray-400">0.0%</span> change).
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-rose-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Condos:</strong> Slightly down, dropping <span className="text-rose-400">0.7%</span> to
                                            <span className="text-white font-bold"> $670,000</span>.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-amber-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Negotiation Power:</strong> Pct of List Price fell from 99.0% to
                                            <span className="text-amber-400 font-bold"> 97.7%</span>. Buyers are pushing back.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {/* 3. Sales Velocity & Volume */}
                            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/60 transition-colors">
                                <h4 className="flex items-center gap-2 text-lg font-semibold text-blue-400 mb-4">
                                    <Clock className="w-5 h-5" />
                                    3. Sales Velocity & Volume
                                </h4>
                                <p className="text-sm text-slate-400 mb-3">The market is moving slower and transacting less volume than the previous year.</p>
                                <ul className="space-y-3 text-sm text-slate-300">
                                    <li className="flex gap-2">
                                        <span className="text-rose-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Closed Sales:</strong> Overall volume decreased <span className="text-rose-400">1.9%</span>.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-rose-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Days on Market:</strong> Increased <span className="text-rose-400 font-bold">21.9%</span>,
                                            jumping from 32 days to <span className="text-white font-bold">39 days</span>.
                                        </span>
                                    </li>
                                </ul>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Fastest Sellers ($1.25M–$2M):</span>
                                        <span className="text-emerald-400 font-mono">37 days</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Slowest Sellers ($5M+):</span>
                                        <span className="text-rose-400 font-mono">74 days</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Luxury & High-End Anomaly */}
                            <div className="bg-gradient-to-br from-purple-900/20 to-slate-800/40 rounded-xl border border-purple-500/30 p-6">
                                <h4 className="flex items-center gap-2 text-lg font-semibold text-purple-400 mb-4">
                                    <TrendingUp className="w-5 h-5" />
                                    4. The Luxury & High-End Anomaly
                                </h4>
                                <p className="text-sm text-slate-400 mb-3">The $5M+ market is behaving differently than the general market.</p>
                                <ul className="space-y-3 text-sm text-slate-300">
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Sales Surge:</strong> Pending Sales for $5M+ rose <span className="text-emerald-400">+5.6%</span>,
                                            Closed Sales jumped <span className="text-emerald-400 font-bold">+15.8%</span>.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Price Strength:</strong> Large homes (6,001+ Sq Ft) surged
                                            <span className="text-emerald-400 font-bold"> +9.9%</span> to <span className="text-white font-bold">$6,100,000</span>.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-rose-400 font-bold min-w-[12px]">•</span>
                                        <span>
                                            <strong className="text-white">Inventory:</strong> Even in this bracket, inventory fell
                                            <span className="text-rose-400"> 27.4%</span>—scarcity affects all demographics.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* 5. Strategic Takeaways */}
                        <div className="bg-gradient-to-r from-amber-900/20 to-slate-800/40 rounded-xl border border-amber-500/30 p-6">
                            <h4 className="flex items-center gap-2 text-lg font-semibold text-amber-400 mb-4">
                                <Lightbulb className="w-5 h-5" />
                                5. Strategic Takeaways
                            </h4>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-amber-400 uppercase tracking-wider mb-2 font-bold">The "Inventory Cliff"</div>
                                    <div className="text-2xl font-bold text-white mb-1">3,794 → 1,876</div>
                                    <div className="text-sm text-slate-400">
                                        "It's not you, it's the market. Options are down <span className="text-rose-400 font-bold">50%</span>."
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-blue-400 uppercase tracking-wider mb-2 font-bold">The "Patience Index"</div>
                                    <div className="text-2xl font-bold text-white mb-1">32 → 39 days</div>
                                    <div className="text-sm text-slate-400">
                                        DOM up <span className="text-rose-400 font-bold">+21.9%</span>. Despite scarcity, sales aren't instant.
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-emerald-400 uppercase tracking-wider mb-2 font-bold">The "Affordability Ceiling"</div>
                                    <div className="text-2xl font-bold text-white mb-1">97.7%</div>
                                    <div className="text-sm text-slate-400">
                                        List price received down <span className="text-rose-400">1.3%</span>. Overpricing is dangerous.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Charts */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <SupplyBarChart title="Inventory by Price Range" data={inventory.by_price_range || []} />
                            <SupplyBarChart title="Pending Sales by Price Range" data={pendingSales.by_price_range || []} />
                        </div>

                        {/* Methodology */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 mt-8">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Source</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                Data from the San Diego MLS via the Greater San Diego Association of REALTORS®.
                                All figures are based on rolling 12-month calculations except inventory which reflects end-of-month active listings.
                                Current as of January 5, 2026.
                            </p>
                        </div>
                    </div>
                )}

                {/* Pending Sales Tab */}
                {activeTab === 'pending' && (
                    <div className="space-y-6">
                        <SupplyComparisonTable
                            title="Pending Sales by Price Range"
                            subtitle="Rolling 12-month count of accepted offers"
                            data={pendingSales.by_price_range || []}
                        />
                        <SupplyBarChart title="Pending Sales by Price Range" data={pendingSales.by_price_range || []} />

                        {pendingSales.by_sq_footage && pendingSales.by_sq_footage.length > 0 && (
                            <>
                                <SupplyComparisonTable
                                    title="Pending Sales by Square Footage"
                                    subtitle="Rolling 12-month count"
                                    data={pendingSales.by_sq_footage}
                                />
                                <SupplyBarChart title="Pending Sales by Square Footage" data={pendingSales.by_sq_footage} />
                            </>
                        )}
                    </div>
                )}

                {/* Closed Sales Tab */}
                {activeTab === 'closed' && (
                    <div className="space-y-6">
                        <SupplyComparisonTable
                            title="Closed Sales by Price Range"
                            subtitle="Rolling 12-month count of actual closed sales"
                            data={closedSales.by_price_range || []}
                        />
                        <SupplyBarChart title="Closed Sales by Price Range" data={closedSales.by_price_range || []} />

                        {closedSales.by_sq_footage && closedSales.by_sq_footage.length > 0 && (
                            <>
                                <SupplyComparisonTable
                                    title="Closed Sales by Square Footage"
                                    subtitle="Rolling 12-month count"
                                    data={closedSales.by_sq_footage}
                                />
                                <SupplyBarChart title="Closed Sales by Square Footage" data={closedSales.by_sq_footage} />
                            </>
                        )}
                    </div>
                )}

                {/* Median Sales Price Tab */}
                {activeTab === 'median' && (
                    <div className="space-y-6">
                        <SupplyComparisonTable
                            title="Median Sales Price by Square Footage"
                            subtitle="Rolling 12-month median"
                            data={medianPrice}
                            valueFormatter={formatCurrency}
                        />
                        <SupplyBarChart title="Median Sales Price by Square Footage" data={medianPrice} />
                    </div>
                )}

                {/* Percent of List Price Tab */}
                {activeTab === 'pctlist' && (
                    <div className="space-y-6">
                        <SupplyComparisonTable
                            title="Percent of Original List Price Received"
                            subtitle="Average sale price / original list price by price range"
                            data={pctListPrice}
                            valueFormatter={(v) => v !== null && v !== undefined ? `${v.toFixed(1)}%` : 'N/A'}
                        />
                        <SupplyBarChart title="Pct of List Price by Price Range" data={pctListPrice} />
                    </div>
                )}

                {/* Days on Market Tab */}
                {activeTab === 'dom' && (
                    <div className="space-y-6">
                        <SupplyComparisonTable
                            title="Days on Market by Price Range"
                            subtitle="Average days from listing to accepted offer"
                            data={daysOnMarket.by_price_range || []}
                        />
                        <SupplyBarChart title="Days on Market by Price Range" data={daysOnMarket.by_price_range || []} />

                        {daysOnMarket.by_sq_footage && daysOnMarket.by_sq_footage.length > 0 && (
                            <>
                                <SupplyComparisonTable
                                    title="Days on Market by Square Footage"
                                    subtitle="Average days from listing to accepted offer"
                                    data={daysOnMarket.by_sq_footage}
                                />
                                <SupplyBarChart title="Days on Market by Square Footage" data={daysOnMarket.by_sq_footage} />
                            </>
                        )}
                    </div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        <SupplyComparisonTable
                            title="Inventory by Price Range"
                            subtitle="Active listings at end of month"
                            data={inventory.by_price_range || []}
                        />
                        <SupplyBarChart title="Inventory by Price Range" data={inventory.by_price_range || []} />

                        {inventory.by_sq_footage && inventory.by_sq_footage.length > 0 && (
                            <>
                                <SupplyComparisonTable
                                    title="Inventory by Square Footage"
                                    subtitle="Active listings at end of month"
                                    data={inventory.by_sq_footage}
                                />
                                <SupplyBarChart title="Inventory by Square Footage" data={inventory.by_sq_footage} />
                            </>
                        )}
                    </div>
                )}

                {/* Months Supply Tab */}
                {activeTab === 'months' && (
                    <div className="space-y-6">
                        <SupplyComparisonTable
                            title="Months Supply of Inventory"
                            subtitle="Inventory divided by average monthly pending sales"
                            data={monthsSupply}
                            valueFormatter={(v) => v !== null && v !== undefined ? `${v.toFixed(1)}` : 'N/A'}
                        />
                        <SupplyBarChart title="Months Supply by Price Range" data={monthsSupply} />
                    </div>
                )}
            </div>
        </div>
    );
}
