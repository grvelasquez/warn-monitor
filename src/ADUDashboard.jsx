import { useState, useMemo } from 'react';
import { Home, DollarSign, TrendingUp, Calculator, Info } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// San Diego ADU Constants (2024/2025)
const SD_ADU_RULES = {
    minSize: 150,
    maxSize: 1200,
    jaduMaxSize: 500,
    setbackFeet: 4,
    maxHeight: 24,
    impactFeeWaiverThreshold: 750,
    schoolFeePerSqFt: 5.17,
    schoolFeeThreshold: 500,
    waterFee: 1524,
    sewerFee: 2577,
    permitCostBase: 6500,
    permitCostMax: 21000,
};

const ADU_TYPES = [
    { id: 'detached', label: 'Detached ADU', icon: '🏠', description: 'Standalone unit in backyard' },
    { id: 'attached', label: 'Attached ADU', icon: '🏘️', description: 'Connected to main house' },
    { id: 'conversion', label: 'Garage Conversion', icon: '🚗', description: 'Convert existing garage' },
    { id: 'jadu', label: 'Junior ADU', icon: '🏡', description: 'Up to 500 sq ft, within home' },
];

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

function InputSlider({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '', helpText }) {
    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-slate-300">{label}</label>
                <span className="text-sm font-bold text-white">{prefix}{formatNumber(value)}{suffix}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{prefix}{formatNumber(min)}{suffix}</span>
                <span>{prefix}{formatNumber(max)}{suffix}</span>
            </div>
            {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
        </div>
    );
}

function ResultCard({ title, value, subtitle, icon: Icon, color = 'emerald', trend }) {
    const colorClasses = {
        emerald: 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400',
        blue: 'bg-blue-900/30 border-blue-700/50 text-blue-400',
        amber: 'bg-amber-900/30 border-amber-700/50 text-amber-400',
        purple: 'bg-purple-900/30 border-purple-700/50 text-purple-400',
        teal: 'bg-teal-900/30 border-teal-700/50 text-teal-400',
        rose: 'bg-rose-900/30 border-rose-700/50 text-rose-400',
    };
    return (
        <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="w-4 h-4" />}
                <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            {trend && <p className={`text-xs mt-1 ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%</p>}
        </div>
    );
}

export default function ADUDashboard() {
    // Inputs
    const [aduType, setAduType] = useState('detached');
    const [numberOfUnits, setNumberOfUnits] = useState(1);
    const [size, setSize] = useState(600);
    const [costPerSqFt, setCostPerSqFt] = useState(350);
    const [monthlyRent, setMonthlyRent] = useState(2200);
    const [downPaymentPct, setDownPaymentPct] = useState(20);
    const [interestRate, setInterestRate] = useState(7.0);
    const [loanTermYears, setLoanTermYears] = useState(30);
    const [propertyTaxRate, setPropertyTaxRate] = useState(1.1);
    const [insuranceAnnual, setInsuranceAnnual] = useState(1200);
    const [maintenancePct, setMaintenancePct] = useState(5);
    const [vacancyPct, setVacancyPct] = useState(5);
    const [annualRentIncrease, setAnnualRentIncrease] = useState(3);

    // Calculations
    const calculations = useMemo(() => {
        const isJadu = aduType === 'jadu';
        const effectiveSize = isJadu ? Math.min(size, SD_ADU_RULES.jaduMaxSize) : size;

        // Construction Cost (per unit)
        const constructionCostPerUnit = effectiveSize * costPerSqFt;

        // Fees (San Diego specific, per unit)
        const impactFeeWaived = effectiveSize <= SD_ADU_RULES.impactFeeWaiverThreshold;
        const schoolFeePerUnit = effectiveSize > SD_ADU_RULES.schoolFeeThreshold
            ? effectiveSize * SD_ADU_RULES.schoolFeePerSqFt
            : 0;
        const waterSewerFeesPerUnit = SD_ADU_RULES.waterFee + SD_ADU_RULES.sewerFee;
        const permitFeesPerUnit = SD_ADU_RULES.permitCostBase + (effectiveSize / SD_ADU_RULES.maxSize) * (SD_ADU_RULES.permitCostMax - SD_ADU_RULES.permitCostBase);

        const totalFeesPerUnit = schoolFeePerUnit + waterSewerFeesPerUnit + permitFeesPerUnit;
        const totalProjectCostPerUnit = constructionCostPerUnit + totalFeesPerUnit;

        // Total costs (multiplied by number of units)
        const constructionCost = constructionCostPerUnit * numberOfUnits;
        const totalFees = totalFeesPerUnit * numberOfUnits;
        const totalProjectCost = totalProjectCostPerUnit * numberOfUnits;

        // Financing
        const downPayment = totalProjectCost * (downPaymentPct / 100);
        const loanAmount = totalProjectCost - downPayment;
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTermYears * 12;
        const monthlyMortgage = loanAmount > 0
            ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
            : 0;

        // Monthly Expenses (scaled for all units)
        const monthlyPropertyTax = (totalProjectCost * (propertyTaxRate / 100)) / 12;
        const monthlyInsurance = (insuranceAnnual * numberOfUnits) / 12;
        const totalMonthlyRent = monthlyRent * numberOfUnits;
        const monthlyMaintenance = (totalMonthlyRent * (maintenancePct / 100));
        const monthlyVacancy = totalMonthlyRent * (vacancyPct / 100);

        const totalMonthlyExpenses = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + monthlyVacancy;
        const effectiveRent = totalMonthlyRent * (1 - vacancyPct / 100);
        const monthlyCashFlow = effectiveRent - totalMonthlyExpenses;
        const annualCashFlow = monthlyCashFlow * 12;

        // ROI & Payback
        const cashOnCashReturn = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;
        const paybackYears = monthlyCashFlow > 0 ? downPayment / annualCashFlow : Infinity;

        // Cost breakdown for chart
        const costBreakdown = [
            { name: 'Construction', value: constructionCost, fill: '#10b981' },
            { name: 'Permits', value: permitFeesPerUnit * numberOfUnits, fill: '#3b82f6' },
            { name: 'Water/Sewer', value: waterSewerFeesPerUnit * numberOfUnits, fill: '#8b5cf6' },
            { name: 'School Fees', value: schoolFeePerUnit * numberOfUnits, fill: '#f59e0b' },
        ];

        // Cash flow projection (10 years with rent increases)
        const cashFlowProjection = [];
        let cumulative = -downPayment;
        let projectedRent = totalMonthlyRent;
        for (let year = 1; year <= 10; year++) {
            // Apply rent increase after year 1
            if (year > 1) {
                projectedRent = projectedRent * (1 + annualRentIncrease / 100);
            }
            const projectedEffectiveRent = projectedRent * (1 - vacancyPct / 100);
            const projectedMaintenance = projectedRent * (maintenancePct / 100);
            const projectedVacancy = projectedRent * (vacancyPct / 100);
            // Fixed costs stay the same (mortgage, property tax, insurance)
            const projectedMonthlyExpenses = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + projectedMaintenance + projectedVacancy;
            const projectedMonthlyCashFlow = projectedEffectiveRent - projectedMonthlyExpenses;
            const projectedAnnualCashFlow = projectedMonthlyCashFlow * 12;
            cumulative += projectedAnnualCashFlow;
            cashFlowProjection.push({
                year: `Year ${year}`,
                annual: projectedAnnualCashFlow,
                cumulative: cumulative,
            });
        }

        return {
            effectiveSize,
            numberOfUnits,
            constructionCost,
            totalFees,
            totalProjectCost,
            impactFeeWaived,
            downPayment,
            loanAmount,
            monthlyMortgage,
            monthlyPropertyTax,
            monthlyInsurance,
            monthlyMaintenance,
            monthlyVacancy,
            totalMonthlyExpenses,
            totalMonthlyRent,
            monthlyCashFlow,
            annualCashFlow,
            cashOnCashReturn,
            paybackYears,
            costBreakdown,
            cashFlowProjection,
        };
    }, [aduType, numberOfUnits, size, costPerSqFt, monthlyRent, downPaymentPct, interestRate, loanTermYears, propertyTaxRate, insuranceAnnual, maintenancePct, vacancyPct, annualRentIncrease]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Subtle grid overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-900/30 rounded-lg border border-emerald-800/50">
                                <Home className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">ADU Calculator</h1>
                            <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 text-xs font-medium rounded-full">San Diego</span>
                        </div>
                        <p className="text-slate-400">Estimate costs, financing, and ROI for your Accessory Dwelling Unit</p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300">
                        <strong className="text-blue-400">San Diego ADU Rules:</strong> Max size 1,200 sq ft (JADUs 500 sq ft). 4-ft setbacks. Impact fees waived for units ≤750 sq ft.
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Inputs */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* ADU Type */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-emerald-400" />
                                ADU Type
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {ADU_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setAduType(type.id)}
                                        className={`p-3 rounded-lg border text-left transition-all ${aduType === type.id
                                            ? 'bg-emerald-600/20 border-emerald-500 text-white'
                                            : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        <span className="text-xl">{type.icon}</span>
                                        <p className="text-xs font-medium mt-1">{type.label}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Number of Units */}
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <InputSlider
                                    label="Number of Units"
                                    value={numberOfUnits}
                                    onChange={setNumberOfUnits}
                                    min={1}
                                    max={4}
                                    helpText="SB 9 allows up to 4 units on single-family lots"
                                />
                            </div>
                        </div>

                        {/* Size & Cost */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Home className="w-5 h-5 text-blue-400" />
                                Size & Construction
                            </h3>
                            <InputSlider
                                label="ADU Size"
                                value={size}
                                onChange={setSize}
                                min={SD_ADU_RULES.minSize}
                                max={aduType === 'jadu' ? SD_ADU_RULES.jaduMaxSize : SD_ADU_RULES.maxSize}
                                suffix=" sq ft"
                                helpText={calculations.impactFeeWaived ? "✓ Impact fees waived (≤750 sq ft)" : "Impact fees apply (>750 sq ft)"}
                            />
                            <InputSlider
                                label="Construction Cost"
                                value={costPerSqFt}
                                onChange={setCostPerSqFt}
                                min={200}
                                max={600}
                                step={10}
                                prefix="$"
                                suffix="/sq ft"
                                helpText="San Diego avg: $300-$400/sq ft"
                            />
                        </div>

                        {/* Rent */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-amber-400" />
                                Rental Income
                            </h3>
                            <InputSlider
                                label="Monthly Rent"
                                value={monthlyRent}
                                onChange={setMonthlyRent}
                                min={1000}
                                max={4000}
                                step={50}
                                prefix="$"
                                helpText="SD ADU avg: $2,000-$2,800/mo"
                            />
                            <InputSlider
                                label="Vacancy Rate"
                                value={vacancyPct}
                                onChange={setVacancyPct}
                                min={0}
                                max={15}
                                suffix="%"
                            />
                            <InputSlider
                                label="Annual Rent Increase"
                                value={annualRentIncrease}
                                onChange={setAnnualRentIncrease}
                                min={0}
                                max={10}
                                step={0.5}
                                suffix="%"
                                helpText="SD historical avg: 3-5%/year"
                            />
                        </div>

                        {/* Financing */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                Financing
                            </h3>
                            <InputSlider
                                label="Down Payment"
                                value={downPaymentPct}
                                onChange={setDownPaymentPct}
                                min={0}
                                max={100}
                                suffix="%"
                            />
                            <InputSlider
                                label="Interest Rate"
                                value={interestRate}
                                onChange={setInterestRate}
                                min={4}
                                max={12}
                                step={0.25}
                                suffix="%"
                            />
                            <InputSlider
                                label="Loan Term"
                                value={loanTermYears}
                                onChange={setLoanTermYears}
                                min={5}
                                max={30}
                                suffix=" years"
                            />
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <ResultCard
                                title="Total Project Cost"
                                value={formatCurrency(calculations.totalProjectCost)}
                                subtitle={numberOfUnits > 1 ? `${numberOfUnits} units × ${formatNumber(calculations.effectiveSize)} sq ft` : `${formatNumber(calculations.effectiveSize)} sq ft`}
                                icon={DollarSign}
                                color="blue"
                            />
                            <ResultCard
                                title="Monthly Payment"
                                value={formatCurrency(calculations.totalMonthlyExpenses)}
                                subtitle="P&I + Tax + Ins + Maint"
                                icon={Calculator}
                                color="purple"
                            />
                            <ResultCard
                                title="Monthly Cash Flow"
                                value={formatCurrency(calculations.monthlyCashFlow)}
                                subtitle={`${formatCurrency(calculations.totalMonthlyRent)} rent - expenses`}
                                icon={TrendingUp}
                                color={calculations.monthlyCashFlow >= 0 ? 'emerald' : 'rose'}
                            />
                            <ResultCard
                                title="Annual Cash Flow"
                                value={formatCurrency(calculations.annualCashFlow)}
                                subtitle="Net income per year"
                                icon={DollarSign}
                                color={calculations.annualCashFlow >= 0 ? 'teal' : 'rose'}
                            />
                            <ResultCard
                                title="Cash-on-Cash ROI"
                                value={`${calculations.cashOnCashReturn.toFixed(1)}%`}
                                subtitle="Return on down payment"
                                icon={TrendingUp}
                                color="amber"
                            />
                            <ResultCard
                                title="Payback Period"
                                value={calculations.paybackYears < 100 ? `${calculations.paybackYears.toFixed(1)} yrs` : 'N/A'}
                                subtitle="Time to recoup investment"
                                icon={Calculator}
                                color="purple"
                            />
                        </div>

                        {/* Cost Breakdown Chart */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={calculations.costBreakdown} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {calculations.costBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Monthly Expense Breakdown */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h3 className="text-lg font-semibold mb-4">Monthly Expense Breakdown</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                                    <p className="text-lg font-bold text-white">{formatCurrency(calculations.monthlyMortgage)}</p>
                                    <p className="text-xs text-slate-500">Mortgage</p>
                                </div>
                                <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                                    <p className="text-lg font-bold text-white">{formatCurrency(calculations.monthlyPropertyTax)}</p>
                                    <p className="text-xs text-slate-500">Property Tax</p>
                                </div>
                                <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                                    <p className="text-lg font-bold text-white">{formatCurrency(calculations.monthlyInsurance)}</p>
                                    <p className="text-xs text-slate-500">Insurance</p>
                                </div>
                                <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                                    <p className="text-lg font-bold text-white">{formatCurrency(calculations.monthlyMaintenance)}</p>
                                    <p className="text-xs text-slate-500">Maintenance</p>
                                </div>
                                <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                                    <p className="text-lg font-bold text-white">{formatCurrency(calculations.monthlyVacancy)}</p>
                                    <p className="text-xs text-slate-500">Vacancy</p>
                                </div>
                            </div>
                        </div>

                        {/* Cash Flow Projection */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h3 className="text-lg font-semibold mb-4">10-Year Cash Flow Projection</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={calculations.cashFlowProjection}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                                    <Line type="monotone" dataKey="annual" name="Annual" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Disclaimer */}
                        <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
                            <p className="text-xs text-slate-500">
                                <strong className="text-slate-400">Disclaimer:</strong> This calculator provides estimates only. Actual costs, fees, and rental income may vary. Consult with local contractors, lenders, and the City of San Diego for accurate quotes. Data based on 2024/2025 San Diego ADU regulations.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-500">City of San Diego ADU Guidelines • Updated 2025</p>
                    <p className="text-xs text-slate-600">Gregory Velasquez | LPT Realty | DRE #02252032</p>
                </div>
            </div>
        </div>
    );
}
