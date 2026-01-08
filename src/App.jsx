import { useState } from 'react';
import { AlertTriangle, Home, DollarSign, Construction, Sun, BarChart3, MapPin, Map, Vote, FileText, Warehouse, Building2 } from 'lucide-react';
import WarnDashboard from './WarnDashboard';
import SDARDashboard from './SDARDashboard';
import LendingDashboard from './LendingDashboard';
import DevelopmentDashboard from './DevelopmentDashboard';
import WeatherDashboard from './WeatherDashboard';
import TrendsDashboard from './TrendsDashboard';
import NeighborhoodEvolution from './NeighborhoodEvolution';
import MapDashboard from './MapDashboard';
import VotingDashboard from './VotingDashboard';
import LenderMediatedDashboard from './LenderMediatedDashboard';
import SupplyDashboard from './SupplyDashboard';
import ADUDashboard from './ADUDashboard';
import HomePriceIndexDashboard from './HomePriceIndexDashboard';


export default function App() {
  const [activeView, setActiveView] = useState('weather');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center h-12 sm:h-14">
            {/* Logo/Brand - hidden on very small screens */}
            <div className="hidden xs:flex items-center gap-2 mr-4 sm:mr-8 flex-shrink-0">
              <span className="text-base sm:text-lg font-bold text-white">SDInsights</span>
              <span className="text-xs text-gray-500 hidden md:inline">San Diego County</span>
            </div>

            {/* Navigation Tabs - scrollable on mobile */}
            <div className="flex-1 overflow-x-auto pb-1">
              <div className="flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-gray-800/50 rounded-lg w-max min-w-full sm:w-auto sm:min-w-0">
                <button
                  onClick={() => setActiveView('weather')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'weather'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="hidden sm:inline">Weather</span>
                </button>
                <button
                  onClick={() => setActiveView('realestate')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${['realestate', 'neighborhoods', 'map', 'homepriceindex'].includes(activeView)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Real Estate</span>
                </button>
                <button
                  onClick={() => setActiveView('lending')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'lending'
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Lending</span>
                </button>
                <button
                  onClick={() => setActiveView('supply')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'supply'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <Warehouse className="w-4 h-4" />
                  <span className="hidden sm:inline">Supply</span>
                </button>
                <button
                  onClick={() => setActiveView('lendermediated')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'lendermediated'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Lender-Mediated</span>
                </button>
                <button
                  onClick={() => setActiveView('development')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'development'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <Construction className="w-4 h-4" />
                  <span className="hidden sm:inline">Development</span>
                </button>
                <button
                  onClick={() => setActiveView('voting')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'voting'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <Vote className="w-4 h-4" />
                  <span className="hidden sm:inline">Voting</span>
                </button>
                <button
                  onClick={() => setActiveView('adu')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'adu'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">ADU</span>
                </button>

                <button
                  onClick={() => setActiveView('warn')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'warn'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="hidden sm:inline">WARN</span>
                </button>
                <button
                  onClick={() => setActiveView('trends')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'trends'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Trends</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <div className={activeView === 'weather' ? 'block' : 'hidden'}>
        <WeatherDashboard />
      </div>
      <div className={activeView === 'realestate' ? 'block' : 'hidden'}>
        <SDARDashboard setActiveView={setActiveView} />
      </div>
      <div className={activeView === 'lending' ? 'block' : 'hidden'}>
        <LendingDashboard />
      </div>
      {activeView === 'supply' && (
        <div className="block">
          <SupplyDashboard />
        </div>
      )}
      {activeView === 'lendermediated' && (
        <div className="block">
          <LenderMediatedDashboard />
        </div>
      )}
      <div className={activeView === 'development' ? 'block' : 'hidden'}>
        <DevelopmentDashboard />
      </div>
      <div className={activeView === 'trends' ? 'block' : 'hidden'}>
        <TrendsDashboard />
      </div>
      <div className={activeView === 'neighborhoods' ? 'block' : 'hidden'}>
        <NeighborhoodEvolution setActiveView={setActiveView} />
      </div>
      {activeView === 'map' && (
        <div className="block">
          <MapDashboard setActiveView={setActiveView} />
        </div>
      )}
      {activeView === 'voting' && (
        <div className="block">
          <VotingDashboard />
        </div>
      )}
      {activeView === 'adu' && (
        <div className="block">
          <ADUDashboard />
        </div>
      )}
      {activeView === 'homepriceindex' && (
        <div className="block">
          <HomePriceIndexDashboard setActiveView={setActiveView} />
        </div>
      )}

      <div className={activeView === 'warn' ? 'block' : 'hidden'}>
        <WarnDashboard />
      </div>
    </div>
  );
}

