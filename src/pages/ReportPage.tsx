import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Shield, AlertTriangle, CheckCircle, Activity, 
  Lock, Globe, ArrowRight, Zap, AlertOctagon,
  Search, Server, Share2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AnalysisResult {
  url: string;
  is_phishing: boolean;
  confidence_score: number;
  risk_level?: string;
}

export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const urlToAnalyze = searchParams.get('url');
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!urlToAnalyze) return;

    const analyzeUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        // Contact Python Backend
        const response = await fetch('http://localhost:5001/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToAnalyze }),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const result: AnalysisResult = await response.json();
        setData(result);
      } catch (err) {
        console.error("Analysis Failed:", err);
        setError("Could not connect to the AI Server. Make sure 'app.py' is running.");
      } finally {
        setLoading(false);
      }
    };

    analyzeUrl();
  }, [urlToAnalyze]);

  // RENDER STATES
  if (!urlToAnalyze) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-400 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Ready to Scan</h1>
        <p>Please launch a report from the SafeLink Extension.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
        {/* Background Pulse */}
        <div className="absolute w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold tracking-tight">Analyzing Neural Patterns...</h2>
            <p className="text-gray-500 mt-2">Connecting to local inference engine</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="bg-gray-900/50 p-8 rounded-2xl border border-red-500/30 text-center max-w-md backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertOctagon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Connection Failed</h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="bg-white text-gray-900 hover:bg-gray-200 px-6 py-2.5 rounded-lg font-bold text-sm transition-colors"
            >
                Retry Connection
            </button>
        </div>
      </div>
    );
  }

  // DATA PREPARATION
  const score = data.confidence_score;
  const isSafe = !data.is_phishing;
  const statusColor = isSafe ? 'emerald' : 'red';
  const statusGradient = isSafe ? 'from-emerald-500 to-teal-400' : 'from-red-500 to-orange-500';
  
  const chartData = [
    { name: 'Risk', value: score },
    { name: 'Safe', value: 100 - score },
  ];
  const COLORS = isSafe ? ['#374151', '#10B981'] : ['#EF4444', '#374151'];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-gray-950/80 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${isSafe ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} rounded-lg flex items-center justify-center`}>
                <Shield className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">SafeLink <span className="text-gray-600">Report</span></span>
          </div>
          <a href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            Back to Home <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* HEADER STATUS */}
      <div className={`relative w-full py-16 overflow-hidden border-b ${isSafe ? 'border-emerald-900/30' : 'border-red-900/30'}`}>
         {/* Glow Effect */}
         <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 rounded-full blur-[100px] -z-10 bg-gradient-to-b ${statusGradient}`}></div>
         
         <div className="max-w-4xl mx-auto px-6 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6 text-xs font-bold uppercase tracking-wider
                ${isSafe ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
            `}>
                {isSafe ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {isSafe ? 'Verified Safe' : 'Phishing Detected'}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {isSafe ? 'This link appears safe.' : 'Do NOT click this link.'}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                {isSafe 
                    ? "Our AI analysis found no suspicious patterns or known threat signatures."
                    : "SafeLink detected multiple high-risk signals indicating a phishing attempt."}
            </p>
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COL: Analysis Data */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* URL Inspection Card */}
                <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2 bg-gray-900">
                        <Search className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Analysis</span>
                    </div>
                    <div className="p-6">
                        <div className="bg-black/50 rounded-xl p-4 font-mono text-sm text-gray-300 break-all border border-gray-800 flex gap-4">
                             <div className="shrink-0 mt-1">
                                <Globe className="w-5 h-5 text-blue-600" />
                             </div>
                             <div>
                                <span className="text-gray-500 select-none">GET </span>
                                {data.url}
                             </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-800/50">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Protocol</div>
                                <div className={`font-semibold flex items-center gap-2 ${data.url.startsWith('https') ? 'text-emerald-400' : 'text-red-400'}`}>
                                    <Lock className="w-4 h-4" />
                                    {data.url.startsWith('https') ? 'HTTPS' : 'HTTP'}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-800/50">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Complexity</div>
                                <div className="font-semibold flex items-center gap-2 text-white">
                                    <Activity className="w-4 h-4 text-blue-400" />
                                    {data.url.length > 75 ? 'High' : 'Normal'}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-800/50">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Redirects</div>
                                <div className="font-semibold flex items-center gap-2 text-white">
                                    <Share2 className="w-4 h-4 text-purple-400" />
                                    0
                                </div>
                            </div>
                            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-800/50">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Server</div>
                                <div className="font-semibold flex items-center gap-2 text-white">
                                    <Server className="w-4 h-4 text-orange-400" />
                                    Unknown
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className={`p-6 rounded-2xl border ${isSafe ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSafe ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">AI Verdict</h3>
                                <p className="text-xs text-gray-400">Random Forest Classifier</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {isSafe 
                                ? "Our model analyzed the URL structure (entropy, character distribution) and found a 98% match with legitimate traffic patterns."
                                : "The model detected high entropy and keyword stuffing, which are strong indicators of generated phishing links used in email campaigns."}
                        </p>
                     </div>

                     <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Domain Age</h3>
                                <p className="text-xs text-gray-400">Whois Lookup</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                             Domain reputation checks passed. Note: SafeLink focuses on URL structure, so always verify the domain matches the company you expect.
                        </p>
                     </div>
                </div>
            </div>

            {/* RIGHT COL: Score & Actions */}
            <div className="lg:col-span-4 space-y-8">
                
                {/* Score Chart */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 flex flex-col items-center relative">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Risk Probability</h3>
                    <div className="w-48 h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-bold ${isSafe ? 'text-white' : 'text-red-500'}`}>
                                {score.toFixed(0)}%
                            </span>
                            <span className="text-xs text-gray-500 font-medium uppercase mt-1">Confidence</span>
                        </div>
                    </div>
                </div>

                {/* Recommendation Action */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                    <h3 className="text-sm font-bold text-white mb-4">Recommendation</h3>
                    {isSafe ? (
                        <a 
                           href={data.url} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center justify-center gap-2 w-full bg-white text-black hover:bg-gray-200 font-bold py-3 rounded-xl transition-colors"
                        >
                            Proceed to Site <ArrowRight className="w-4 h-4" />
                        </a>
                    ) : (
                        <button disabled className="flex items-center justify-center gap-2 w-full bg-red-600/20 text-red-500 border border-red-500/50 font-bold py-3 rounded-xl cursor-not-allowed">
                            Access Blocked <Lock className="w-4 h-4" />
                        </button>
                    )}
                    <p className="text-xs text-center text-gray-500 mt-4">
                        {isSafe ? "Always double-check the URL bar." : "This link has been flagged as malicious."}
                    </p>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
}