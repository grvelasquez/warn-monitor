import { useState, useEffect, useMemo } from 'react';
import { Vote, TrendingUp, TrendingDown, Users, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { regions } from './sdarData';

// Helper to get neighborhood name for a zip code
const getNeighborhoodName = (zipCode) => {
    for (const region of Object.values(regions)) {
        if (region.areas) {
            for (const area of region.areas) {
                if (area.zips && area.zips.includes(zipCode)) {
                    return area.name;
                }
            }
        }
    }
    return null;
};

// Colors for political parties
const COLORS = {
    Democrat: '#3B82F6',  // Blue
    Republican: '#EF4444', // Red
    Other: '#6B7280',      // Gray
    Green: '#10B981',     // Green
    Libertarian: '#F59E0B', // Amber
};

const CANDIDATE_PARTIES = {
    // 2024
    'Harris': 'Democrat',
    'Trump': 'Republican',
    'Kennedy': 'Other',
    'Stein': 'Green',
    'Oliver': 'Libertarian',
    'De la Cruz': 'Other',
    // 2020
    'Biden': 'Democrat',
    'Jorgensen': 'Libertarian',
    'Hawkins': 'Green',
    'De La Fuente': 'Other',
    'La Riva': 'Other',
    // 2016
    'Clinton': 'Democrat',
    'Trump': 'Republican',
    'Johnson': 'Libertarian',
    'Stein': 'Green',
    // 2012
    'Obama': 'Democrat',
    'Romney': 'Republican',
    'Barr': 'Other', // Peace & Freedom
    'Hoefling': 'Other', // American Independent
};

function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
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
function ComparisonChart({ currentData, prevData, currentYear, prevYear }) {
    if (!prevData || !currentData) return (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex items-center justify-center h-full min-h-[250px]">
            <p className="text-gray-500">No comparison data available for {prevYear}</p>
        </div>
    );

    // Get Dem/Rep candidates for each year
    const getCand = (data, party) => {
        if (!data?.candidates) return { name: 'Unknown', percentage: 0 };
        const candidateEntry = Object.entries(data.candidates).find(([name]) => CANDIDATE_PARTIES[name] === party);
        return candidateEntry
            ? {
                name: candidateEntry[0],
                percentage: candidateEntry[1].percentage
            }
            : { name: 'Unknown', percentage: 0 };
    };

    const curDem = getCand(currentData, 'Democrat');
    const curRep = getCand(currentData, 'Republican');
    const prevDem = getCand(prevData, 'Democrat');
    const prevRep = getCand(prevData, 'Republican');

    const chartData = [
        {
            name: 'Democrat',
            [prevYear]: prevDem.percentage,
            [currentYear]: curDem.percentage,
        },
        {
            name: 'Republican',
            [prevYear]: prevRep.percentage,
            [currentYear]: curRep.percentage,
        },
    ];

    const demChange = curDem.percentage - prevDem.percentage;
    const repChange = curRep.percentage - prevRep.percentage;

    return (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-4">{prevYear} vs {currentYear} Comparison</h3>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" barGap={4}>
                        <XAxis type="number" domain={[0, 80]} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} width={80} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey={prevYear} fill="#6B7280" name={prevYear} radius={[0, 4, 4, 0]} />
                        <Bar dataKey={currentYear} name={currentYear} radius={[0, 4, 4, 0]}>
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
                    <div className="text-gray-500">{curDem.name} vs {prevDem.name}</div>
                </div>
                <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                        {repChange > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                        <span className={repChange > 0 ? 'text-green-400' : 'text-red-400'}>
                            {repChange > 0 ? '+' : ''}{repChange.toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-gray-500">{curRep.name} vs {prevRep.name}</div>
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

    const getDemCandidate = (year) => {
        if (year === '2024') return 'Harris';
        if (year === '2020') return 'Biden';
        if (year === '2016') return 'Clinton';
        if (year === '2012') return 'Obama';
        return 'Democrat';
    };

    const getRepCandidate = (year) => {
        if (year === '2012') return 'Romney';
        return 'Trump';
    }

    const demName = getDemCandidate(selectedYear);
    const repName = getRepCandidate(selectedYear);

    return (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-4">Results by {cities['92101'] ? 'Zip Code' : 'City'} ({selectedYear})</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-2 px-2 text-gray-400 font-medium">{cities['92101'] ? 'Zip Code' : 'City'}</th>
                            <th className="text-right py-2 px-2 text-gray-400 font-medium">Total Votes</th>
                            <th className="text-right py-2 px-2 text-blue-400 font-medium">Dem %</th>
                            <th className="text-right py-2 px-2 text-red-400 font-medium">Rep %</th>
                            <th className="text-center py-2 px-2 text-gray-400 font-medium">Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCities.map((city) => {
                            const demPct = city.candidates?.[demName]?.percentage || 0;
                            const repPct = city.candidates?.[repName]?.percentage || 0;
                            const winner = demPct > repPct ? 'D' : 'R';

                            return (
                                <tr key={city.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                    <td className="py-2 px-2 text-white font-mono">{city.name}</td>
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

// Sub-Area (Precinct) Details
function SubAreaDetails({ precinctIds, allPrecincts, selectedYear }) {
    const [expanded, setExpanded] = useState(false);

    // Sort precincts by total votes desc
    const precincts = useMemo(() => {
        if (!precinctIds || !allPrecincts) return [];
        return allPrecincts
            .filter(p => precinctIds.includes(p.precinct))
            .sort((a, b) => b.total - a.total);
    }, [precinctIds, allPrecincts]);

    if (!precincts.length) return null;

    const displayedPrecincts = expanded ? precincts : precincts.slice(0, 10);

    const getDemCandidate = (year) => {
        if (year === '2024') return 'Harris';
        if (year === '2020') return 'Biden';
        if (year === '2016') return 'Clinton';
        if (year === '2012') return 'Obama';
        return 'Democrat';
    };
    const getRepCandidate = (year) => {
        if (year === '2012') return 'Romney';
        return 'Trump';
    }

    const demCandidate = getDemCandidate(selectedYear);
    const repCandidate = getRepCandidate(selectedYear);

    return (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white">
                    Sub-Area Details ({precincts.length} Precincts)
                </h3>
                {precincts.length > 10 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        {expanded ? 'Show Less' : `Show All (${precincts.length})`}
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                    <thead>
                        <tr className="border-b border-gray-700 text-gray-500">
                            <th className="text-left py-2 px-2">Precinct ID</th>
                            <th className="text-left py-2 px-2">City/Area</th>
                            <th className="text-right py-2 px-2">Total Votes</th>
                            <th className="text-right py-2 px-2 text-blue-400">{demCandidate}</th>
                            <th className="text-right py-2 px-2 text-red-400">{repCandidate}</th>
                            <th className="text-right py-2 px-2">Margin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedPrecincts.map((p) => {
                            const dem = p[demCandidate] || 0;
                            const rep = p[repCandidate] || 0;
                            const total = p.total || 0;
                            const margin = total > 0 ? ((dem - rep) / total * 100).toFixed(1) : '0.0';

                            return (
                                <tr key={p.precinct} className="border-b border-gray-700/30 hover:bg-gray-700/30">
                                    <td className="py-2 px-2 text-gray-300 font-mono">{p.precinct}</td>
                                    <td className="py-2 px-2 text-gray-400">{p.city}</td>
                                    <td className="py-2 px-2 text-right text-gray-300">{formatNumber(total)}</td>
                                    <td className="py-2 px-2 text-right text-blue-400">{formatNumber(dem)}</td>
                                    <td className="py-2 px-2 text-right text-red-400">{formatNumber(rep)}</td>
                                    <td className={`py-2 px-2 text-right font-medium ${dem > rep ? 'text-blue-400' : 'text-red-400'}`}>
                                        {dem > rep ? '+' : ''}{margin}%
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
    const [viewMode, setViewMode] = useState('zip'); // 'city' or 'zip'
    const [selectedLocation, setSelectedLocation] = useState('all'); // City Name or Zip Code

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`/data/voting_data.json?v=${Date.now()}`);
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

    // Reset selection only when switching view mode (not when changing year)
    useEffect(() => {
        setSelectedLocation('all');
    }, [viewMode]);

    const currentData = votingData?.elections?.[selectedYear];

    // Dynamic Previous Year Logic
    const prevYear = {
        '2024': '2020',
        '2020': '2016',
        '2016': '2012',
        '2012': null
    }[selectedYear];

    // Determine current location data for chart
    const getComparisonData = useMemo(() => {
        if (!votingData || !prevYear) return { current: null, prev: null };
        const prevElection = votingData.elections[prevYear];
        const curElection = votingData.elections[selectedYear];

        const getData = (election) => {
            if (!election) return null;
            if (selectedLocation === 'all') return election;
            // Need to handle missing locations in older years
            const source = viewMode === 'city' ? election.by_city : election.by_zipcode;
            return source?.[selectedLocation] || null;
        };

        return {
            current: getData(curElection),
            prev: getData(prevElection)
        };
    }, [votingData, selectedYear, prevYear, selectedLocation, viewMode]);

    const locationList = useMemo(() => {
        if (!currentData) return [];
        const source = viewMode === 'city' ? currentData.by_city : currentData.by_zipcode;
        if (!source) return [];
        return ['all', ...Object.keys(source).sort()];
    }, [currentData, viewMode]);

    const displayData = useMemo(() => {
        if (!currentData) return null;
        if (selectedLocation === 'all') return currentData;
        const source = viewMode === 'city' ? currentData.by_city : currentData.by_zipcode;
        return source?.[selectedLocation] || currentData;
    }, [currentData, selectedLocation, viewMode]);

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

    // Dynamic Candidate Identification
    const getDemCandidate = (year) => {
        if (year === '2024') return 'Harris';
        if (year === '2020') return 'Biden';
        if (year === '2016') return 'Clinton';
        if (year === '2012') return 'Obama';
        return 'Democrat';
    };
    const getRepCandidate = (year) => {
        if (year === '2012') return 'Romney';
        return 'Trump';
    }

    const demCandidate = getDemCandidate(selectedYear);
    const repCandidate = getRepCandidate(selectedYear);

    const demVotes = displayData?.candidates?.[demCandidate]?.votes || 0;
    const demPct = displayData?.candidates?.[demCandidate]?.percentage || 0;
    const repVotes = displayData?.candidates?.[repCandidate]?.votes || 0;
    const repPct = displayData?.candidates?.[repCandidate]?.percentage || 0;

    // Determine if sub-area details should be shown
    const showSubAreas = viewMode === 'zip' && selectedLocation !== 'all' && displayData?.precinct_ids;

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
                    <p className="text-sm text-slate-400">San Diego County • 2012-2024 Election Results</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6 items-center">
                    {/* Year selector */}
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        {['2012', '2016', '2020', '2024'].map((year) => (
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

                    <div className="h-6 w-px bg-gray-700 mx-1 hidden sm:block" />

                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        {['zip', 'city'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${viewMode === mode
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                By {mode === 'city' ? 'City' : 'Zip Code'}
                            </button>
                        ))}
                    </div>

                    {/* Location dropdown - styled to match other dashboards */}
                    <div className="relative min-w-[200px] max-w-[320px]">
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full appearance-none bg-gray-800 text-gray-200 text-sm rounded-lg px-4 pr-10 py-2.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:border-purple-500/50 transition-colors"
                        >
                            <option value="all">All {viewMode === 'city' ? 'Cities' : 'Neighborhoods'}</option>
                            {locationList.filter(l => l !== 'all').map((loc) => {
                                // For zip mode, show neighborhood name first, then zip code
                                if (viewMode === 'zip') {
                                    const neighborhoodName = getNeighborhoodName(loc);
                                    return (
                                        <option key={loc} value={loc}>
                                            {neighborhoodName ? `${neighborhoodName} (${loc})` : loc}
                                        </option>
                                    );
                                }
                                return <option key={loc} value={loc}>{loc}</option>;
                            })}
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
                        label={repCandidate}
                        value={`${repPct.toFixed(1)}%`}
                        subtext={`${formatNumber(repVotes)} votes`}
                        color="red"
                    />
                    <StatCard
                        label="Total Votes"
                        value={formatNumber(displayData?.total_votes || 0)}
                        subtext={selectedLocation === 'all' ? 'County-wide' : selectedLocation}
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
                            {selectedYear} Results {selectedLocation !== 'all' && `- ${selectedLocation}`}
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
                        currentData={getComparisonData.current}
                        prevData={getComparisonData.prev}
                        currentYear={selectedYear}
                        prevYear={prevYear}
                    />
                </div>

                {/* List View (City Results Table or Sub-Area Details) */}
                {viewMode === 'city' && selectedLocation === 'all' && currentData?.by_city && (
                    <div className="mt-6">
                        <CityResults cities={currentData.by_city} selectedYear={selectedYear} />
                    </div>
                )}

                {showSubAreas && (
                    <SubAreaDetails
                        precinctIds={displayData.precinct_ids}
                        allPrecincts={currentData.precincts}
                        selectedYear={selectedYear}
                    />
                )}

                {/* When in zip mode and showing ALL, maybe a table of Top Zips? */}
                {viewMode === 'zip' && selectedLocation === 'all' && currentData?.by_zipcode && (
                    <div className="mt-6">
                        <CityResults cities={currentData.by_zipcode} selectedYear={selectedYear} />
                        {/* Reusing CityResults for Zips works if structure is same.
                            CityResults expects {name, total_votes, candidates...}
                            The by_zipcode structure is same but key is zip.
                            CityResults maps Object.entries so it will use Zip as name. Perfect.
                        */}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        Data source: California Statewide Database (UC Berkeley) • Last updated: {votingData?.last_updated}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                        Note: Zip Code data is aggregated from Precincts using Census Tract centroids. Sub-area details show precinct-level results.
                    </p>
                </div>
            </div>
        </div>
    );
}
