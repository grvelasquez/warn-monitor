import { useState, useCallback } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

/**
 * TransitionChart - Dual-Axis Composed Chart
 * 
 * Shows the relationship between demographic changes (bars) and
 * real estate price changes (line) over time.
 * 
 * Left Y-Axis: Enrollment/Demographics (Bars)
 * Right Y-Axis: Median Home Price (Line)
 */
export function TransitionChart({
    data,
    onYearHover,
    onYearClick,
    showEnrollment = true,
    showMinority = true,
    showPrice = true,
    height = 350
}) {
    const [activeYear, setActiveYear] = useState(null);

    // Format currency
    const formatPrice = (value) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        return `$${(value / 1000).toFixed(0)}K`;
    };

    // Format enrollment
    const formatEnrollment = (value) => {
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toLocaleString();
    };

    // Handle mouse events for interactivity
    const handleMouseMove = useCallback((state) => {
        if (state?.activePayload?.[0]?.payload) {
            const year = state.activePayload[0].payload.year;
            if (year !== activeYear) {
                setActiveYear(year);
                onYearHover?.(year, state.activePayload[0].payload);
            }
        }
    }, [activeYear, onYearHover]);

    const handleMouseLeave = useCallback(() => {
        setActiveYear(null);
        onYearHover?.(null, null);
    }, [onYearHover]);

    const handleClick = useCallback((state) => {
        if (state?.activePayload?.[0]?.payload) {
            onYearClick?.(state.activePayload[0].payload);
        }
    }, [onYearClick]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;

        const yearData = payload[0]?.payload;
        if (!yearData) return null;

        return (
            <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-4 shadow-xl backdrop-blur-sm">
                <p className="text-white font-semibold text-lg mb-2">{label}</p>
                <div className="space-y-2">
                    {showPrice && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400 text-sm">Median Price</span>
                            <span className="text-emerald-400 font-medium">{formatPrice(yearData.medianPrice)}</span>
                        </div>
                    )}
                    {showEnrollment && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400 text-sm">Enrollment</span>
                            <span className="text-blue-400 font-medium">{formatEnrollment(yearData.enrollment)}</span>
                        </div>
                    )}
                    {showMinority && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400 text-sm">Minority %</span>
                            <span className="text-purple-400 font-medium">{yearData.minorityPercent}%</span>
                        </div>
                    )}
                    <div className="border-t border-slate-700 pt-2 mt-2">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400 text-sm">Price YoY</span>
                            <span className={`font-medium ${yearData.medianPriceVelocity > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {yearData.medianPriceVelocity > 0 ? '+' : ''}{yearData.medianPriceVelocity?.toFixed(1) || 0}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400 text-sm">Enrollment YoY</span>
                            <span className={`font-medium ${yearData.enrollmentVelocity < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {yearData.enrollmentVelocity > 0 ? '+' : ''}{yearData.enrollmentVelocity?.toFixed(1) || 0}%
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-1">
                        <span className="text-slate-400 text-sm">Displacement Risk</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${yearData.displacementRisk > 0.7 ? 'bg-red-900/50 text-red-400' :
                                yearData.displacementRisk > 0.4 ? 'bg-orange-900/50 text-orange-400' :
                                    'bg-green-900/50 text-green-400'
                            }`}>
                            {(yearData.displacementRisk * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Custom legend
    const CustomLegend = ({ payload }) => (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
            {payload?.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-slate-400">{entry.value}</span>
                </div>
            ))}
        </div>
    );

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <p className="text-slate-500">No data available</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={height}>
                <ComposedChart
                    data={data}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleClick}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                    {/* X-Axis: Years */}
                    <XAxis
                        dataKey="year"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                    />

                    {/* Left Y-Axis: Enrollment */}
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#64748b"
                        fontSize={11}
                        tickFormatter={formatEnrollment}
                        domain={['dataMin - 5000', 'dataMax + 5000']}
                        label={{
                            value: 'Enrollment',
                            angle: -90,
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 }
                        }}
                    />

                    {/* Right Y-Axis: Price */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#64748b"
                        fontSize={11}
                        tickFormatter={formatPrice}
                        domain={['dataMin - 50000', 'dataMax + 50000']}
                        label={{
                            value: 'Median Price',
                            angle: 90,
                            position: 'insideRight',
                            style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 }
                        }}
                    />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />

                    {/* Enrollment Bars */}
                    {showEnrollment && (
                        <Bar
                            yAxisId="left"
                            dataKey="enrollment"
                            name="School Enrollment"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                        />
                    )}

                    {/* Minority Percentage as smaller overlaid bar */}
                    {showMinority && (
                        <Bar
                            yAxisId="left"
                            dataKey={(d) => d.enrollment * (d.minorityPercent / 100)}
                            name="Minority Students"
                            fill="#a855f7"
                            radius={[4, 4, 0, 0]}
                            opacity={0.9}
                        />
                    )}

                    {/* Price Line */}
                    {showPrice && (
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="medianPrice"
                            name="Median Home Price"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                        />
                    )}

                    {/* Reference line for current year */}
                    <ReferenceLine
                        x={new Date().getFullYear()}
                        stroke="#f59e0b"
                        strokeDasharray="5 5"
                        opacity={0.5}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

export default TransitionChart;
