import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Clock, TrendingUp, Home, Building2, Calendar, FileText } from 'lucide-react';

export default function HistoricalTrendsDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState('detached');
  const [activeMetric, setActiveMetric] = useState('medianPrice');
  const [timeRange, setTimeRange] = useState('all'); // 'all', '5yr', '3yr', '1yr'

  useEffect(() => {
    fetch('/data/historical_indicators.json')
      .then(res => res.json())
      .then(json => {
        // filter out any entries that might not have data yet properly parsed
        const validData = json.filter(d => d.detached && d.detached.medianPrice);
        setData(validData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load historical data:", err);
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    let result = [...data];
    if (timeRange !== 'all') {
      const currentYear = new Date().getFullYear();
      let startYear;
      if (timeRange === '5yr') startYear = currentYear - 5;
      if (timeRange === '3yr') startYear = currentYear - 3;
      if (timeRange === '1yr') startYear = currentYear - 1;
      
      result = result.filter(d => d.year >= startYear);
    }
    
    // Transform specifically for the chart to easily access the selected property type
    return result.map(d => ({
      ...d,
      displayDate: `${d.monthName.substring(0,3)} '${d.year.toString().substring(2)}`,
      value: d[propertyType]?.[activeMetric] || 0
    }));
  }, [data, propertyType, activeMetric, timeRange]);

  const metrics = [
    { id: 'medianPrice', label: 'Median Price', prefix: '$', suffix: '' },
    { id: 'inventory', label: 'Inventory (Homes for Sale)', prefix: '', suffix: '' },
    { id: 'monthsSupply', label: 'Months Supply', prefix: '', suffix: ' mo' },
    { id: 'closedSales', label: 'Closed Sales', prefix: '', suffix: '' },
    { id: 'newListings', label: 'New Listings', prefix: '', suffix: '' },
    { id: 'daysOnMarket', label: 'Days on Market', prefix: '', suffix: ' days' }
  ];

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const formatNumber = (value) => new Intl.NumberFormat().format(value);

  const getAxisFormatter = () => {
    if (activeMetric === 'medianPrice') return formatCurrency;
    return formatNumber;
  };

  const getTooltipFormatter = (value) => {
    const metric = metrics.find(m => m.id === activeMetric);
    if (activeMetric === 'medianPrice') return [formatCurrency(value), selectedMetricLabel];
    return [`${metric.prefix}${formatNumber(value)}${metric.suffix}`, selectedMetricLabel];
  };

  const selectedMetricLabel = metrics.find(m => m.id === activeMetric)?.label || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading historical data...</p>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p className="text-slate-400">No historical data available.</p>
      </div>
    );
  }

  // Calculate high-level stats for the selected metric and property type over the full data
  const currentValue = data[data.length - 1][propertyType]?.[activeMetric] || 0;
  const historicLow = Math.min(...data.map(d => d[propertyType]?.[activeMetric] || Infinity));
  const historicHigh = Math.max(...data.map(d => d[propertyType]?.[activeMetric] || -Infinity));

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
                <Clock className="w-6 h-6 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Historical Trends</h1>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full">2017 - Present</span>
            </div>
            <p className="text-slate-400">Long-term analysis of San Diego County real estate metrics.</p>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Property Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Property Type</label>
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={() => setPropertyType('detached')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    propertyType === 'detached' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Home className="w-4 h-4" /> Single Family
                </button>
                <button
                  onClick={() => setPropertyType('attached')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    propertyType === 'attached' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Condos
                </button>
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Time Horizon</label>
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                {[
                  { id: '1yr', label: '1Y' },
                  { id: '3yr', label: '3Y' },
                  { id: '5yr', label: '5Y' },
                  { id: 'all', label: 'Max' }
                ].map(tr => (
                  <button
                    key={tr.id}
                    onClick={() => setTimeRange(tr.id)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                      timeRange === tr.id ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Analysis Metric</label>
              <select
                value={activeMetric}
                onChange={(e) => setActiveMetric(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {metrics.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <p className="text-sm text-slate-400 mb-1">Current Value (Latest)</p>
            <p className="text-3xl font-bold text-white">
              {activeMetric === 'medianPrice' ? formatCurrency(currentValue) : formatNumber(currentValue)}
              <span className="text-sm font-normal text-slate-500 ml-1">{metrics.find(m => m.id === activeMetric)?.suffix}</span>
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <p className="text-sm text-slate-400 mb-1">Historical High</p>
            <p className="text-3xl font-bold text-emerald-400">
              {activeMetric === 'medianPrice' ? formatCurrency(historicHigh) : formatNumber(historicHigh)}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <p className="text-sm text-slate-400 mb-1">Historical Low</p>
            <p className="text-3xl font-bold text-rose-400">
              {activeMetric === 'medianPrice' ? formatCurrency(historicLow) : formatNumber(historicLow)}
            </p>
          </div>
        </div>

        {/* The Main Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              {selectedMetricLabel} Trend
            </h3>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-md text-xs font-medium border border-slate-700">
              {filteredData.length} Data Points
            </span>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeMetric === 'medianPrice' ? (
                <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={propertyType === 'detached' ? '#3b82f6' : '#8b5cf6'} stopOpacity={0.5}/>
                      <stop offset="95%" stopColor={propertyType === 'detached' ? '#3b82f6' : '#8b5cf6'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    tickMargin={10} 
                    minTickGap={30} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={getAxisFormatter()} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    domain={['dataMin * 0.9', 'auto']}
                  />
                  <Tooltip 
                    formatter={getTooltipFormatter}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={propertyType === 'detached' ? '#3b82f6' : '#8b5cf6'} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              ) : (
                <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    tickMargin={10} 
                    minTickGap={30} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={getAxisFormatter()} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={getTooltipFormatter}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={propertyType === 'detached' ? '#3b82f6' : '#8b5cf6'} 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: propertyType === 'detached' ? '#3b82f6' : '#8b5cf6', stroke: '#0f172a', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight Card */}
        <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/20 border border-indigo-800/50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-900/50 rounded-xl mt-1">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Historical Context</h4>
              <p className="text-slate-300 leading-relaxed text-sm">
                This dashboard visualizes data extracted directly from San Diego Association of REALTORS® (SDAR) Monthly Indicator reports. 
                By selecting "Max" time horizon, you can observe macroeconomic real estate trends over nearly a decade, including the impacts of the 2020-2022 market boom and subsequent shifts in inventory and days on market.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
