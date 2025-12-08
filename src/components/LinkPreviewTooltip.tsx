import { Copy, CheckCircle, ShieldAlert, Loader, Globe, ArrowRight } from 'lucide-react';
import { useState } from 'react';

// This interface matches the data coming from background.ts
export interface LinkSafetyData {
  safe: boolean;
  originalUrl: string;
  finalUrl: string;
  status: number;
  riskSignals: string[];
  domain: string;
  loading: boolean;
  error?: string;
}

interface LinkPreviewTooltipProps {
  visible: boolean;
  data: LinkSafetyData | null; 
  position: { x: number; y: number };
}

export default function LinkPreviewTooltip({ visible, data, position }: LinkPreviewTooltipProps) {
  const [copied, setCopied] = useState(false);

  // If not visible or no data yet, don't render anything
  if (!visible || !data) return null;

  const isDangerous = !data.safe || data.riskSignals.length > 0 || (data.status >= 400);
  // Clean dark card, colored icons
  return (
    <div
      className="fixed z-[2147483647] bg-[#1f2937] text-white rounded-lg shadow-2xl border border-gray-700 overflow-hidden font-sans"
      style={{
        top: position.y + 24, // Slight gap from cursor
        left: position.x,
        width: '320px',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      {/* HEADER: Status & Icon */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${isDangerous ? 'border-red-900/50 bg-red-900/10' : 'border-gray-700'}`}>
        <div className="flex items-center gap-2.5">
          {data.loading ? (
            <Loader className="w-5 h-5 text-blue-400 animate-spin" />
          ) : isDangerous ? (
            <ShieldAlert className="w-5 h-5 text-red-500 fill-red-500/10" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
          )}
          
          <span className={`font-bold ${data.loading ? 'text-blue-400' : isDangerous ? 'text-red-400' : 'text-emerald-400'}`}>
            {data.loading ? 'Analyzing...' : isDangerous ? 'Suspicious Link' : 'Safe Link'}
          </span>
        </div>
        
        {!data.loading && (
           <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
             data.status >= 400 ? 'border-red-500 text-red-400' : 'border-emerald-500/30 text-emerald-400'
           }`}>
             HTTP {data.status}
           </span>
        )}
      </div>

      {/* CONTENT BODY */}
      <div className="p-4 space-y-3">
        
        {/* Domain Display */}
        <div className="flex items-start gap-3">
          <Globe className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Destination</p>
            <p className="text-white font-medium truncate">{data.domain}</p>
          </div>
        </div>

        {/* Redirect Warning */}
        {!data.loading && data.finalUrl !== data.originalUrl && (
          <div className="flex items-start gap-3">
            <ArrowRight className="w-4 h-4 text-orange-400 mt-1 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Redirects To</p>
              <p className="text-orange-300 font-medium truncate text-xs break-all">
                {new URL(data.finalUrl).hostname}
              </p>
            </div>
          </div>
        )}

        {/* Risk List (Only if dangerous) */}
        {!data.loading && isDangerous && data.riskSignals.length > 0 && (
          <div className="mt-2 bg-red-950/30 rounded border border-red-900/50 p-2.5">
            <ul className="space-y-1.5">
              {data.riskSignals.map((signal, idx) => (
                <li key={idx} className="text-xs text-red-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* ACTION FOOTER */}
      <div onClick={() => {
        navigator.clipboard.writeText(data.finalUrl || data.originalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }} 
      className="bg-gray-800/50 hover:bg-gray-800 px-4 py-2 border-t border-gray-700 cursor-pointer transition-colors flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white"
      >
        <Copy className="w-3 h-3" />
        {copied ? 'Copied to clipboard' : 'Click to copy full URL'}
      </div>
    </div>
  );
}