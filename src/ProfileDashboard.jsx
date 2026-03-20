import React from 'react';
import { Mail, Phone, Building2, Hash } from 'lucide-react';

export default function ProfileDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        
        {/* Main Card */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-blue-900/20">
          
          {/* Header Gradient / Banner */}
          <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-blue-900/60 relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] mix-blend-overlay"></div>
          </div>
          
          <div className="px-6 sm:px-12 pb-12">
            
            {/* Avatar Section */}
            <div className="relative -mt-16 sm:-mt-24 mb-6 sm:mb-8 flex justify-center sm:justify-start">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-4 sm:border-[6px] border-slate-900 shadow-xl flex items-center justify-center transform transition-transform duration-300 hover:scale-105">
                <span className="text-4xl sm:text-6xl font-bold text-white tracking-wider">GV</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 justify-between items-center sm:items-start text-center sm:text-left">
              
              {/* Profile Details */}
              <div className="space-y-6 w-full">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                    Gregory Velasquez
                  </h1>
                  <p className="inline-flex items-center justify-center sm:justify-start gap-2 px-4 py-1.5 bg-blue-900/30 text-blue-400 rounded-full text-lg font-medium border border-blue-800/50">
                    <Building2 className="w-5 h-5" />
                    Realtor | LPT Realty
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  
                  {/* Phone */}
                  <a href="tel:650-793-1771" className="group flex items-center gap-4 p-4 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl border border-slate-700/50 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-3 bg-slate-900 rounded-xl group-hover:bg-blue-900/30 transition-colors">
                      <Phone className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex flex-col text-left z-10">
                      <span className="text-xs text-slate-400 mb-0.5">Phone</span>
                      <span className="text-lg font-medium text-slate-200 group-hover:text-white transition-colors">650-793-1771</span>
                    </div>
                  </a>

                  {/* Email */}
                  <a href="mailto:greg.velasquezRE@gmail.com" className="group flex items-center gap-4 p-4 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl border border-slate-700/50 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-3 bg-slate-900 rounded-xl group-hover:bg-blue-900/30 transition-colors">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex flex-col text-left z-10 w-full">
                      <span className="text-xs text-slate-400 mb-0.5">Email</span>
                      <span className="text-base sm:text-lg font-medium text-slate-200 group-hover:text-white transition-colors truncate" title="greg.velasquezRE@gmail.com">
                        greg.velasquezRE@gmail.com
                      </span>
                    </div>
                  </a>

                  {/* DRE License */}
                  <div className="group flex items-center gap-4 p-4 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl border border-slate-700/50 transition-all duration-300 overflow-hidden relative sm:col-span-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-3 bg-slate-900 rounded-xl group-hover:bg-indigo-900/30 transition-colors">
                      <Hash className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex flex-col text-left z-10">
                      <span className="text-xs text-slate-400 mb-0.5">License</span>
                      <span className="text-lg font-medium text-slate-200 group-hover:text-white transition-colors">DRE #02252032</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
