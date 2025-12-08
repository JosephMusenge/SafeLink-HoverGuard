import { useState, useEffect } from 'react';
import LinkPreviewTooltip, { LinkSafetyData } from './components/LinkPreviewTooltip'; 

function App() {
  const [activeTooltip, setActiveTooltip] = useState<{ url: string; x: number; y: number } | null>(null);
  const [previewData, setPreviewData] = useState<LinkSafetyData | null>(null);

  // 1. Detect Hover
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof HTMLAnchorElement && target.href) {
        setActiveTooltip({ url: target.href, x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseOut = () => {
      setActiveTooltip(null);
      setPreviewData(null); // Reset data when mouse leaves
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  // Simulate Data Fetching (Demo Mode)
  // Since this is just the popup/demo app, we simulate the background script's job
  useEffect(() => {
    if (activeTooltip) {
      // A. Start with loading state
      setPreviewData({
        safe: true,
        originalUrl: activeTooltip.url,
        finalUrl: activeTooltip.url,
        domain: new URL(activeTooltip.url).hostname,
        status: 0,
        riskSignals: [],
        loading: true
      });

      // B. After 500ms, show "Fake" result for demo purposes
      const timer = setTimeout(() => {
        setPreviewData({
          safe: true,
          originalUrl: activeTooltip.url,
          finalUrl: activeTooltip.url,
          domain: new URL(activeTooltip.url).hostname,
          status: 200,
          riskSignals: [], // Add strings here to test warning styles
          loading: false
        });
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [activeTooltip]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      {/* 3. The New Component Usage */}
      <LinkPreviewTooltip
        visible={!!activeTooltip}
        data={previewData}
        position={activeTooltip ? { x: activeTooltip.x, y: activeTooltip.y } : { x: 0, y: 0 }}
      />

      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">SafeLink HoverGuard</h1>
          <p className="text-gray-400 text-lg">Chrome Extension - Dynamic Link Preview for Safer Browsing</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Instructions</h3>
          <p className="text-gray-400">
            Hover over any link on a webpage to see a dynamic preview of its details. 
            <br />
            <span className="text-sm text-gray-500">(Try hovering the links below to test the UI)</span>
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Features</h3>
          <ul className="text-gray-400 space-y-2 list-disc list-inside">
            <li><a href="https://google.com" className="text-blue-400 hover:underline">Dynamic link preview</a> on hover for any URL</li>
            <li><a href="https://example.com" className="text-blue-400 hover:underline">Real-time domain</a> and status inspection</li>
            <li>HTTP status code and security signals</li>
            <li>Quick copy URL functionality</li>
            <li>Dark theme with accessible design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;