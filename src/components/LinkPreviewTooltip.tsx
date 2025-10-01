import { Copy, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LinkPreviewTooltipProps {
  url: string;
  onClose: () => void;
  style?: React.CSSProperties;
  // title: string;
  // targetDomain: string;
  // finalUrl: string;
  // httpStatus: number;
  // signals: string[];
  // isSuspicious: boolean;
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
        // Simulate API call (replace with real API like Google Safe Browsing)
        const response = await fetch(`https://api.example.com/check?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch link data');
        const data = await response.json();

        setPreviewData({
          title: '🔎 Link Preview',
          targetDomain: new URL(url).hostname,
          finalUrl: url,
          httpStatus: data.httpStatus || 200,
          signals: data.signals || ['HTTPS enabled'],
          isSuspicious: data.isSuspicious || false,
          loading: false,
        });
      } catch (err) {
        setPreviewData({
          title: '🔎 Link Preview',
          targetDomain: new URL(url).hostname,
          finalUrl: url,
          httpStatus: 0,
          signals: ['Error fetching data'],
          isSuspicious: true,
          loading: false,
          error: err instanceof Error ? err.message : 'An unknown error occurred', // explicit check for Error type
        });
      }
    };

    fetchLinkData();
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
