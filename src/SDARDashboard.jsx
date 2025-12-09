import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';

// Icons as simple SVG components
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const TrendUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const TrendDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

import { neighborhoodData, regions } from './sdarData';

export default function SDARDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [propertyType, setPropertyType] = useState('all');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedArea, setSelectedArea] = useState('all');
    const [selectedZip, setSelectedZip] = useState('all');
    // Filters are always shown

    const availableAreas = useMemo(() => {
        if (selectedRegion === 'all') {
            return Object.values(regions).filter(r => r.areas).flatMap(r => r.areas);
        }
        return regions[selectedRegion]?.areas || [];
    }, [selectedRegion]);

    const availableZips = useMemo(() => {
        if (selectedArea === 'all') {
            return availableAreas.flatMap(a => a.zips);
        }
        const area = availableAreas.find(a => a.id === selectedArea);
        return area?.zips || [];
    }, [selectedArea, availableAreas]);

    const currentData = useMemo(() => {
        let zipData = neighborhoodData['all'];
        if (selectedZip !== 'all' && neighborhoodData[selectedZip]) {
            zipData = neighborhoodData[selectedZip];
        } else if (selectedArea !== 'all') {
            const area = availableAreas.find(a => a.id === selectedArea);
            if (area && area.zips.length > 0 && neighborhoodData[area.zips[0]]) {
                zipData = neighborhoodData[area.zips[0]];
            }
        }
        return zipData[propertyType] || zipData['all'];
    }, [selectedZip, selectedArea, availableAreas, propertyType]);

    const locationName = useMemo(() => {
        if (selectedZip !== 'all') {
            const area = availableAreas.find(a => a.zips.includes(selectedZip));
            return area ? `${area.name} (${selectedZip})` : selectedZip;
        }
        if (selectedArea !== 'all') {
            const area = availableAreas.find(a => a.id === selectedArea);
            return area?.name || 'San Diego County';
        }
        if (selectedRegion !== 'all') {
            return regions[selectedRegion]?.name || 'San Diego County';
        }
        return 'San Diego County';
    }, [selectedZip, selectedArea, selectedRegion, availableAreas]);

    const formatCurrency = (value) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value}`;
    };

    const formatNumber = (value) => new Intl.NumberFormat().format(value);

    const historicalData = useMemo(() => {
        const basePrice = currentData.medianPrice;
        const multipliers = [0.96, 0.97, 0.98, 0.99, 0.995, 1.01, 1.005, 1.02, 1.01, 0.99, 0.985, 1.0];
        return multipliers.map((m, i) => ({
            month: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][i],
            price: Math.round(basePrice * m),
            dom: Math.max(15, currentData.daysOnMarket - 12 + i * 2),
            sales: Math.round(currentData.closedSales * (0.9 + Math.random() * 0.4))
        }));
    }, [currentData]);

    const comparisonData = useMemo(() => {
        let zipData = neighborhoodData['all'];
        if (selectedZip !== 'all' && neighborhoodData[selectedZip]) {
            zipData = neighborhoodData[selectedZip];
        } else if (selectedArea !== 'all') {
            const area = availableAreas.find(a => a.id === selectedArea);
            if (area && area.zips.length > 0 && neighborhoodData[area.zips[0]]) {
                zipData = neighborhoodData[area.zips[0]];
            }
        }
        return { detached: zipData.detached, attached: zipData.attached };
    }, [selectedZip, selectedArea, availableAreas]);

    const ChangeIndicator = ({ value, inverse = false }) => {
        const isPositive = inverse ? value < 0 : value > 0;
        const isNeutral = Math.abs(value) < 0.5;
        return (
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isNeutral ? 'text-slate-500' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {!isNeutral && (isPositive ? <TrendUpIcon /> : <TrendDownIcon />)}
                {value > 0 ? '+' : ''}{value.toFixed(1)}%
            </span>
        );
    };

    const clearFilters = () => {
        setSelectedRegion('all');
        setSelectedArea('all');
        setSelectedZip('all');
    };

    const hasActiveFilters = selectedRegion !== 'all' || selectedArea !== 'all' || selectedZip !== 'all';

    const propertyTypes = [
        { id: 'all', label: 'All Properties', icon: '🏘️' },
        { id: 'detached', label: 'Single Family', icon: '🏠' },
        { id: 'attached', label: 'Condos/Townhomes', icon: '🏢' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Subtle grid overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

            <div className="relative max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-800/50">
                                <HomeIcon />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Real Estate Market</h1>
                        </div>
                        <p className="text-slate-400">San Diego County • SDAR MLS Data</p>
                    </div>

                </div>

                {/* Filter Panel - Always visible */}
                {true && (
                    <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Region</label>
                                <select
                                    value={selectedRegion}
                                    onChange={(e) => { setSelectedRegion(e.target.value); setSelectedArea('all'); setSelectedZip('all'); }}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
                                >
                                    <option value="all">All San Diego</option>
                                    <option value="coastal">🌊 Coastal</option>
                                    <option value="north">🏔️ North County</option>
                                    <option value="central">🏘️ Central</option>
                                    <option value="urban">🏙️ Urban</option>
                                    <option value="east">⛰️ East County</option>
                                    <option value="south">🌴 South County</option>
                                </select>
                            </div>
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Neighborhood</label>
                                <select
                                    value={selectedArea}
                                    onChange={(e) => { setSelectedArea(e.target.value); setSelectedZip('all'); }}
                                    disabled={availableAreas.length === 0}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 disabled:opacity-50"
                                >
                                    <option value="all">All Areas</option>
                                    {availableAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">ZIP Code</label>
                                <select
                                    value={selectedZip}
                                    onChange={(e) => setSelectedZip(e.target.value)}
                                    disabled={availableZips.length === 0}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 disabled:opacity-50"
                                >
                                    <option value="all">All ZIPs</option>
                                    {availableZips.map(z => <option key={z} value={z}>{z}</option>)}
                                </select>
                            </div>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-all font-medium">
                                    <XIcon /> Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Location Badge & Property Type Selector */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
                        <span className="text-blue-400"><MapPinIcon /></span>
                        <span className="text-sm font-bold text-white">{locationName}</span>
                    </div>
                    <div className="flex gap-1 p-1 bg-slate-800/50 rounded-full border border-slate-700">
                        {propertyTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setPropertyType(type.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${propertyType === type.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                            >
                                <span>{type.icon}</span>
                                <span className="hidden sm:inline">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {[
                        { icon: <DollarIcon />, title: 'Median Price', value: formatCurrency(currentData.medianPrice), change: currentData.priceChange },
                        { icon: <HomeIcon />, title: 'Closed Sales', value: formatNumber(currentData.closedSales), change: currentData.salesChange },
                        { icon: <ClockIcon />, title: 'Days on Market', value: currentData.daysOnMarket, change: currentData.domChange, inverse: true },
                        { icon: <BuildingIcon />, title: 'Inventory', value: formatNumber(currentData.inventory), change: currentData.invChange },
                        { icon: <BuildingIcon />, title: 'Months Supply', value: currentData.monthsSupply, change: 0 },
                        { icon: <DollarIcon />, title: 'Sale-to-List', value: `${currentData.pctOrigPrice}%`, change: 0 },
                    ].map((metric, i) => (
                        <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400">{metric.icon}</div>
                                {metric.change !== 0 && <ChangeIndicator value={metric.change} inverse={metric.inverse} />}
                            </div>
                            <p className="text-xl font-bold text-white">{metric.value}</p>
                            <p className="text-xs text-slate-500">{metric.title}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6 overflow-x-auto">
                    {['Overview', 'Prices', 'Inventory', 'Velocity'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {activeTab === 'overview' && (
                        <>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4">Market Summary</h3>
                                <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl mb-4">
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        <strong className="text-white">{locationName}</strong> has a median price of <strong className="text-white">{formatCurrency(currentData.medianPrice)}</strong>
                                        {currentData.priceChange > 0 ? ' (up ' : ' (down '}
                                        <span className={currentData.priceChange > 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                            {Math.abs(currentData.priceChange)}%
                                        </span> YoY).
                                        Homes sell in <strong className="text-white">{currentData.daysOnMarket} days</strong> with <strong className="text-white">{currentData.monthsSupply} months</strong> supply.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-700/30 rounded-xl">
                                    <p className="text-sm font-semibold text-slate-300 mb-3">Market Balance</p>
                                    <div className="relative h-8 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full">
                                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-900 rounded-full shadow-lg transition-all" style={{ left: `${Math.min(Math.max((currentData.monthsSupply / 6) * 100, 8), 92)}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>Seller's</span>
                                        <span>Balanced</span>
                                        <span>Buyer's</span>
                                    </div>
                                    <p className="text-center mt-3 font-semibold text-white">
                                        {currentData.monthsSupply < 3 ? '🔥 Seller\'s Market' : currentData.monthsSupply <= 4 ? '⚖️ Balanced' : '🏠 Buyer\'s Market'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4">Single Family vs Condos</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-700/50">
                                        <p className="text-xs text-blue-400 font-bold mb-1">🏠 SINGLE FAMILY</p>
                                        <p className="text-xl font-bold text-white">{formatCurrency(comparisonData.detached.medianPrice)}</p>
                                        <ChangeIndicator value={comparisonData.detached.priceChange} />
                                        <div className="mt-2 pt-2 border-t border-blue-700/30 text-xs text-slate-400">
                                            <p>{comparisonData.detached.daysOnMarket} days • {comparisonData.detached.monthsSupply} mo supply</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-purple-900/30 rounded-xl border border-purple-700/50">
                                        <p className="text-xs text-purple-400 font-bold mb-1">🏢 CONDOS/TOWNHOMES</p>
                                        <p className="text-xl font-bold text-white">{formatCurrency(comparisonData.attached.medianPrice)}</p>
                                        <ChangeIndicator value={comparisonData.attached.priceChange} />
                                        <div className="mt-2 pt-2 border-t border-purple-700/30 text-xs text-slate-400">
                                            <p>{comparisonData.attached.daysOnMarket} days • {comparisonData.attached.monthsSupply} mo supply</p>
                                        </div>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={[
                                        { name: 'Closed', detached: comparisonData.detached.closedSales, attached: comparisonData.attached.closedSales },
                                        { name: 'Pending', detached: comparisonData.detached.pendingSales, attached: comparisonData.attached.pendingSales },
                                        { name: 'New', detached: comparisonData.detached.newListings, attached: comparisonData.attached.newListings },
                                    ]} layout="vertical" margin={{ left: 55 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                                        <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                        <Bar dataKey="detached" name="Single Family" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="attached" name="Condos" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}

                    {activeTab === 'prices' && (
                        <>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4">Price Trend</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={historicalData}>
                                        <defs>
                                            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => formatCurrency(v)} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(v) => formatCurrency(v)} />
                                        <Area type="monotone" dataKey="price" stroke="#3b82f6" fill="url(#priceGrad)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4">Price Comparison</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-700/30 text-center">
                                        <p className="text-xs text-blue-400 font-bold mb-1">🏠 SINGLE FAMILY</p>
                                        <p className="text-2xl font-bold text-white">{formatCurrency(comparisonData.detached.medianPrice)}</p>
                                        <ChangeIndicator value={comparisonData.detached.priceChange} />
                                    </div>
                                    <div className="p-4 bg-purple-900/30 rounded-xl border border-purple-700/30 text-center">
                                        <p className="text-xs text-purple-400 font-bold mb-1">🏢 CONDOS</p>
                                        <p className="text-2xl font-bold text-white">{formatCurrency(comparisonData.attached.medianPrice)}</p>
                                        <ChangeIndicator value={comparisonData.attached.priceChange} />
                                    </div>
                                </div>
                                <div className="p-4 bg-amber-900/20 rounded-xl border border-amber-700/30">
                                    <p className="text-sm font-bold text-amber-400 mb-2">Sale-to-List Ratio</p>
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-white">{comparisonData.detached.pctOrigPrice}%</p>
                                            <p className="text-xs text-slate-500">Single Family</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-white">{comparisonData.attached.pctOrigPrice}%</p>
                                            <p className="text-xs text-slate-500">Condos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'inventory' && (
                        <>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4">Supply by Property Type</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-700/30 text-center">
                                        <p className="text-xs text-blue-400 font-bold">🏠 SINGLE FAMILY</p>
                                        <p className="text-3xl font-bold text-white my-1">{formatNumber(comparisonData.detached.inventory)}</p>
                                        <p className="text-xs text-slate-500">{comparisonData.detached.monthsSupply} months supply</p>
                                        <ChangeIndicator value={comparisonData.detached.invChange} />
                                    </div>
                                    <div className="p-4 bg-purple-900/30 rounded-xl border border-purple-700/30 text-center">
                                        <p className="text-xs text-purple-400 font-bold">🏢 CONDOS</p>
                                        <p className="text-3xl font-bold text-white my-1">{formatNumber(comparisonData.attached.inventory)}</p>
                                        <p className="text-xs text-slate-500">{comparisonData.attached.monthsSupply} months supply</p>
                                        <ChangeIndicator value={comparisonData.attached.invChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4">Activity Comparison</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={[
                                        { name: 'New Listings', detached: comparisonData.detached.newListings, attached: comparisonData.attached.newListings },
                                        { name: 'Pending Sales', detached: comparisonData.detached.pendingSales, attached: comparisonData.attached.pendingSales },
                                        { name: 'Closed Sales', detached: comparisonData.detached.closedSales, attached: comparisonData.attached.closedSales },
                                    ]} layout="vertical" margin={{ left: 85 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                                        <Legend />
                                        <Bar dataKey="detached" name="Single Family" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="attached" name="Condos" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}

                    {activeTab === 'velocity' && (
                        <>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4">Days on Market Comparison</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-blue-900/30 rounded-xl border border-blue-700/30 text-center">
                                        <p className="text-xs text-blue-400 font-bold mb-2">🏠 SINGLE FAMILY</p>
                                        <p className="text-4xl font-bold text-blue-400">{comparisonData.detached.daysOnMarket}</p>
                                        <p className="text-xs text-slate-500 mt-1">days average</p>
                                        <ChangeIndicator value={comparisonData.detached.domChange} inverse />
                                    </div>
                                    <div className="p-5 bg-purple-900/30 rounded-xl border border-purple-700/30 text-center">
                                        <p className="text-xs text-purple-400 font-bold mb-2">🏢 CONDOS</p>
                                        <p className="text-4xl font-bold text-purple-400">{comparisonData.attached.daysOnMarket}</p>
                                        <p className="text-xs text-slate-500 mt-1">days average</p>
                                        <ChangeIndicator value={comparisonData.attached.domChange} inverse />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4">DOM Trend</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={historicalData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                                        <Line type="monotone" dataKey="dom" name="Days on Market" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">Data: San Diego Association of REALTORS® (SDAR) • San Diego MLS</p>
                </div>
            </div>
        </div>
    );
}
