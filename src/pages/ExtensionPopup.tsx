import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Power, Settings, ExternalLink, Activity } from 'lucide-react';

export default function ExtensionPopup() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [stats, setStats] = useState({ scanned: 0, threats: 0 });

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['hoverGuardEnabled', 'stats'], (result) => {
        if (result.hoverGuardEnabled !== undefined) {
          setEnabled(result.hoverGuardEnabled);
        }
        if (result.stats) {
          setStats(result.stats);
        }
      });
    }
  }, []);

  const toggleProtection = () => {
    const newState = !enabled;
    setEnabled(newState);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ hoverGuardEnabled: newState });
    }
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  };

  return (
    <div className="w-[320px] min-h-[450px] bg-gray-950 text-white font-sans overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Shield className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="font-bold text-sm tracking-wide">SafeLink</span>
        </div>
        <button 
          onClick={() => navigate('/settings')}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
          title="Settings / Whitelist"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* MAIN STATUS AREA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        
        {/* Status Circle */}
        <div className="relative">
          {/* Glowing Ring */}
          <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${enabled ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
          
          <button 
            onClick={toggleProtection}
            className={`relative w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 shadow-2xl
              ${enabled 
                ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400 hover:scale-105' 
                : 'border-gray-600 bg-gray-800 text-gray-500 hover:border-gray-500'
              }`}
          >
            <Power className="w-8 h-8 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {enabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        <div className="text-center space-y-1">
          <h2 className={`text-lg font-bold ${enabled ? 'text-white' : 'text-gray-500'}`}>
            {enabled ? 'Protection Active' : 'Protection Paused'}
          </h2>
          <p className="text-xs text-gray-400">
            {enabled ? 'Scanning links in real-time.' : 'Resume to enable AI scanning.'}
          </p>
        </div>

        {/* Mini Stats (Optional Placeholder) */}
        <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex flex-col items-center">
                <Activity className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-lg font-bold leading-none">{stats.scanned || 0}</span>
                <span className="text-[9px] text-gray-500 uppercase mt-1">Scanned</span>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex flex-col items-center">
                <Shield className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-lg font-bold leading-none">{stats.threats || 0}</span>
                <span className="text-[9px] text-gray-500 uppercase mt-1">Secured</span>
            </div>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50 space-y-2">
        <button 
          onClick={openDashboard}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold transition-colors"
        >
          Open Dashboard <ExternalLink className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}