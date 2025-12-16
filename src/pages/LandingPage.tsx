import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Zap, Lock, Eye, 
  Github, Twitter, Linkedin, 
  ArrowRight, CheckCircle, Settings, Search 
} from 'lucide-react';

import LinkPreviewTooltip, { LinkSafetyData } from '../components/LinkPreviewTooltip';

export default function LandingPage() {
  const [activeTooltip, setActiveTooltip] = useState<{ url: string; x: number; y: number } | null>(null);
  const [previewData, setPreviewData] = useState<LinkSafetyData | null>(null);
  const navigate = useNavigate(); 
  const [manualUrl, setManualUrl] = useState(''); 

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl) return;
    // Navigate to the report page with the user's URL
    navigate(`/report?url=${encodeURIComponent(manualUrl)}`);
  };

  // Handle Mouse Over for Demo Area
  const handleDemoHover = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    setActiveTooltip({ url, x: e.clientX, y: e.clientY });
  };

  const handleDemoLeave = () => {
    setActiveTooltip(null);
    setPreviewData(null);
  };

  // Simulate API response for page demo
  useEffect(() => {
    if (activeTooltip) {
      setPreviewData({
        safe: true, originalUrl: activeTooltip.url, finalUrl: activeTooltip.url,
        domain: new URL(activeTooltip.url).hostname, status: 0, riskSignals: [], loading: true
      });

      const timer = setTimeout(() => {
        const isUnsafe = activeTooltip.url.includes('suspicious');
        setPreviewData({
          safe: !isUnsafe,
          originalUrl: activeTooltip.url,
          finalUrl: activeTooltip.url,
          domain: new URL(activeTooltip.url).hostname,
          status: 200,
          riskSignals: isUnsafe ? ['Suspicious Pattern', 'High Entropy'] : [],
          loading: false
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [activeTooltip]);


  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-gray-950/80 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Shield className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">SafeLink <span className="text-blue-500">HoverGuard</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#demo" className="hover:text-white transition-colors">Live Demo</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Settings Link */}
            <Link to="/settings" className="text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
             </Link>

             <a href="https://github.com/JosephMusenge/SafeLink-HoverGuard" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">
                <Github className="w-5 h-5" />
             </a>
             <button className="bg-white text-gray-900 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-bold transition-colors">
                Download
             </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" /> v1.0 Now Available
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                See the destination <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">before you click.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                SafeLink uses local AI to detect phishing attempts, analyze redirects, and preview links instantly—all without tracking your history.
            </p>

            {/* MANUAL SCANNER INPUT */}
            <div className="max-w-lg mx-auto mb-12 relative z-10">
                <form onSubmit={handleScan} className="flex items-center bg-gray-900/80 border border-gray-700 rounded-full p-2 pl-6 shadow-2xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <Search className="w-5 h-5 text-gray-500 mr-3" />
                    <input 
                        type="text" 
                        placeholder="Paste a URL to check safety..." 
                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500 text-sm"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                    />
                    <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold transition-colors shrink-0"
                    >
                        Scan Link
                    </button>
                </form>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="https://chrome.google.com/webstore/detail/your-extension-id" target="_blank" rel="noopener noreferrer">
                    <button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] flex items-center gap-2">
                        Add to Chrome <ArrowRight className="w-5 h-5" />
                    </button>
                </a>
                <a href="https://github.com/JosephMusenge/SafeLink-HoverGuard" target="_blank" rel="noopener noreferrer">
                    <button className="h-12 px-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg border border-gray-700 transition-all">
                        View on GitHub
                    </button>
                </a>
            </div>
        </div>
      </header>

      {/* 3. INTERACTIVE DEMO PLAYGROUND */}
      <section id="demo" className="py-20 bg-gray-900/50 border-y border-gray-800 relative">
        <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Try it right here</h2>
                <p className="text-gray-400">Hover over the links below to see the SafeLink tooltip in action.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Safe Card */}
                <div className="bg-gray-950 p-8 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center group hover:border-emerald-500/50 transition-colors">
                    <div className="w-12 h-12 bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Standard Link</h3>
                    <p className="text-gray-500 text-sm mb-6">A normal, safe URL like Google or Wikipedia.</p>
                    <a 
                        href="https://google.com" 
                        className="text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 hover:text-emerald-300"
                        onMouseEnter={(e) => handleDemoHover(e, 'https://google.com')}
                        onMouseLeave={handleDemoLeave}
                    >
                        Hover me to test Safe Link
                    </a>
                </div>

                {/* Unsafe Card */}
                <div className="bg-gray-950 p-8 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center group hover:border-red-500/50 transition-colors">
                     <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Phishing Simulation</h3>
                    <p className="text-gray-500 text-sm mb-6">A suspicious URL with redirects and high entropy.</p>
                    <a 
                        href="http://secure-login-update.paypal.suspicious-domain.net" 
                        className="text-red-400 underline decoration-red-500/30 underline-offset-4 hover:text-red-300"
                        onMouseEnter={(e) => handleDemoHover(e, 'http://secure-login-update.paypal.suspicious-domain.net')}
                        onMouseLeave={handleDemoLeave}
                    >
                        Hover me to test Phishing Link
                    </a>
                </div>
            </div>
            
            {/* The Tooltip Rendering Layer for Demo */}
            <LinkPreviewTooltip 
                visible={!!activeTooltip} 
                data={previewData} 
                position={activeTooltip ? { x: activeTooltip.x, y: activeTooltip.y } : { x: 0, y: 0 }} 
            />
        </div>
      </section>

      {/* 4. FEATURES GRID */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-12 text-center">Defense in Depth</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {[
                    {
                        icon: <Eye className="w-6 h-6 text-blue-400" />,
                        title: "Visual Preview",
                        desc: "See the final destination URL without clicking. We unfurl shortened links (bit.ly, t.co) automatically."
                    },
                    {
                        icon: <Zap className="w-6 h-6 text-yellow-400" />,
                        title: "AI Analysis",
                        desc: "Our local model analyzes URL text patterns (entropy, length, chars) to detect 0-day phishing."
                    },
                    {
                        icon: <Shield className="w-6 h-6 text-emerald-400" />,
                        title: "Privacy First",
                        desc: "Analysis happens locally or on your own private instance. We don't sell your browsing history."
                    }
                ].map((feature, idx) => (
                    <div key={idx} className="p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-all">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-gray-950 border-t border-gray-900 py-12 text-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-lg">SafeLink</span>
                </div>
                <p className="text-gray-500 max-w-xs">
                    Building a safer internet, one link at a time. Open source and community driven.
                </p>
                <div className="flex gap-4 mt-6">
                    <a href="https://x.com/_josephmusenge" className="text-gray-500 hover:text-white"><Twitter className="w-5 h-5" /></a>
                    <a href="https://github.com/JosephMusenge/SafeLink-HoverGuard" className="text-gray-500 hover:text-white"><Github className="w-5 h-5" /></a>
                    <a href="https://www.linkedin.com/in/joseph-musenge/" className="text-gray-500 hover:text-white"><Linkedin className="w-5 h-5" /></a>
                </div>
            </div>
            
            <div>
                <h4 className="font-bold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-gray-500">
                    <li><a href="#" className="hover:text-blue-400">Download</a></li>
                    <li><a href="#" className="hover:text-blue-400">Changelog</a></li>
                    <li><a href="https://github.com/JosephMusenge/SafeLink-HoverGuard" className="hover:text-blue-400">Source Code</a></li>
                </ul>
            </div>
            
            <div>
                <h4 className="font-bold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-500">
                    <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-blue-400">Contact Security</a></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-gray-900 text-center text-gray-600">
            © 2025 SafeLink HoverGuard. All rights reserved.
        </div>
      </footer>
    </div>
  );
}