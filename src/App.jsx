import { useState } from 'react';
import { AlertTriangle, Home, DollarSign, Construction } from 'lucide-react';
import WarnDashboard from './WarnDashboard';
import SDARDashboard from './SDARDashboard';
import LendingDashboard from './LendingDashboard';
import DevelopmentDashboard from './DevelopmentDashboard';

export default function App() {
  const [activeView, setActiveView] = useState('realestate');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2 mr-8">
              <span className="text-lg font-bold text-white">SDInsights</span>
              <span className="text-xs text-gray-500 hidden sm:inline">San Diego County</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-gray-800/50 rounded-lg">
              <button
                onClick={() => setActiveView('realestate')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'realestate'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Real Estate</span>
                <span className="sm:hidden">Homes</span>
              </button>
              <button
                onClick={() => setActiveView('lending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'lending'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Lending</span>
                <span className="sm:hidden">Rates</span>
              </button>
              <button
                onClick={() => setActiveView('development')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'development'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
              >
                <Construction className="w-4 h-4" />
                <span className="hidden sm:inline">Development</span>
                <span className="sm:hidden">Build</span>
              </button>
              <button
                onClick={() => setActiveView('warn')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'warn'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">SD Insights</span>
                <span className="sm:hidden">WARN</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <div className={activeView === 'realestate' ? 'block' : 'hidden'}>
        <SDARDashboard />
      </div>
      <div className={activeView === 'lending' ? 'block' : 'hidden'}>
        <LendingDashboard />
      </div>
      <div className={activeView === 'development' ? 'block' : 'hidden'}>
        <DevelopmentDashboard />
      </div>
      <div className={activeView === 'warn' ? 'block' : 'hidden'}>
        <WarnDashboard />
      </div>
    </div>
  );
}
