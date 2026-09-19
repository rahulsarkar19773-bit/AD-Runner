import { useState } from 'react';
import { UserProfile } from '../types';
import { Megaphone, RefreshCw, Key, CheckCircle, Trash2, ExternalLink, Play } from 'lucide-react';

interface AdsterraDashboardProps {
  user: UserProfile;
}

export default function AdsterraDashboard({ user }: AdsterraDashboardProps) {
  const [apiKey, setApiKey] = useState('********************');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [timeframe, setTimeframe] = useState<'today' | 'yesterday' | 'last7' | 'last30'>('last7');

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      setApiKey(tempKey.trim());
      setIsEditingKey(false);
      setTempKey('');
    }
  };

  const handleImportSmartlinks = () => {
    setImporting(true);
    setImportSuccess(false);
    setTimeout(() => {
      setImporting(false);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-28 text-white">
      {/* Adsterra Header Banner */}
      <div className="bg-[#18153b] rounded-[2rem] p-6 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-900/80 flex items-center justify-center border border-indigo-700/50">
              <Megaphone className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Adsterra Monetization</h2>
              <p className="text-xs text-indigo-300 font-medium">Live Dashboard & Yield Statistics</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="p-2.5 rounded-xl bg-indigo-900/50 hover:bg-indigo-900 text-indigo-300 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="bg-indigo-950/60 rounded-2xl p-4 border border-indigo-900/40 text-center">
            <span className="text-[11px] uppercase font-bold text-indigo-300">Today</span>
            <p className="text-xl md:text-2xl font-black text-emerald-400 mt-1">$0.01</p>
          </div>
          <div className="bg-indigo-950/60 rounded-2xl p-4 border border-indigo-900/40 text-center">
            <span className="text-[11px] uppercase font-bold text-indigo-300">All-Time</span>
            <p className="text-xl md:text-2xl font-black text-cyan-400 mt-1">$0.11</p>
          </div>
          <div className="bg-indigo-950/60 rounded-2xl p-4 border border-indigo-900/40 text-center">
            <span className="text-[11px] uppercase font-bold text-indigo-300">Days Active</span>
            <p className="text-xl md:text-2xl font-black text-purple-400 mt-1">2</p>
          </div>
        </div>
      </div>

      {/* Video Tutorial Section */}
      <div className="bg-[#18153b] rounded-3xl p-5 border border-indigo-900/50 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <h3 className="font-bold text-white text-sm">Video Tutorial & Guide</h3>
          </div>
          <span className="text-xs text-indigo-300">Watch & Learn</span>
        </div>
        <div className="w-full bg-slate-900 rounded-2xl overflow-hidden border border-indigo-800/50 relative aspect-video flex flex-col items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
          <div className="w-14 h-14 rounded-full bg-cyan-400/90 text-slate-950 flex items-center justify-center z-10 shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-current ml-1" />
          </div>
          <p className="relative z-10 text-xs font-semibold text-white mt-3">How to connect Adsterra API & get smartlinks</p>
        </div>
      </div>

      {/* API Key Configuration */}
      <div className="bg-[#18153b] rounded-3xl p-5 border border-indigo-900/50 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">API KEY</h3>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
            Connected
          </span>
        </div>

        {isEditingKey ? (
          <div className="space-y-3 pt-2">
            <input 
              type="text"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="Enter Adsterra API key..."
              className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <div className="flex space-x-2">
              <button 
                onClick={handleSaveKey}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Save Key
              </button>
              <button 
                onClick={() => setIsEditingKey(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-indigo-950/50 px-4 py-3 rounded-2xl border border-indigo-900/40">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-sm font-mono text-indigo-200 truncate">{apiKey}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button 
                onClick={() => setIsEditingKey(true)}
                className="text-xs text-cyan-400 hover:underline font-semibold px-2 py-1"
              >
                Update
              </button>
              <button 
                onClick={() => setApiKey('')}
                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Smartlinks Section */}
      <div className="bg-[#18153b] rounded-3xl p-5 border border-indigo-900/50 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ExternalLink className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">SMARTLINKS</h3>
          </div>
          <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/30">
            Connected
          </span>
        </div>

        <div className="space-y-2 text-sm text-indigo-200">
          <div className="flex justify-between items-center py-2 border-b border-indigo-900/40">
            <span>Smartlinks available:</span>
            <span className="font-bold text-white">20</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Imported as links:</span>
            <span className="font-bold text-emerald-400">20</span>
          </div>
        </div>

        {importSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Successfully imported 20 smartlinks (replaced previous Adsterra links)</span>
          </div>
        )}

        <button 
          onClick={handleImportSmartlinks}
          disabled={importing}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
        >
          {importing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-950"></div>
              <span>Importing Smartlinks...</span>
            </>
          ) : (
            <span>Import Smartlinks</span>
          )}
        </button>
      </div>

      {/* Period Overview Statistics */}
      <div className="bg-[#18153b] rounded-3xl p-5 border border-indigo-900/50 shadow-md space-y-4">
        <h3 className="font-bold text-white text-base flex items-center space-x-2">
          <span>📊</span>
          <span>PERIOD OVERVIEW</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-900/40">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold mb-1">
              <span>💰</span>
              <span>Revenue</span>
            </div>
            <p className="text-xl font-black text-white">$0.11</p>
          </div>
          <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-900/40">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold mb-1">
              <span>👁️</span>
              <span>Impressions</span>
            </div>
            <p className="text-xl font-black text-white">1.2K</p>
          </div>
          <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-900/40">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold mb-1">
              <span>🖱️</span>
              <span>Clicks</span>
            </div>
            <p className="text-xl font-black text-white">0</p>
          </div>
          <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-900/40">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold mb-1">
              <span>📈</span>
              <span>eCPM</span>
            </div>
            <p className="text-xl font-black text-white">$0.10</p>
          </div>
        </div>

        {/* Timeframe selector tabs */}
        <div className="flex bg-indigo-950/80 p-1.5 rounded-2xl border border-indigo-900/40">
          <button 
            onClick={() => setTimeframe('today')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${timeframe === 'today' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-indigo-300 hover:text-white'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setTimeframe('yesterday')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${timeframe === 'yesterday' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-indigo-300 hover:text-white'}`}
          >
            Yesterday
          </button>
          <button 
            onClick={() => setTimeframe('last7')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${timeframe === 'last7' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-indigo-300 hover:text-white'}`}
          >
            Last 7
          </button>
          <button 
            onClick={() => setTimeframe('last30')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${timeframe === 'last30' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-indigo-300 hover:text-white'}`}
          >
            Last 30
          </button>
        </div>

        {/* Statistics Table */}
        <div className="pt-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300 mb-3">Daily Statistics</h4>
          <div className="space-y-2">
            {[
              { date: '08/29', imp: '17', clicks: '0', rev: '$0.00', cpm: '$0.06' },
              { date: '08/30', imp: '17', clicks: '0', rev: '$0.00', cpm: '$0.06' },
              { date: '08/31', imp: '13', clicks: '0', rev: '$0.00', cpm: '$0.00' },
              { date: '09/01', imp: '10', clicks: '0', rev: '$0.00', cpm: '$0.00' },
              { date: '09/02', imp: '16', clicks: '0', rev: '$0.00', cpm: '$0.00' },
              { date: '09/03', imp: '1.0K', clicks: '0', rev: '$0.11', cpm: '$0.11' },
              { date: '09/04', imp: '94', clicks: '0', rev: '$0.01', cpm: '$0.06' },
            ].map((row, idx) => (
              <div key={idx} className="flex items-center justify-between bg-indigo-950/40 px-4 py-3 rounded-2xl border border-indigo-950 text-xs">
                <span className="font-mono text-indigo-200">{row.date}</span>
                <div className="flex space-x-6">
                  <span className="text-slate-400">{row.imp} imp</span>
                  <span className="text-emerald-400 font-bold">{row.rev}</span>
                  <span className="text-cyan-400 font-mono">{row.cpm}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
