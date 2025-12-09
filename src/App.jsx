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
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center h-12 sm:h-14">
            {/* Logo/Brand - hidden on very small screens */}
            <div className="hidden xs:flex items-center gap-2 mr-4 sm:mr-8 flex-shrink-0">
              <span className="text-base sm:text-lg font-bold text-white">SDInsights</span>
              <span className="text-xs text-gray-500 hidden md:inline">San Diego County</span>
            </div>

            {/* Navigation Tabs - scrollable on mobile */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-gray-800/50 rounded-lg w-max min-w-full sm:w-auto sm:min-w-0">
                <button
                  onClick={() => setActiveView('realestate')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'realestate'
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
                  onClick={() => setActiveView('warn')}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeView === 'warn'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="hidden sm:inline">WARN</span>
                </button>
              </div>
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
