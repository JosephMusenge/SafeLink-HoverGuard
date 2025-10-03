import { Copy, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LinkPreviewTooltipProps {
  url: string;
  onClose: () => void;
  style?: React.CSSProperties;
}

export default function LinkPreviewTooltip({ url, onClose }: LinkPreviewTooltipProps) {
  const [previewData, setPreviewData] = useState<{
    title?: string;
    targetDomain?: string;
    finalUrl?: string;
    httpStatus?: number;
    signals?: string[];
    isSuspicious?: boolean;
    loading?: boolean;
    error?: string;
  }>({ loading: true });

  useEffect(() => {
    const fetchLinkData = async () => {
      try {
        const targetDomain = new URL(url).hostname;
        const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
        const clientId = 'safelink_project_key1';
        
        // Step 1: Basic HTTP status check (optional, via HEAD request)
        let httpStatus = 0;
        try {
          const headResponse = await fetch(url, { method: 'HEAD' });
          httpStatus = headResponse.status;
        } catch (headErr) {
          console.warn('HEAD request failed (CORS may block this):', headErr);
          httpStatus = 0; // Fallback
        }

        // Step 2: Google Safe Browsing API call
        const threatLists = [
          'PHISH_LIST',      // Phishing sites
          'MALWARE_LIST',    // Malware sites
          'SOCIAL_ENGINEERING_LIST', // Social engineering
          'HARMFUL_APPS_LIST'        // Harmful apps
        ];

        const requestBody = {
          client: {
            clientId: clientId,
            clientVersion: '1.0.0' // Your extension version
          },
          threatInfo: {
            threatTypes: threatLists,
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [
              { url: url }
            ]
          }
        };

        const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const isSuspicious = data.matches && data.matches.length > 0;
        const signals: string[] = [];

        // Build signals based on API response and HTTP status
        if (httpStatus >= 200 && httpStatus < 300) {
          signals.push('Valid HTTP response');
        } else if (httpStatus >= 300 && httpStatus < 400) {
          signals.push('Redirect detected');
        } else {
          signals.push('HTTP error or unreachable');
        }

        if (url.startsWith('https://')) {
          signals.push('HTTPS enabled');
        } else {
          signals.push('HTTP (insecure)');
        }

        if (isSuspicious) {
          signals.push('Threat detected by Google Safe Browsing');
          data.matches.forEach((match: any) => {
            signals.push(`- ${match.threatType} on ${match.threat.platformType}`);
          });
        } else {
          signals.push('No known threats');
        }

        setPreviewData({
          title: '🔎 Link Preview',
          targetDomain,
          finalUrl: url,
          httpStatus,
          signals,
          isSuspicious,
          loading: false,
        });
      } catch (err) {
        console.error('Safe Browsing API error:', err);
        setPreviewData({
          title: '🔎 Link Preview',
          targetDomain: new URL(url).hostname,
          finalUrl: url,
          httpStatus: 0,
          signals: ['Error: Unable to check (network/API issue)'],
          isSuspicious: true, // Treat errors conservatively
          loading: false,
          error: err instanceof Error ? err.message : 'An unknown error occurred',
        });
      }
    };

    if (url) {
      fetchLinkData();
    }
  }, [url]);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewData.finalUrl || url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // const handleClose = () => {
  //   const tooltip = document.activeElement?.closest('[role="tooltip"]') as HTMLElement;
  //   if (tooltip) {
  //     tooltip.style.display = 'none';
  //   }
  // };

  const getStatusColor = (status: number) => {
    if (status === undefined || status === 0) return 'text-red-400';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!previewData.loading && !previewData.targetDomain) return null;

  return (
    <div
      role="tooltip"
      className={`
        hidden fixed z-[9999] w-80
        bg-gray-900 rounded-lg shadow-2xl
        border-2 transition-all
        ${previewData.isSuspicious ? 'border-orange-500' : 'border-gray-700'}
        ${previewData.loading ? 'opacity-70' : 'opacity-100'}
      `}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            {previewData.title}
            {previewData.isSuspicious ? (
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Target Domain
            </label>
            <p className="text-sm text-white font-mono mt-1 break-all">
              {previewData.targetDomain}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Final URL
            </label>
            <p className="text-xs text-gray-300 font-mono mt-1 break-all bg-gray-800 p-2 rounded">
              {previewData.finalUrl || 'loading...'}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              HTTP Status
            </label>
            <p className={`text-sm font-semibold mt-1 ${getStatusColor(previewData.httpStatus ?? 0)}`}>
              {previewData.httpStatus !== undefined ? previewData.httpStatus : 'loading...'}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">
              Signals
            </label>
            <ul className="space-y-1">
              {(previewData.signals || ['loading...']).map((signal, index) => (
                <li
                  key={index}
                  className={`text-xs flex items-center gap-2 ${
                    previewData.isSuspicious ? 'text-orange-300' : 'text-gray-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    previewData.isSuspicious ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 p-3 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
          aria-label="Copy URL"
        >
          <Copy className="w-4 h-4" />
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
          aria-label="Close tooltip"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
