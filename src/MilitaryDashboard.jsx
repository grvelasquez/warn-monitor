import { useState, useMemo, useEffect } from 'react';
import { Shield, Search, Info, DollarSign, MapPin, Calculator, ArrowRight } from 'lucide-react';

const formatCurrency = (val) => `$${val.toLocaleString()}`;

function InfoCard({ title, value, subtext, icon: Icon, color }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 ${color} rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">{title}</h3>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
    );
}

export default function MilitaryDashboard() {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/data/military_income_floor_2025.csv')
            .then(res => res.text())
            .then(text => {
                const rows = text.split('\n').filter(row => row.trim() !== '');
                const headers = rows[0].split(',');
                const jsonData = rows.slice(1).map(row => {
                    const values = row.split(',');
                    return headers.reduce((obj, header, i) => {
                        obj[header.trim()] = values[i]?.trim();
                        return obj;
                    }, {});
                });
                setData(jsonData);
            })
            .catch(err => console.error('Error loading military data:', err))
            .finally(() => setLoading(false));
    }, []);

    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.zip_code?.includes(searchTerm) ||
            item.city?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const metroRates = data.find(item => item.mha_code === 'CA038') || {};
    const pendletonRates = data.find(item => item.mha_code === 'CA024') || {};

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-indigo-500 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
                                <Shield className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">2025 Military Income Floor</h1>
                        </div>
                        <p className="text-slate-400">San Diego County • Guaranteed Base + BAH + BAS for E-5 Rank</p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search zip or city..."
                            className="bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <InfoCard
                        title="Metro SD Floor"
                        value={metroRates.income_e5_with_dep ? formatCurrency(parseInt(metroRates.income_e5_with_dep)) : 'N/A'}
                        subtext="E-5 with Dependents"
                        icon={DollarSign}
                        color="bg-blue-600"
                    />
                    <InfoCard
                        title="Pendleton Floor"
                        value={pendletonRates.income_e5_with_dep ? formatCurrency(parseInt(pendletonRates.income_e5_with_dep)) : 'N/A'}
                        subtext="E-5 with Dependents"
                        icon={DollarSign}
                        color="bg-emerald-600"
                    />
                    <InfoCard
                        title="Metro BAH"
                        value={metroRates.bah_e5_with_dep ? formatCurrency(parseInt(metroRates.bah_e5_with_dep)) : 'N/A'}
                        subtext="MHA CA038 (Tax-Free)"
                        icon={MapPin}
                        color="bg-indigo-600"
                    />
                    <InfoCard
                        title="Pendleton BAH"
                        value={pendletonRates.bah_e5_with_dep ? formatCurrency(parseInt(pendletonRates.bah_e5_with_dep)) : 'N/A'}
                        subtext="MHA CA024 (Tax-Free)"
                        icon={MapPin}
                        color="bg-teal-600"
                    />
                </div>

                {/* Details Section */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Zip Table */}
                    <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="font-semibold">Zip Code Mappings</h2>
                            <span className="text-xs text-slate-500">{filteredData.length} records</span>
                        </div>
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/50 text-slate-400 font-medium sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Zip</th>
                                        <th className="px-4 py-3">City</th>
                                        <th className="px-4 py-3">Zone</th>
                                        <th className="px-4 py-3 text-right">Floor (Single)</th>
                                        <th className="px-4 py-3 text-right">Floor (Married)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {filteredData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-3 font-mono text-indigo-400">{row.zip_code}</td>
                                            <td className="px-4 py-3">{row.city}</td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className={`px-2 py-0.5 rounded-full ${row.mha_code === 'CA024' ? 'bg-teal-900/30 text-teal-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                    {row.zone}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(parseInt(row.income_e5_without_dep))}</td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-400">{formatCurrency(parseInt(row.income_e5_with_dep))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Insights Panel */}
                    <div className="space-y-6">
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Calculator className="w-5 h-5 text-indigo-400" />
                                <h2 className="font-semibold">Investor Insights</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-white mb-1">"Grossing Up" BAH/BAS</p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Because military allowances are tax-free, lenders often multiply these amounts by 1.25x (grossing up) to calculate debt-to-income (DTI) ratios fairly against civilian taxable income.
                                    </p>
                                </div>
                                <div className="p-3 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
                                    <p className="text-xs font-bold text-indigo-300 uppercase mb-2">E-5 Spending Power Example</p>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-400">Metro BAH:</span>
                                        <span className="text-white font-medium">$3,987</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-slate-400">Taxable Equivalent:</span>
                                        <span className="text-indigo-400 font-bold flex items-center gap-1">
                                            ~$4,983 <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="w-5 h-5 text-blue-400" />
                                <h2 className="font-semibold">Logic Notes</h2>
                            </div>
                            <ul className="text-xs text-slate-400 space-y-3">
                                <li className="flex gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span>The "Floor" includes Base Pay + BAH + BAS.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span>E-1 to E-3 usually live in barracks (on-base) unless they have dependents.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span>Highway 78 is the rough boundary between Metro and Pendleton MHAs.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
                    <p>Updated for 2025 Rates • San Diego County Real Estate Dashboard</p>
                </div>
            </div>
        </div>
    );
}
