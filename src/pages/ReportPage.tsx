import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, Activity, Lock, Globe, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// shape of the data we expect from the Python Backend
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

        // contact your Real Python Backend
        const response = await fetch('http://localhost:5001/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: urlToAnalyze }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

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
      <div className="min-h-screen bg-gray-900 text-gray-400 flex items-center justify-center">
        <p>No URL provided. Please launch this page from the Extension.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">Consulting Neural Network...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl border border-red-500/50 text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm transition-colors"
            >
                Try Again
            </button>
        </div>
      </div>
    );
  }

  // DATA PREPARATION
  const score = data.confidence_score; 
  // If score > 50, it is phishing.
  const isSafe = !data.is_phishing;
  
  // data for the donut chart
  const chartData = [
    { name: 'Risk', value: score },
    { name: 'Safe', value: 100 - score },
  ];
  const COLORS = isSafe ? ['#374151', '#10B981'] : ['#EF4444', '#374151']; // green dominant if safe, Red dominant if risky

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30">
      
      {/* HEADER */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-xl tracking-tight">SafeLink <span className="text-blue-500">HoverGuard</span></span>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Back to Home</a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* HERO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            
            {/* 1. SCORE CARD */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl relative overflow-hidden flex flex-col items-center">
                <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Phishing Probability</h2>
                
                <div className="h-48 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                startAngle={180}
                                endAngle={0}
                                cy="70%"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Text in Donut */}
                    <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-4">
                        <span className={`text-5xl font-bold ${isSafe ? 'text-emerald-400' : 'text-red-500'}`}>
                            {score.toFixed(0)}%
                        </span>
                    </div>
                </div>
                
                <div className="text-center mt-[-20px]">
                    <p className={`text-lg font-medium ${isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isSafe ? 'Likely Safe' : 'High Risk Detected'}
                    </p>
                </div>
            </div>

            {/* 2. TARGET INFO CARD */}
            <div className="md:col-span-2 bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl flex flex-col justify-center">
                 <div className="mb-6">
                    <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Analyzed Target</h2>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 font-mono text-sm break-all text-blue-300 flex items-start gap-3">
                        <Globe className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                        <span>{data.url}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    {/* Feature 1: Protocol */}
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-gray-300">Protocol</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                           {data.url.startsWith('https') ? 'HTTPS (Encrypted)' : 'HTTP (Unsecure)'}
                        </p>
                    </div>

                    {/* Feature 2: Length Analysis */}
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                         <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-semibold text-gray-300">Complexity</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                           {data.url.length > 75 ? 'High (Suspicious)' : 'Normal'}
                        </p>
                    </div>
                 </div>
            </div>
        </div>

        {/* EDUCATIONAL BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Why was this flagged? */}
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${isSafe ? 'text-emerald-500' : 'text-yellow-500'}`} />
                    Analysis Report
                </h3>
                <ul className="space-y-4">
                    {/* Dynamic List Items based on score */}
                    {!isSafe ? (
                        <>
                            <li className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center shrink-0 border border-red-500/30 text-red-500 font-bold">!</div>
                                <div>
                                    <h4 className="font-bold text-gray-200">High Confidence Match</h4>
                                    <p className="text-sm text-gray-400 mt-1">Our Random Forest model is <strong>{score.toFixed(0)}%</strong> certain this URL matches patterns found in known phishing attacks.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center shrink-0 border border-red-500/30 text-red-500 font-bold">!</div>
                                <div>
                                    <h4 className="font-bold text-gray-200">Lexical Anomalies</h4>
                                    <p className="text-sm text-gray-400 mt-1">The URL likely contains excessive special characters (like hyphens or dots) or resembles a "typosquatted" domain.</p>
                                </div>
                            </li>
                        </>
                    ) : (
                         <li className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-500/30 text-emerald-500 font-bold">✓</div>
                            <div>
                                <h4 className="font-bold text-gray-200">Clean URL Structure</h4>
                                <p className="text-sm text-gray-400 mt-1">The domain structure appears standard and lacks the chaotic randomness usually seen in generated phishing links.</p>
                            </div>
                        </li>
                    )}
                </ul>
            </div>

            {/* Recommendation Box */}
            <div className={`rounded-2xl p-8 border ${isSafe ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                <h3 className="text-xl font-bold text-white mb-6">Recommendation</h3>
                
                {isSafe ? (
                     <p className="text-gray-300 leading-relaxed">
                        This link appears safe to visit. However, security tools are not perfect. Always verify the website content matches what you expect.
                        <br/><br/>
                        <a 
                          href={data.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Proceed to Site <ArrowRight className="w-4 h-4" />
                        </a>
                     </p>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            <strong className="text-red-400">Do not click this link.</strong> It exhibits strong indicators of a phishing attempt designed to steal credentials.
                        </p>
                        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 text-red-200 text-sm">
                            <strong>Cybersecurity Tip:</strong> Check the "From" address in your email. Does it match the company? Hackers often use "Urgency" (e.g., "Account Locked") to make you panic.
                        </div>
                    </div>
                )}
            </div>

        </div>

      </main>
    </div>
  );
}