import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsPage() {
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isExtension, setIsExtension] = useState(false);

  // load existing whitelist on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      setIsExtension(true);
      chrome.storage.local.get(['whitelist'], (result) => {
        if (result.whitelist) {
          setWhitelist(result.whitelist);
        }
      });
    }
  }, []);

  const handleAdd = () => {
    if (!newDomain) return;
    // Basic cleanup: remove http://, www., and paths
    let cleanDomain = newDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    
    if (whitelist.includes(cleanDomain)) return;

    const updatedList = [...whitelist, cleanDomain];
    setWhitelist(updatedList);
    setNewDomain('');

    if (isExtension) {
      chrome.storage.local.set({ whitelist: updatedList });
    }
  };

  const handleRemove = (domain: string) => {
    const updatedList = whitelist.filter(d => d !== domain);
    setWhitelist(updatedList);
    if (isExtension) {
      chrome.storage.local.set({ whitelist: updatedList });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            Trusted Sites
          </h1>
        </div>

        {/* Input Area */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8">
          <p className="text-gray-400 text-sm mb-4">
            Add domains that you trust. SafeLink will skip scanning links pointing to these sites.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="example.com" 
              className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button 
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* List Area */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Active Whitelist</h2>
          
          {whitelist.length === 0 ? (
            <div className="text-center py-10 text-gray-600 italic">
              No trusted sites yet.
            </div>
          ) : (
            whitelist.map((domain) => (
              <div key={domain} className="flex items-center justify-between bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="font-mono text-gray-200">{domain}</span>
                </div>
                <button 
                  onClick={() => handleRemove(domain)}
                  className="text-gray-500 hover:text-red-400 p-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {!isExtension && (
           <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl text-yellow-200 text-sm text-center">
              Note: You are viewing this in a browser tab. Whitelist settings only save when opening this page from the Extension Popup.
           </div>
        )}

      </div>
    </div>
  );
}