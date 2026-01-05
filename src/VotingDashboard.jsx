import { useState, useEffect, useMemo } from 'react';
import { Vote, TrendingUp, TrendingDown, Users, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Colors for political parties
const COLORS = {
    Democrat: '#3B82F6',  // Blue
    Republican: '#EF4444', // Red
    Other: '#6B7280',      // Gray
};

const CANDIDATE_PARTIES = {
    // 2024
    'Harris': 'Democrat',
    'Trump': 'Republican',
    'Kennedy': 'Other',
    'Stein': 'Other',
    'Oliver': 'Other',
    'De la Cruz': 'Other',
    // 2020
    'Biden': 'Democrat',
    'Jorgensen': 'Other',
    'Hawkins': 'Other',
    'De La Fuente': 'Other',
    'La Riva': 'Other',
};

function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
}

// Summary card component
function StatCard({ label, value, subtext, color = 'blue' }) {
    const colorClasses = {
        blue: 'from-blue-600/20 to-blue-800/20 border-blue-500/30',
        red: 'from-red-600/20 to-red-800/20 border-red-500/30',
        gray: 'from-gray-600/20 to-gray-800/20 border-gray-500/30',
    };

    return (
        <div className={`p-4 rounded-xl border bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm`}>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {subtext && <div className="text-sm text-gray-400 mt-1">{subtext}</div>}
        </div>
    );
}

// Candidate bar component
function CandidateBar({ name, votes, percentage, party }) {
    const color = COLORS[party] || COLORS.Other;

    return (
        <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-white">{name}</span>
                <span className="text-sm text-gray-400">{formatNumber(votes)} ({percentage}%)</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

// Year comparison chart
function ComparisonChart({ data2020, data2024 }) {
    const chartData = [
        {
            name: 'Democrat',
            '2020': data2020?.candidates?.Biden?.percentage || 0,
            '2024': data2024?.candidates?.Harris?.percentage || 0,
        },
        {
            name: 'Republican',
            '2020': data2020?.candidates?.Trump?.percentage || 0,
            '2024': data2024?.candidates?.Trump?.percentage || 0,
        },
    ];

    const demChange = chartData[0]['2024'] - chartData[0]['2020'];
    const repChange = chartData[1]['2024'] - chartData[1]['2020'];

    return (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-4">2020 vs 2024 Comparison</h3>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" barGap={4}>
                        <XAxis type="number" domain={[0, 70]} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} width={80} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="2020" fill="#6B7280" name="2020" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="2024" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={index === 0 ? COLORS.Democrat : COLORS.Republican} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-4 text-sm">
                <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                        {demChange < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <TrendingUp className="w-4 h-4 text-green-400" />}
                        <span className={demChange < 0 ? 'text-red-400' : 'text-green-400'}>
                            {demChange > 0 ? '+' : ''}{demChange.toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-gray-500">Democrat</div>
                </div>
                <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                        {repChange > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                        <span className={repChange > 0 ? 'text-green-400' : 'text-red-400'}>
                            {repChange > 0 ? '+' : ''}{repChange.toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-gray-500">Republican</div>
                </div>
            </div>
        </div>
    );
}

// City results table
function CityResults({ cities, selectedYear }) {
    const [sortBy, setSortBy] = useState('total_votes');
    const [sortDir, setSortDir] = useState('desc');

    const sortedCities = useMemo(() => {
        if (!cities) return [];
        return Object.entries(cities)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => {
                if (sortDir === 'desc') return b[sortBy] - a[sortBy];
                return a[sortBy] - b[sortBy];
            })
            .slice(0, 15);  // Top 15 cities
    }, [cities, sortBy, sortDir]);

    return (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-4">Results by City ({selectedYear})</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-2 px-2 text-gray-400 font-medium">City</th>
                            <th className="text-right py-2 px-2 text-gray-400 font-medium">Total Votes</th>
                            <th className="text-right py-2 px-2 text-blue-400 font-medium">Dem %</th>
                            <th className="text-right py-2 px-2 text-red-400 font-medium">Rep %</th>
                            <th className="text-center py-2 px-2 text-gray-400 font-medium">Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCities.map((city) => {
                            const demCandidate = selectedYear === '2024' ? 'Harris' : 'Biden';
                            const demPct = city.candidates?.[demCandidate]?.percentage || 0;
                            const repPct = city.candidates?.Trump?.percentage || 0;
                            const winner = demPct > repPct ? 'D' : 'R';

                            return (
                                <tr key={city.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                    <td className="py-2 px-2 text-white">{city.name}</td>
                                    <td className="py-2 px-2 text-right text-gray-300">{formatNumber(city.total_votes)}</td>
                                    <td className="py-2 px-2 text-right text-blue-400">{demPct.toFixed(1)}%</td>
                                    <td className="py-2 px-2 text-right text-red-400">{repPct.toFixed(1)}%</td>
                                    <td className="py-2 px-2 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${winner === 'D' ? 'bg-blue-600' : 'bg-red-600'}`}>
                                            {winner}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function VotingDashboard() {
    const [votingData, setVotingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2024');
    const [selectedCity, setSelectedCity] = useState('all');

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/data/voting_data.json');
                if (!response.ok) throw new Error('Failed to load voting data');
                const data = await response.json();
                setVotingData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const currentData = votingData?.elections?.[selectedYear];
    const cityList = useMemo(() => {
        if (!currentData?.by_city) return [];
        return ['all', ...Object.keys(currentData.by_city).sort()];
    }, [currentData]);

    const displayData = useMemo(() => {
        if (!currentData) return null;
        if (selectedCity === 'all') return currentData;
        return currentData.by_city?.[selectedCity] || currentData;
    }, [currentData, selectedCity]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-red-400 text-center">
                    <p>Error loading voting data</p>
                    <p className="text-sm text-gray-500 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    const demCandidate = selectedYear === '2024' ? 'Harris' : 'Biden';
    const demVotes = displayData?.candidates?.[demCandidate]?.votes || 0;
    const demPct = displayData?.candidates?.[demCandidate]?.percentage || 0;
    const repVotes = displayData?.candidates?.Trump?.votes || 0;
    const repPct = displayData?.candidates?.Trump?.percentage || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Grid overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-800/50">
                            <Vote className="w-5 h-5 text-purple-400" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold">Presidential Voting</h1>
                    </div>
                    <p className="text-sm text-slate-400">San Diego County • 2020 & 2024 Election Results</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    {/* Year selector */}
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        {['2020', '2024'].map((year) => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedYear === year
                                        ? 'bg-purple-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>

                    {/* City dropdown */}
                    <div className="relative">
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="appearance-none bg-gray-800 text-gray-200 text-sm rounded-lg px-4 py-2 pr-10 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                            <option value="all">All Cities</option>
                            {cityList.filter(c => c !== 'all').map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        label={demCandidate}
                        value={`${demPct.toFixed(1)}%`}
                        subtext={`${formatNumber(demVotes)} votes`}
                        color="blue"
                    />
                    <StatCard
                        label="Trump"
                        value={`${repPct.toFixed(1)}%`}
                        subtext={`${formatNumber(repVotes)} votes`}
                        color="red"
                    />
                    <StatCard
                        label="Total Votes"
                        value={formatNumber(displayData?.total_votes || 0)}
                        subtext={selectedCity === 'all' ? 'County-wide' : selectedCity}
                        color="gray"
                    />
                    <StatCard
                        label="Margin"
                        value={`${(demPct - repPct).toFixed(1)}%`}
                        subtext={demPct > repPct ? 'Democratic' : 'Republican'}
                        color={demPct > repPct ? 'blue' : 'red'}
                    />
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left: Candidate Results */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <h3 className="text-sm font-semibold text-white mb-4">
                            {selectedYear} Results {selectedCity !== 'all' && `- ${selectedCity}`}
                        </h3>
                        {displayData?.candidates && Object.entries(displayData.candidates).map(([name, data]) => (
                            <CandidateBar
                                key={name}
                                name={name}
                                votes={data.votes}
                                percentage={data.percentage}
                                party={CANDIDATE_PARTIES[name] || 'Other'}
                            />
                        ))}
                    </div>

                    {/* Right: Comparison Chart */}
                    <ComparisonChart
                        data2020={votingData?.elections?.['2020']}
                        data2024={votingData?.elections?.['2024']}
                    />
                </div>

                {/* City Results Table */}
                {selectedCity === 'all' && currentData?.by_city && (
                    <div className="mt-6">
                        <CityResults cities={currentData.by_city} selectedYear={selectedYear} />
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        Data source: California Statewide Database (UC Berkeley) • Last updated: {votingData?.last_updated}
                    </p>
                </div>
            </div>
        </div>
    );
}
