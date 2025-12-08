import { Copy, X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  data: LinkSafetyData | null; // Data passed from parent
  position: { x: number; y: number };
}

export default function LinkPreviewTooltip({ visible, data, position }: LinkPreviewTooltipProps) {
  const [copied, setCopied] = useState(false);

  // If not visible or no data yet, don't render anything
  if (!visible || !data) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.finalUrl || data.originalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-gray-400'; // Unknown/Loading
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Safe vs Suspicious Styling
  const borderColor = data.safe ? 'border-gray-700' : 'border-orange-500';
  const icon = data.loading ? <Loader className="w-4 h-4 animate-spin text-blue-400" /> 
             : data.safe ? <CheckCircle className="w-4 h-4 text-green-500" /> 
             : <AlertTriangle className="w-4 h-4 text-orange-500" />;

  return (
    <div
      className={`fixed z-[9999] w-80 bg-gray-900 rounded-lg shadow-2xl border-2 transition-all ${borderColor}`}
      style={{
        top: position.y + 15, // Offset slightly from mouse
        left: position.x + 15,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            {data.loading ? 'Checking Link...' : 'Link Preview'}
            {icon}
          </h3>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Target Domain
            </label>
            <p className="text-sm text-white font-mono mt-1 break-all">
              {data.domain || '...'}
            </p>
          </div>

          {!data.loading && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Final URL
                </label>
                <p className="text-xs text-gray-300 font-mono mt-1 break-all bg-gray-800 p-2 rounded">
                  {data.finalUrl}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  HTTP Status
                </label>
                <p className={`text-sm font-semibold mt-1 ${getStatusColor(data.status)}`}>
                  {data.status === 0 ? '---' : data.status}
                </p>
              </div>

              {data.riskSignals.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">
                    Signals
                  </label>
                  <ul className="space-y-1">
                    {data.riskSignals.map((signal, index) => (
                      <li key={index} className="text-xs flex items-center gap-2 text-orange-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {!data.loading && (
        <div className="border-t border-gray-700 p-3 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      )}
    </div>
  );
}