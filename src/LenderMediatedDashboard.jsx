import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Home, Building2, DollarSign,
    BarChart3, Search, ArrowUpRight, ArrowDownRight, FileText,
    ChevronDown, ChevronUp, Package, Clock, Info, MapPin, Lightbulb, Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

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
const SummaryCard = ({ icon: Icon, title, value, change, subValue, subLabel, iconColor = 'text-blue-400' }) => (
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

// Comparison Table (Lender-Mediated vs Traditional vs Total)
const ComparisonTable = ({ title, data, valueFormatter = formatNumber, showShare = true }) => {
    if (!data || data.length === 0) return null;

    const headers = showShare
        ? ['', 'Lender-Mediated', 'Chg', 'Traditional', 'Chg', 'Total Market', 'Chg', 'LM Share']
        : ['', 'Lender-Mediated', 'Chg', 'Traditional', 'Chg', 'Total Market', 'Chg'];

    const rows = data.map(item => {
        const baseRow = [
            <span className="font-medium text-white">{item.type || item.range}</span>,
            valueFormatter(item.lender_mediated?.['2025']),
            <ChangeIndicator value={item.lender_mediated?.change} />,
            valueFormatter(item.traditional?.['2025']),
            <ChangeIndicator value={item.traditional?.change} />,
            valueFormatter(item.total_market?.['2025']),
            <ChangeIndicator value={item.total_market?.change} />
        ];

        if (showShare && item.share) {
            baseRow.push(
                <span className="text-amber-400 font-medium">{item.share['2025']?.toFixed(1)}%</span>
            );
        }

        return baseRow;
    });

    return <DataTable title={title} headers={headers} rows={rows} />;
};

// Inventory Comparison Table with 2024 and 2025 data (matching PDF format)
const InventoryComparisonTable = ({ title, subtitle, data, valueFormatter = formatNumber, showShare = true }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-808/60 border-b border-gray-700/50">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-800/40">
                            <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-left" rowSpan="2"></th>
                            <th className="px-3 py-2 text-xs font-medium text-amber-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">Lender-Mediated</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">Traditional</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">Total Market</th>
                            {showShare && <th className="px-3 py-2 text-xs font-medium text-purple-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="2">LM Share</th>}
                        </tr>
                        <tr className="bg-gray-800/30">
                            {/* Lender-Mediated */}
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                            {/* Traditional */}
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                            {/* Total Market */}
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                            <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                            {/* Share */}
                            {showShare && (
                                <>
                                    <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                                    <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {data.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-3 py-2 text-gray-300 font-medium whitespace-nowrap">
                                    {item.type || item.range}
                                </td>
                                {/* Lender-Mediated */}
                                <td className="px-2 py-2 text-right text-gray-400">{valueFormatter(item.lender_mediated?.['2024'])}</td>
                                <td className="px-2 py-2 text-right text-amber-400 font-medium">{valueFormatter(item.lender_mediated?.['2025'])}</td>
                                <td className="px-2 py-2 text-center"><ChangeIndicator value={item.lender_mediated?.change} className="pr-4" /></td>
                                {/* Traditional */}
                                <td className="px-2 py-2 text-right text-gray-400">{valueFormatter(item.traditional?.['2024'])}</td>
                                <td className="px-2 py-2 text-right text-gray-200">{valueFormatter(item.traditional?.['2025'])}</td>
                                <td className="px-2 py-2 text-center"><ChangeIndicator value={item.traditional?.change} className="pr-4" /></td>
                                {/* Total Market */}
                                <td className="px-2 py-2 text-right text-gray-400">{valueFormatter(item.total_market?.['2024'])}</td>
                                <td className="px-2 py-2 text-right text-gray-200">{valueFormatter(item.total_market?.['2025'])}</td>
                                <td className="px-2 py-2 text-center"><ChangeIndicator value={item.total_market?.change} className="pr-4" /></td>
                                {/* Share */}
                                {showShare && (
                                    <>
                                        <td className="px-2 py-2 text-right text-gray-400">{item.share?.['2024']?.toFixed(1)}%</td>
                                        <td className="px-2 py-2 text-right text-purple-400 font-medium">{item.share?.['2025']?.toFixed(1)}%</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Area Search Table
const AreaSearchTable = ({ data, title, type = 'inventory' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('zip_code');
    const [sortDirection, setSortDirection] = useState('asc');

    const filteredData = useMemo(() => {
        let filtered = data.filter(item =>
            item.zip_code?.includes(searchTerm) ||
            item.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        filtered.sort((a, b) => {
            let aVal, bVal;

            if (sortField === 'zip_code') {
                aVal = a.zip_code;
                bVal = b.zip_code;
            } else if (sortField === 'neighborhood') {
                aVal = a.neighborhood;
                bVal = b.neighborhood;
            } else if (type === 'inventory') {
                if (sortField === 'inv_total') {
                    aVal = a.inventory?.total_market || 0;
                    bVal = b.inventory?.total_market || 0;
                } else if (sortField === 'inv_share') {
                    aVal = a.inventory?.share || 0;
                    bVal = b.inventory?.share || 0;
                } else if (sortField === 'sales_total') {
                    aVal = a.closed_sales?.total_market || 0;
                    bVal = b.closed_sales?.total_market || 0;
                } else if (sortField === 'sales_share') {
                    aVal = a.closed_sales?.share || 0;
                    bVal = b.closed_sales?.share || 0;
                }
            } else if (type === 'price') {
                if (sortField === 'lm_price') {
                    aVal = a.lender_mediated?.['2025'] || 0;
                    bVal = b.lender_mediated?.['2025'] || 0;
                } else if (sortField === 'lm_change') {
                    aVal = a.lender_mediated?.change || 0;
                    bVal = b.lender_mediated?.change || 0;
                } else if (sortField === 'trad_price') {
                    aVal = a.traditional?.['2025'] || 0;
                    bVal = b.traditional?.['2025'] || 0;
                } else if (sortField === 'trad_change') {
                    aVal = a.traditional?.change || 0;
                    bVal = b.traditional?.change || 0;
                }
            }

            if (typeof aVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return filtered;
    }, [data, searchTerm, sortField, sortDirection, type]);

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortHeader = ({ field, children }) => (
        <th
            className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
            onClick={() => toggleSort(field)}
        >
            <div className="flex items-center gap-1 justify-end">
                {children}
                {sortField === field && (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
            </div>
        </th>
    );

    return (
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search zip or area..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 w-48"
                    />
                </div>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-800">
                        <tr>
                            <th
                                className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-left cursor-pointer hover:text-white"
                                onClick={() => toggleSort('zip_code')}
                            >
                                <div className="flex items-center gap-1">
                                    Zip Code
                                    {sortField === 'zip_code' && (
                                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-left cursor-pointer hover:text-white"
                                onClick={() => toggleSort('neighborhood')}
                            >
                                <div className="flex items-center gap-1">
                                    Area
                                    {sortField === 'neighborhood' && (
                                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    )}
                                </div>
                            </th>
                            {type === 'inventory' ? (
                                <>
                                    <SortHeader field="inv_total">Inventory</SortHeader>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">LM</th>
                                    <SortHeader field="inv_share">LM Share</SortHeader>
                                    <SortHeader field="sales_total">Closed Sales</SortHeader>
                                    <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">LM</th>
                                    <SortHeader field="sales_share">LM Share</SortHeader>
                                </>
                            ) : (
                                <>
                                    <SortHeader field="lm_price">LM Price</SortHeader>
                                    <SortHeader field="lm_change">Chg</SortHeader>
                                    <SortHeader field="trad_price">Traditional</SortHeader>
                                    <SortHeader field="trad_change">Chg</SortHeader>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {filteredData.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-3 py-2 text-blue-400 font-mono">{item.zip_code}</td>
                                <td className="px-3 py-2 text-gray-300">{item.neighborhood}</td>
                                {type === 'inventory' ? (
                                    <>
                                        <td className="px-3 py-2 text-right text-gray-200">{formatNumber(item.inventory?.total_market)}</td>
                                        <td className="px-3 py-2 text-right text-amber-400">{formatNumber(item.inventory?.lender_mediated)}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={item.inventory?.share > 10 ? 'text-red-400' : 'text-gray-400'}>
                                                {item.inventory?.share?.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-200">{formatNumber(item.closed_sales?.total_market)}</td>
                                        <td className="px-3 py-2 text-right text-amber-400">{formatNumber(item.closed_sales?.lender_mediated)}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={item.closed_sales?.share > 10 ? 'text-red-400' : 'text-gray-400'}>
                                                {item.closed_sales?.share?.toFixed(1)}%
                                            </span>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 py-2 text-right text-amber-400">{formatCurrency(item.lender_mediated?.['2025'])}</td>
                                        <td className="px-3 py-2 text-right"><ChangeIndicator value={item.lender_mediated?.change} /></td>
                                        <td className="px-3 py-2 text-right text-gray-200">{formatCurrency(item.traditional?.['2025'])}</td>
                                        <td className="px-3 py-2 text-right"><ChangeIndicator value={item.traditional?.change} /></td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-2 bg-gray-800/60 border-t border-gray-700/50 text-xs text-gray-500">
                Showing {filteredData.length} of {data.length} areas
            </div>
        </div>
    );
};

export default function LenderMediatedDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        fetch('/data/lender_mediated_data.json')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load data');
                return res.json();
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
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

    const summary = data?.summary || {};
    const inventory = data?.inventory || {};
    const activity = data?.activity || {};
    const priceDom = data?.price_dom || {};
    const areaInventory = data?.area_inventory_sales || [];
    const areaPrices = data?.area_median_prices || [];

    const tabs = [
        { id: 'summary', label: 'Summary', icon: BarChart3 },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'activity', label: 'Activity', icon: TrendingUp },
        { id: 'prices', label: 'Prices & DOM', icon: DollarSign },
        { id: 'areas', label: 'By Area', icon: Home }
    ];

    return (
        <div className="min-h-screen bg-gray-950 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-600/20 rounded-lg">
                                <FileText className="w-6 h-6 text-amber-400" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                Lender-Mediated Properties
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
                                    ? 'bg-amber-600 text-white'
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
                        {/* Inventory Trend Chart */}
                        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-bold text-white mb-6">Inventory of Lender-Mediated Properties in San Diego County</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={[
                                            { date: '04-2020', value: 220 },
                                            { date: '06-2020', value: 245 },
                                            { date: '08-2020', value: 325 },
                                            { date: '10-2020', value: 230 },
                                            { date: '12-2020', value: 185 },
                                            { date: '02-2021', value: 160 },
                                            { date: '04-2021', value: 135 },
                                            { date: '06-2021', value: 148 },
                                            { date: '08-2021', value: 140 },
                                            { date: '10-2021', value: 180 },
                                            { date: '12-2021', value: 155 },
                                            { date: '02-2022', value: 125 },
                                            { date: '04-2022', value: 160 },
                                            { date: '06-2022', value: 175 },
                                            { date: '08-2022', value: 230 },
                                            { date: '10-2022', value: 255 },
                                            { date: '12-2022', value: 220 },
                                            { date: '02-2023', value: 190 },
                                            { date: '04-2023', value: 150 },
                                            { date: '06-2023', value: 185 },
                                            { date: '08-2023', value: 190 },
                                            { date: '10-2023', value: 210 },
                                            { date: '12-2023', value: 225 },
                                            { date: '02-2024', value: 205 },
                                            { date: '04-2024', value: 190 },
                                            { date: '06-2024', value: 220 },
                                            { date: '08-2024', value: 275 },
                                            { date: '10-2024', value: 305 },
                                            { date: '12-2024', value: 220 },
                                            { date: '02-2025', value: 280 },
                                            { date: '04-2025', value: 310 },
                                            { date: '06-2025', value: 325 },
                                            { date: '08-2025', value: 348 },
                                            { date: '10-2025', value: 300 },
                                            { date: '12-2025', value: 145 },
                                        ]}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#94a3b8"
                                            tick={{ fill: '#94a3b8' }}
                                            axisLine={{ stroke: '#475569' }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            tick={{ fill: '#94a3b8' }}
                                            axisLine={{ stroke: '#475569' }}
                                            domain={[0, 400]}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #475569',
                                                borderRadius: '0.5rem',
                                                color: '#f8fafc'
                                            }}
                                            itemStyle={{ color: '#ef4444' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            name="Inventory"
                                            stroke="#ef4444"
                                            strokeWidth={3}
                                            dot={{ fill: '#ef4444', r: 4, strokeWidth: 0 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-500 mt-4 text-center italic">
                                Source: Data digitized from SDAR Lender-Mediated Report (2020-2025)
                            </p>
                        </div>

                        {/* Executive Summary Section */}
                        <div className="space-y-6">
                            {/* Header & Intro */}
                            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">AI Executive Summary: December 2025 Analysis</h3>
                                </div>
                                <p className="text-slate-300 leading-relaxed text-lg">
                                    The San Diego market for December 2025 shows a distinct <strong className="text-white">tightening of distressed inventory</strong>.
                                    While the general market saw significant decreases in new listings and sales, the lender-mediated segment saw even sharper declines in single-family inventory,
                                    though condo inventory surged. Prices for these "distressed" assets rose more aggressively (<span className="text-emerald-400">+8.1%</span>) than traditional homes,
                                    narrowing the discount gap.
                                </p>
                            </div>

                            {/* Analysis Grid */}
                            <div className="grid md:grid-cols-2 gap-6">

                                {/* 1. Inventory */}
                                <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/60 transition-colors">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-amber-400 mb-4">
                                        <Package className="w-5 h-5" />
                                        1. Inventory & Listings
                                    </h4>
                                    <p className="text-sm text-slate-400 mb-3">Supply shrinking for single-family, expanding for attached.</p>
                                    <ul className="space-y-3 text-sm text-slate-300">
                                        <li className="flex gap-2">
                                            <span className="text-red-400 font-bold min-w-[12px]">•</span>
                                            <span>
                                                <strong className="text-white">New Listings:</strong> Dropped <span className="text-red-400">68.2%</span> YoY to just 21 units.
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-red-400 font-bold min-w-[12px]">•</span>
                                            <span>
                                                <strong className="text-white">Single-Family:</strong> Plummeted <span className="text-red-400">45.9%</span> (111 to 60 units).
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-emerald-400 font-bold min-w-[12px]">•</span>
                                            <span>
                                                <strong className="text-white">Condos:</strong> Doubled (<span className="text-emerald-400">+100%</span>) from 73 to 146 units.
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-blue-400 font-bold min-w-[12px]">•</span>
                                            <span>
                                                <strong className="text-white">Market Share:</strong> Rose to 6.4% of total inventory (from 4.8%).
                                            </span>
                                        </li>
                                    </ul>
                                </div>

                                {/* 2. Sales & Pricing */}
                                <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/60 transition-colors">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-emerald-400 mb-4">
                                        <DollarSign className="w-5 h-5" />
                                        2. Sales & Pricing Dynamics
                                    </h4>
                                    <p className="text-sm text-slate-400 mb-3">Distressed assets are appreciating and selling fast.</p>
                                    <ul className="space-y-3 text-sm text-slate-300">
                                        <li className="flex gap-2">
                                            <span className="text-emerald-400 font-bold min-w-[12px]">•</span>
                                            <span>
                                                <strong className="text-white">Median Price:</strong> Lender-Mediated rose <span className="text-emerald-400">8.1%</span> to $848,600.
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-blue-400 font-bold min-w-[12px]">•</span>
                                            <span>
                                                <strong className="text-white">The Gap:</strong> Price gap vs traditional is only ~$55,400.
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-amber-400 font-bold min-w-[12px]">•</span>
                                            <span>
                                                <strong className="text-white">Low-End Activity:</strong> $250k & Below inventory doubled (+100%).
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-emerald-400 font-bold min-w-[12px]">•</span>
                                            <span>
                                                <strong className="text-white">Speed:</strong> DOM dropped to 48 days (-10.4%).
                                            </span>
                                        </li>
                                    </ul>
                                </div>

                                {/* 3. Geographic Hotspots */}
                                <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/60 transition-colors">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-blue-400 mb-4">
                                        <MapPin className="w-5 h-5" />
                                        3. Geographic Hotspots
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Highest Share (Dec 2025)</div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white">91942 (La Mesa)</span>
                                                    <span className="text-amber-400 font-mono">42.9%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white">91950 (National City)</span>
                                                    <span className="text-amber-400 font-mono">33.3%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white">92010 (Carlsbad NE)</span>
                                                    <span className="text-amber-400 font-mono">33.3%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-300">
                                            <strong className="text-emerald-400">Zero Inventory:</strong> La Jolla (92037), Rancho Santa Fe (92067), Carmel Valley (92130).
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Strategic Takeaways */}
                                <div className="bg-gradient-to-br from-purple-900/20 to-slate-800/40 rounded-xl border border-purple-500/30 p-6">
                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-purple-400 mb-4">
                                        <Lightbulb className="w-5 h-5" />
                                        4. Strategic Takeaways
                                    </h4>
                                    <ul className="space-y-4 text-sm text-slate-300">
                                        <li className="relative pl-4 border-l-2 border-purple-500/50">
                                            <strong className="block text-white mb-1">Condo Opportunities</strong>
                                            Investors may find more volume in the attached market (inventory +100%) than single-family.
                                        </li>
                                        <li className="relative pl-4 border-l-2 border-purple-500/50">
                                            <strong className="block text-white mb-1">Tight Luxury Market</strong>
                                            High-end "deals" have dried up ($1.25M+ inventory down 47%).
                                        </li>
                                        <li className="relative pl-4 border-l-2 border-purple-500/50">
                                            <strong className="block text-white mb-1">Pricing Power</strong>
                                            Lenders are pricing near market value (+8.1% increase) due to overall scarcity.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Methodology Note */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex gap-4 mt-8">
                            <div className="space-y-2 w-full">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Methodology</h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed text-justify">
                                    A property is considered to be "lender-mediated" when properties are those marked in the San Diego MLS with the following: Call Agent; Court Approval Required; Deed
                                    Restricted Program; Estate; HAP (Home Assistance Program); HUD (Housing and Urban Development); NOD Filed/Foreclosure Pending; Need Short Sale – No Lender
                                    Knowledge; Other/Remarks; Pre SS Pkg submitted to lenders(s), ready to consider offers; Probate Subject to Overbid; REO; Short Sale Approved. This list may be adjusted at
                                    any time. Residential activity only. Total Market is not necessarily a sum of traditional and lender-mediated activity, as some lender-mediated homes can be listed both as
                                    foreclosure and short sale.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        {/* Inventory by Property Type - Table */}
                        <InventoryComparisonTable
                            title="Inventory of Homes for Sale"
                            data={inventory.by_property_type}
                        />

                        {/* Lender-Mediated Inventory by Property Type - Bar Chart */}
                        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                                <h3 className="text-sm font-semibold text-white">Lender-Mediated Inventory by Property Type</h3>
                                <p className="text-xs text-gray-400 mt-1">December 2024 vs December 2025</p>
                            </div>
                            <div className="p-6">
                                <div className="flex items-end justify-around gap-8 h-48">
                                    {inventory.by_property_type?.map((item, i) => {
                                        const val2024 = item.lender_mediated?.['2024'] || 0;
                                        const val2025 = item.lender_mediated?.['2025'] || 0;
                                        const maxVal = Math.max(...inventory.by_property_type.map(x =>
                                            Math.max(x.lender_mediated?.['2024'] || 0, x.lender_mediated?.['2025'] || 0)
                                        ));
                                        const height2024 = maxVal > 0 ? (val2024 / maxVal) * 100 : 0;
                                        const height2025 = maxVal > 0 ? (val2025 / maxVal) * 100 : 0;
                                        const change = item.lender_mediated?.change;

                                        return (
                                            <div key={i} className="flex flex-col items-center flex-1">
                                                <div className="flex items-end gap-2 h-36">
                                                    {/* 2024 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-12">
                                                        <span className="text-xs text-gray-400 mb-1">{val2024}</span>
                                                        <div
                                                            className="w-full bg-gray-500 rounded-t transition-all"
                                                            style={{ height: `${height2024}%`, minHeight: val2024 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                    {/* 2025 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-12">
                                                        <span className="text-xs text-amber-400 mb-1">{val2025}</span>
                                                        <div
                                                            className="w-full bg-amber-500 rounded-t transition-all"
                                                            style={{ height: `${height2025}%`, minHeight: val2025 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Change Label */}
                                                <div className={`mt-2 text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {change >= 0 ? '+' : ''}{change?.toFixed(1)}%
                                                </div>
                                                {/* Category Label */}
                                                <div className="mt-1 text-xs text-gray-400 text-center max-w-24">
                                                    {item.type === 'Condos - Townhomes' ? 'Condos/Townhomes' : item.type}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Legend */}
                                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-500 rounded" />
                                        <span className="text-xs text-gray-400">12-2024</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-amber-500 rounded" />
                                        <span className="text-xs text-gray-400">12-2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory by Price Range - Table */}
                        <InventoryComparisonTable
                            title="Inventory by Price Range"
                            data={inventory.by_price_range}
                        />

                        {/* Lender-Mediated Inventory by Price Range - Bar Chart */}
                        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                                <h3 className="text-sm font-semibold text-white">Lender-Mediated Inventory by Price Range</h3>
                                <p className="text-xs text-gray-400 mt-1">December 2024 vs December 2025</p>
                            </div>
                            <div className="p-6">
                                <div className="flex items-end justify-around gap-4 h-48 overflow-x-auto">
                                    {inventory.by_price_range?.map((item, i) => {
                                        const val2024 = item.lender_mediated?.['2024'] || 0;
                                        const val2025 = item.lender_mediated?.['2025'] || 0;
                                        const maxVal = Math.max(...inventory.by_price_range.map(x =>
                                            Math.max(x.lender_mediated?.['2024'] || 0, x.lender_mediated?.['2025'] || 0)
                                        ));
                                        const height2024 = maxVal > 0 ? (val2024 / maxVal) * 100 : 0;
                                        const height2025 = maxVal > 0 ? (val2025 / maxVal) * 100 : 0;
                                        const change = item.lender_mediated?.change;

                                        // Shorten price range labels
                                        const shortLabel = item.range
                                            ?.replace(' and Below', '')
                                            .replace(/\$/g, '')
                                            .replace(/1,000,000/g, '1M')
                                            .replace(/1,000,001/g, '1M')
                                            .replace(/1,250,001/g, '1.25M')
                                            .replace(/1,250,000/g, '1.25M')
                                            .replace(/1,500,001/g, '1.5M')
                                            .replace(/1,500,000/g, '1.5M')
                                            .replace(/2,000,001/g, '2M')
                                            .replace(/2,000,000/g, '2M')
                                            .replace(/5,000,001/g, '5M')
                                            .replace(/5,000,000/g, '5M')
                                            .replace(/,000,000/g, 'M')
                                            .replace(/,000/g, 'K')
                                            .replace(/,001/g, 'K')
                                            .replace(/,250/g, 'K')
                                            .replace(' and Above', '+')
                                            .replace(' to ', '-')
                                            // Handle edge case where 250K became just 250K after 'and Below' removal
                                            .replace(/^250K$/, '0-250K');

                                        return (
                                            <div key={i} className="flex flex-col items-center flex-1 min-w-32">
                                                <div className="flex items-end gap-1 h-40">
                                                    {/* 2024 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-8">
                                                        <span className="text-[10px] text-gray-400 mb-1">{val2024}</span>
                                                        <div
                                                            className="w-full bg-gray-500 rounded-t transition-all"
                                                            style={{ height: `${height2024}%`, minHeight: val2024 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                    {/* 2025 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-8">
                                                        <span className="text-[10px] text-amber-400 mb-1">{val2025}</span>
                                                        <div
                                                            className="w-full bg-amber-500 rounded-t transition-all"
                                                            style={{ height: `${height2025}%`, minHeight: val2025 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Change Label */}
                                                <div className={`mt-2 text-[10px] font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {change >= 0 ? '+' : ''}{change?.toFixed(0)}%
                                                </div>
                                                {/* Price Range Label */}
                                                <div className="mt-1 text-xs text-gray-400 text-center whitespace-nowrap">
                                                    {shortLabel}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Legend */}
                                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-500 rounded" />
                                        <span className="text-xs text-gray-400">12-2024</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-amber-500 rounded" />
                                        <span className="text-xs text-gray-400">12-2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Methodology Note */}

                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <div className="space-y-6">
                        {/* Activity Comparison Table - New Listings & Closed Sales */}
                        {(activity.new_listings || activity.closed_sales) && (
                            <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-808/60 border-b border-gray-700/50">
                                    <h3 className="text-sm font-semibold text-white">New Listings and Closed Sales</h3>
                                    <p className="text-xs text-gray-400 mt-1">December 2024 vs December 2025</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-800/40">
                                                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-left" rowSpan="2"></th>
                                                <th className="px-3 py-2 text-xs font-medium text-amber-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">Lender-Mediated</th>
                                                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">Traditional</th>
                                                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="3">Total Market</th>
                                                <th className="px-3 py-2 text-xs font-medium text-purple-400 uppercase tracking-wider text-center border-b border-gray-700/30" colSpan="2">LM Share</th>
                                            </tr>
                                            <tr className="bg-gray-800/30">
                                                {/* Lender-Mediated */}
                                                <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                                                <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                                                <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                                                {/* Traditional */}
                                                <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                                                <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                                                <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                                                {/* Total Market */}
                                                <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                                                <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                                                <th className="px-2 py-2 text-xs text-gray-500 text-center">+/-</th>
                                                {/* Share */}
                                                <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2024</th>
                                                <th className="px-2 py-2 text-xs text-gray-500 text-right">12-2025</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {activity.new_listings && (
                                                <tr className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-3 py-2 text-gray-300 font-medium whitespace-nowrap">New Listings</td>
                                                    {/* Lender-Mediated */}
                                                    <td className="px-2 py-2 text-right text-gray-400">{formatNumber(activity.new_listings.lender_mediated?.['2024'])}</td>
                                                    <td className="px-2 py-2 text-right text-amber-400 font-medium">{formatNumber(activity.new_listings.lender_mediated?.['2025'])}</td>
                                                    <td className="px-2 py-2 text-center"><ChangeIndicator value={activity.new_listings.lender_mediated?.change} className="pr-4" /></td>
                                                    {/* Traditional */}
                                                    <td className="px-2 py-2 text-right text-gray-400">{formatNumber(activity.new_listings.traditional?.['2024'])}</td>
                                                    <td className="px-2 py-2 text-right text-gray-200">{formatNumber(activity.new_listings.traditional?.['2025'])}</td>
                                                    <td className="px-2 py-2 text-center"><ChangeIndicator value={activity.new_listings.traditional?.change} className="pr-4" /></td>
                                                    {/* Total Market */}
                                                    <td className="px-2 py-2 text-right text-gray-400">{formatNumber(activity.new_listings.total_market?.['2024'])}</td>
                                                    <td className="px-2 py-2 text-right text-gray-200">{formatNumber(activity.new_listings.total_market?.['2025'])}</td>
                                                    <td className="px-2 py-2 text-center"><ChangeIndicator value={activity.new_listings.total_market?.change} className="pr-4" /></td>
                                                    {/* Share */}
                                                    <td className="px-2 py-2 text-right text-gray-400">{activity.new_listings.share?.['2024']?.toFixed(1)}%</td>
                                                    <td className="px-2 py-2 text-right text-purple-400 font-medium">{activity.new_listings.share?.['2025']?.toFixed(1)}%</td>
                                                </tr>
                                            )}
                                            {activity.closed_sales && (
                                                <tr className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-3 py-2 text-gray-300 font-medium whitespace-nowrap">Closed Sales</td>
                                                    {/* Lender-Mediated */}
                                                    <td className="px-2 py-2 text-right text-gray-400">{formatNumber(activity.closed_sales.lender_mediated?.['2024'])}</td>
                                                    <td className="px-2 py-2 text-right text-amber-400 font-medium">{formatNumber(activity.closed_sales.lender_mediated?.['2025'])}</td>
                                                    <td className="px-2 py-2 text-center"><ChangeIndicator value={activity.closed_sales.lender_mediated?.change} className="pr-4" /></td>
                                                    {/* Traditional */}
                                                    <td className="px-2 py-2 text-right text-gray-400">{formatNumber(activity.closed_sales.traditional?.['2024'])}</td>
                                                    <td className="px-2 py-2 text-right text-gray-200">{formatNumber(activity.closed_sales.traditional?.['2025'])}</td>
                                                    <td className="px-2 py-2 text-center"><ChangeIndicator value={activity.closed_sales.traditional?.change} className="pr-4" /></td>
                                                    {/* Total Market */}
                                                    <td className="px-2 py-2 text-right text-gray-400">{formatNumber(activity.closed_sales.total_market?.['2024'])}</td>
                                                    <td className="px-2 py-2 text-right text-gray-200">{formatNumber(activity.closed_sales.total_market?.['2025'])}</td>
                                                    <td className="px-2 py-2 text-center"><ChangeIndicator value={activity.closed_sales.total_market?.change} className="pr-4" /></td>
                                                    {/* Share */}
                                                    <td className="px-2 py-2 text-right text-gray-400">{activity.closed_sales.share?.['2024']?.toFixed(1)}%</td>
                                                    <td className="px-2 py-2 text-right text-purple-400 font-medium">{activity.closed_sales.share?.['2025']?.toFixed(1)}%</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Lender-Mediated Activity Bar Chart */}
                        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                                <h3 className="text-sm font-semibold text-white">Lender-Mediated Activity Comparison</h3>
                                <p className="text-xs text-gray-400 mt-1">December 2024 vs December 2025</p>
                            </div>
                            <div className="p-6">
                                <div className="flex items-end justify-around gap-8 h-48">
                                    {/* New Listings Bar */}
                                    {activity.new_listings && (() => {
                                        const val2024 = activity.new_listings.lender_mediated?.['2024'] || 0;
                                        const val2025 = activity.new_listings.lender_mediated?.['2025'] || 0;
                                        const maxVal = Math.max(
                                            activity.new_listings.lender_mediated?.['2024'] || 0,
                                            activity.new_listings.lender_mediated?.['2025'] || 0,
                                            activity.closed_sales?.lender_mediated?.['2024'] || 0,
                                            activity.closed_sales?.lender_mediated?.['2025'] || 0
                                        );
                                        const height2024 = maxVal > 0 ? (val2024 / maxVal) * 100 : 0;
                                        const height2025 = maxVal > 0 ? (val2025 / maxVal) * 100 : 0;
                                        const change = activity.new_listings.lender_mediated?.change;

                                        return (
                                            <div className="flex flex-col items-center flex-1">
                                                <div className="flex items-end gap-2 h-36">
                                                    {/* 2024 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-12">
                                                        <span className="text-xs text-gray-400 mb-1">{val2024}</span>
                                                        <div
                                                            className="w-full bg-gray-500 rounded-t transition-all"
                                                            style={{ height: `${height2024}%`, minHeight: val2024 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                    {/* 2025 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-12">
                                                        <span className="text-xs text-amber-400 mb-1">{val2025}</span>
                                                        <div
                                                            className="w-full bg-amber-500 rounded-t transition-all"
                                                            style={{ height: `${height2025}%`, minHeight: val2025 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Change Label */}
                                                <div className={`mt-2 text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {change >= 0 ? '+' : ''}{change?.toFixed(1)}%
                                                </div>
                                                {/* Category Label */}
                                                <div className="mt-1 text-xs text-gray-400 text-center max-w-24">
                                                    New Listings
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Closed Sales Bar */}
                                    {activity.closed_sales && (() => {
                                        const val2024 = activity.closed_sales.lender_mediated?.['2024'] || 0;
                                        const val2025 = activity.closed_sales.lender_mediated?.['2025'] || 0;
                                        const maxVal = Math.max(
                                            activity.new_listings?.lender_mediated?.['2024'] || 0,
                                            activity.new_listings?.lender_mediated?.['2025'] || 0,
                                            activity.closed_sales?.lender_mediated?.['2024'] || 0,
                                            activity.closed_sales?.lender_mediated?.['2025'] || 0
                                        );
                                        const height2024 = maxVal > 0 ? (val2024 / maxVal) * 100 : 0;
                                        const height2025 = maxVal > 0 ? (val2025 / maxVal) * 100 : 0;
                                        const change = activity.closed_sales.lender_mediated?.change;

                                        return (
                                            <div className="flex flex-col items-center flex-1">
                                                <div className="flex items-end gap-2 h-36">
                                                    {/* 2024 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-12">
                                                        <span className="text-xs text-gray-400 mb-1">{val2024}</span>
                                                        <div
                                                            className="w-full bg-gray-500 rounded-t transition-all"
                                                            style={{ height: `${height2024}%`, minHeight: val2024 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                    {/* 2025 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-12">
                                                        <span className="text-xs text-amber-400 mb-1">{val2025}</span>
                                                        <div
                                                            className="w-full bg-amber-500 rounded-t transition-all"
                                                            style={{ height: `${height2025}%`, minHeight: val2025 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Change Label */}
                                                <div className={`mt-2 text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {change >= 0 ? '+' : ''}{change?.toFixed(1)}%
                                                </div>
                                                {/* Category Label */}
                                                <div className="mt-1 text-xs text-gray-400 text-center max-w-24">
                                                    Closed Sales
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                                {/* Legend */}
                                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-500 rounded" />
                                        <span className="text-xs text-gray-400">12-2024</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-amber-500 rounded" />
                                        <span className="text-xs text-gray-400">12-2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Graphs - New Listings and Closed Sales Trends */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* New Listings Trend */}
                            {activity.new_listings && (
                                <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                                        <h3 className="text-sm font-semibold text-white">New Listings Trend</h3>
                                        <p className="text-xs text-gray-400 mt-1">December 2024 to December 2025</p>
                                    </div>
                                    <div className="p-6">
                                        <div className="relative h-64">
                                            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                                                {/* Grid lines */}
                                                <line x1="0" y1="0" x2="0" y2="200" stroke="#374151" strokeWidth="1" />
                                                <line x1="0" y1="200" x2="400" y2="200" stroke="#374151" strokeWidth="1" />
                                                <line x1="0" y1="150" x2="400" y2="150" stroke="#374151" strokeWidth="0.5" opacity="0.3" strokeDasharray="4" />
                                                <line x1="0" y1="100" x2="400" y2="100" stroke="#374151" strokeWidth="0.5" opacity="0.3" strokeDasharray="4" />
                                                <line x1="0" y1="50" x2="400" y2="50" stroke="#374151" strokeWidth="0.5" opacity="0.3" strokeDasharray="4" />

                                                {(() => {
                                                    const maxVal = Math.max(
                                                        activity.new_listings.lender_mediated?.['2024'] || 0,
                                                        activity.new_listings.lender_mediated?.['2025'] || 0,
                                                        activity.new_listings.traditional?.['2024'] || 0,
                                                        activity.new_listings.traditional?.['2025'] || 0
                                                    );

                                                    // Calculate Y positions (inverted for SVG coordinates)
                                                    const lm2024Y = 190 - ((activity.new_listings.lender_mediated?.['2024'] || 0) / maxVal * 180);
                                                    const lm2025Y = 190 - ((activity.new_listings.lender_mediated?.['2025'] || 0) / maxVal * 180);
                                                    const trad2024Y = 190 - ((activity.new_listings.traditional?.['2024'] || 0) / maxVal * 180);
                                                    const trad2025Y = 190 - ((activity.new_listings.traditional?.['2025'] || 0) / maxVal * 180);

                                                    return (
                                                        <>{/* Traditional Line */}
                                                            <polyline
                                                                points={`50,${trad2024Y} 350,${trad2025Y}`}
                                                                fill="none"
                                                                stroke="#60A5FA"
                                                                strokeWidth="2"
                                                            />
                                                            <circle cx="50" cy={trad2024Y} r="4" fill="#60A5FA" />
                                                            <circle cx="350" cy={trad2025Y} r="4" fill="#60A5FA" />

                                                            {/* Lender-Mediated Line */}
                                                            <polyline
                                                                points={`50,${lm2024Y} 350,${lm2025Y}`}
                                                                fill="none"
                                                                stroke="#F59E0B"
                                                                strokeWidth="3"
                                                            />
                                                            <circle cx="50" cy={lm2024Y} r="5" fill="#F59E0B" />
                                                            <circle cx="350" cy={lm2025Y} r="5" fill="#F59E0B" />
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                            {/* X-axis labels */}
                                            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 text-xs text-gray-500">
                                                <span>Dec 2024</span>
                                                <span>Dec 2025</span>
                                            </div>
                                        </div>
                                        {/* Legend */}
                                        <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-700/50 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                                <span className="text-gray-400">Lender-Mediated</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                                <span className="text-gray-400">Traditional</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Closed Sales Trend */}
                            {activity.closed_sales && (
                                <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                                        <h3 className="text-sm font-semibold text-white">Closed Sales Trend</h3>
                                        <p className="text-xs text-gray-400 mt-1">December 2024 to December 2025</p>
                                    </div>
                                    <div className="p-6">
                                        <div className="relative h-64">
                                            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                                                {/* Grid lines */}
                                                <line x1="0" y1="0" x2="0" y2="200" stroke="#374151" strokeWidth="1" />
                                                <line x1="0" y1="200" x2="400" y2="200" stroke="#374151" strokeWidth="1" />
                                                <line x1="0" y1="150" x2="400" y2="150" stroke="#374151" strokeWidth="0.5" opacity="0.3" strokeDasharray="4" />
                                                <line x1="0" y1="100" x2="400" y2="100" stroke="#374151" strokeWidth="0.5" opacity="0.3" strokeDasharray="4" />
                                                <line x1="0" y1="50" x2="400" y2="50" stroke="#374151" strokeWidth="0.5" opacity="0.3" strokeDasharray="4" />

                                                {(() => {
                                                    const maxVal = Math.max(
                                                        activity.closed_sales.lender_mediated?.['2024'] || 0,
                                                        activity.closed_sales.lender_mediated?.['2025'] || 0,
                                                        activity.closed_sales.traditional?.['2024'] || 0,
                                                        activity.closed_sales.traditional?.['2025'] || 0,
                                                        activity.closed_sales.total_market?.['2024'] || 0,
                                                        activity.closed_sales.total_market?.['2025'] || 0
                                                    );

                                                    // Calculate Y positions (inverted for SVG coordinates)
                                                    const lm2024Y = 190 - ((activity.closed_sales.lender_mediated?.['2024'] || 0) / maxVal * 180);
                                                    const lm2025Y = 190 - ((activity.closed_sales.lender_mediated?.['2025'] || 0) / maxVal * 180);
                                                    const trad2024Y = 190 - ((activity.closed_sales.traditional?.['2024'] || 0) / maxVal * 180);
                                                    const trad2025Y = 190 - ((activity.closed_sales.traditional?.['2025'] || 0) / maxVal * 180);
                                                    const total2024Y = 190 - ((activity.closed_sales.total_market?.['2024'] || 0) / maxVal * 180);
                                                    const total2025Y = 190 - ((activity.closed_sales.total_market?.['2025'] || 0) / maxVal * 180);

                                                    return (
                                                        <>{/* Traditional Line */}
                                                            <polyline
                                                                points={`50,${trad2024Y} 350,${trad2025Y}`}
                                                                fill="none"
                                                                stroke="#60A5FA"
                                                                strokeWidth="2"
                                                            />
                                                            <circle cx="50" cy={trad2024Y} r="4" fill="#60A5FA" />
                                                            <circle cx="350" cy={trad2025Y} r="4" fill="#60A5FA" />

                                                            {/* Lender-Mediated Line */}
                                                            <polyline
                                                                points={`50,${lm2024Y} 350,${lm2025Y}`}
                                                                fill="none"
                                                                stroke="#F59E0B"
                                                                strokeWidth="3"
                                                            />
                                                            <circle cx="50" cy={lm2024Y} r="5" fill="#F59E0B" />
                                                            <circle cx="350" cy={lm2025Y} r="5" fill="#F59E0B" />
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                            {/* X-axis labels */}
                                            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 text-xs text-gray-500">
                                                <span>Dec 2024</span>
                                                <span>Dec 2025</span>
                                            </div>
                                        </div>
                                        {/* Legend */}
                                        <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-700/50 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                                <span className="text-gray-400">Lender-Mediated</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                                <span className="text-gray-400">Traditional</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Prices & DOM Tab */}
                {activeTab === 'prices' && (
                    <div className="space-y-6">
                        {/* Median Sales Price Table */}
                        <InventoryComparisonTable
                            title="Median Sales Price by Property Type"
                            subtitle="December 2024 vs December 2025"
                            data={priceDom.median_price}
                            valueFormatter={formatCurrency}
                            showShare={false}
                        />

                        {/* Median Sales Price Bar Chart by Property Type */}
                        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                                <h3 className="text-sm font-semibold text-white">Lender-Mediated Median Sales Price by Property Type</h3>
                                <p className="text-xs text-gray-400 mt-1">December 2024 vs December 2025</p>
                            </div>
                            <div className="p-6">
                                <div className="flex items-end justify-around gap-8 h-64">
                                    {priceDom.median_price?.map((item, i) => {
                                        const val2024 = item.lender_mediated?.['2024'] || 0;
                                        const val2025 = item.lender_mediated?.['2025'] || 0;
                                        const maxVal = Math.max(...priceDom.median_price.map(x =>
                                            Math.max(x.lender_mediated?.['2024'] || 0, x.lender_mediated?.['2025'] || 0)
                                        ));
                                        const height2024 = maxVal > 0 ? (val2024 / maxVal) * 100 : 0;
                                        const height2025 = maxVal > 0 ? (val2025 / maxVal) * 100 : 0;
                                        const change = item.lender_mediated?.change;

                                        return (
                                            <div key={i} className="flex flex-col items-center flex-1">
                                                <div className="flex items-end gap-2 h-48">
                                                    {/* 2024 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-16">
                                                        <span className="text-[10px] text-gray-400 mb-1">{formatCurrency(val2024)}</span>
                                                        <div
                                                            className="w-full bg-gray-500 rounded-t transition-all"
                                                            style={{ height: `${height2024}%`, minHeight: val2024 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                    {/* 2025 Bar */}
                                                    <div className="flex flex-col items-center h-full justify-end w-16">
                                                        <span className="text-[10px] text-amber-400 mb-1">{formatCurrency(val2025)}</span>
                                                        <div
                                                            className="w-full bg-amber-500 rounded-t transition-all"
                                                            style={{ height: `${height2025}%`, minHeight: val2025 > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Change Label */}
                                                <div className={`mt-2 text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {change >= 0 ? '+' : ''}{change?.toFixed(1)}%
                                                </div>
                                                {/* Category Label */}
                                                <div className="mt-1 text-xs text-gray-400 text-center max-w-28">
                                                    {item.type === 'Condos - Townhomes' ? 'Condos/Townhomes' : item.type}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Legend */}
                                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-500 rounded" />
                                        <span className="text-xs text-gray-400">12-2024</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-amber-500 rounded" />
                                        <span className="text-xs text-gray-400">12-2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Days on Market Table */}
                        {priceDom.days_on_market && priceDom.days_on_market.length > 0 && (
                            <>
                                <InventoryComparisonTable
                                    title="Days on Market Until Sale by Property Type"
                                    subtitle="December 2024 vs December 2025"
                                    data={priceDom.days_on_market}
                                    showShare={false}
                                />

                                {/* Days on Market Bar Chart by Property Type */}
                                <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700/50">
                                        <h3 className="text-sm font-semibold text-white">Lender-Mediated Days on Market by Property Type</h3>
                                        <p className="text-xs text-gray-400 mt-1">December 2024 vs December 2025</p>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-end justify-around gap-8 h-64">
                                            {priceDom.days_on_market?.map((item, i) => {
                                                const val2024 = item.lender_mediated?.['2024'] || 0;
                                                const val2025 = item.lender_mediated?.['2025'] || 0;
                                                const maxVal = Math.max(...priceDom.days_on_market.map(x =>
                                                    Math.max(x.lender_mediated?.['2024'] || 0, x.lender_mediated?.['2025'] || 0)
                                                ));
                                                const height2024 = maxVal > 0 ? (val2024 / maxVal) * 100 : 0;
                                                const height2025 = maxVal > 0 ? (val2025 / maxVal) * 100 : 0;
                                                const change = item.lender_mediated?.change;

                                                return (
                                                    <div key={i} className="flex flex-col items-center flex-1">
                                                        <div className="flex items-end gap-2 h-48">
                                                            {/* 2024 Bar */}
                                                            <div className="flex flex-col items-center h-full justify-end w-16">
                                                                <span className="text-xs text-gray-400 mb-1">{val2024} days</span>
                                                                <div
                                                                    className="w-full bg-gray-500 rounded-t transition-all"
                                                                    style={{ height: `${height2024}%`, minHeight: val2024 > 0 ? '4px' : '0' }}
                                                                />
                                                            </div>
                                                            {/* 2025 Bar */}
                                                            <div className="flex flex-col items-center h-full justify-end w-16">
                                                                <span className="text-xs text-amber-400 mb-1">{val2025} days</span>
                                                                <div
                                                                    className="w-full bg-amber-500 rounded-t transition-all"
                                                                    style={{ height: `${height2025}%`, minHeight: val2025 > 0 ? '4px' : '0' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Change Label */}
                                                        <div className={`mt-2 text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {change >= 0 ? '+' : ''}{change?.toFixed(1)}%
                                                        </div>
                                                        {/* Category Label */}
                                                        <div className="mt-1 text-xs text-gray-400 text-center max-w-28">
                                                            {item.type === 'Condos - Townhomes' ? 'Condos/Townhomes' : item.type}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Legend */}
                                        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-gray-500 rounded" />
                                                <span className="text-xs text-gray-400">12-2024</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-amber-500 rounded" />
                                                <span className="text-xs text-gray-400">12-2025</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Areas Tab */}
                {activeTab === 'areas' && (
                    <div className="space-y-6">
                        <AreaSearchTable
                            data={areaInventory}
                            title="Inventory & Closed Sales by Area"
                            type="inventory"
                        />
                        <AreaSearchTable
                            data={areaPrices}
                            title="Median Sales Price by Area (YTD)"
                            type="price"
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-800">
                    Current as of January 5, 2026. All data from the San Diego MLS. | Report © 2026 ShowingTime Plus, LLC.
                </div>
            </div>
        </div >
    );
}
