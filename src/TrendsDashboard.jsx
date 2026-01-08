import { useState } from 'react';
import { BarChart3, Store, Users } from 'lucide-react';
import { RetailSignals } from './components/RetailSignals';


// Main Dashboard Component - Only real data, no sample data
export default function TrendsDashboard() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Subtle grid overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-800/50">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold">Trends</h1>
                    </div>
                    <p className="text-sm text-slate-400">San Diego • Trends & Displacement Indicators</p>
                </div>

                {/* Retail Signals */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-white flex items-center gap-2">
                            <Store className="w-4 h-4 text-orange-400" />
                            Retail Signals
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full">LIVE</span>
                    </div>
                    <RetailSignals />
                </div>



                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        Data sources: OpenStreetMap (live), Regional Task Force on Homelessness (2024), City of San Diego
                    </p>
                </div>
            </div>
        </div>
    );
}
