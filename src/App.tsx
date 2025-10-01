import { useState, useEffect } from 'react';
import LinkPreviewTooltip from './components/LinkPreviewTooltip';

function App() {
  // const [showDemo, setShowDemo] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<{ url: string; x: number; y: number } | null>(null);

  // Inject content script logic into the page
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof HTMLAnchorElement && target.href) {
        setActiveTooltip({ url: target.href, x: e.clientX, y: e.clientY });
      }
    };
    // const handleMouseOver = (e: MouseEvent) => {
    //   const target = e.target as HTMLElement;
    //   if (target.tagName === 'A' && target.href) {
    //     setActiveTooltip({ url: target.href, x: e.clientX, y: e.clientY });
    //   }
    // };

    const handleMouseOut = () => {
      setActiveTooltip(null);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  // const demoLinkSafe = {
  //   title: '🔎 Link Preview',
  //   targetDomain: 'example.com',
  //   finalUrl: 'https://example.com/page',
  //   httpStatus: 200,
  //   signals: ['HTTPS enabled', 'Valid certificate', 'Known domain'],
  //   isSuspicious: false
  // };

  // const demoLinkSuspicious = {
  //   title: '🔎 Link Preview',
  //   targetDomain: 'suspicious-site.xyz',
  //   finalUrl: 'https://suspicious-site.xyz/phishing',
  //   httpStatus: 302,
  //   signals: ['Multiple redirects', 'Recently registered domain', 'Suspicious TLD'],
  //   isSuspicious: true
  // };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      {activeTooltip && (
        <LinkPreviewTooltip
          url={activeTooltip.url}
          onClose={() => setActiveTooltip(null)}
          style={{
            position: 'absolute',
            top: `${activeTooltip.y + 10}px`,
            left: `${activeTooltip.x + 10}px`,
          }}
        />
      )}
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">SafeLink HoverGuard</h1>
          <p className="text-gray-400 text-lg">Chrome Extension - Dynamic Link Preview for Safer Browsing</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Instructions</h3>
          <p className="text-gray-400">
            Hover over any link on a webpage to see a dynamic preview of its details. The tooltip will fetch and display real-time information.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Features</h3>
          <ul className="text-gray-400 space-y-2 list-disc list-inside">
            <li>Dynamic link preview on hover for any URL</li>
            <li>Real-time domain and status inspection</li>
            <li>HTTP status code and security signals</li>
            <li>Quick copy URL functionality</li>
            <li>Dark theme with accessible design</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
  //     <div className="max-w-4xl w-full space-y-8">
  //       <div className="text-center space-y-4">
  //         <h1 className="text-4xl font-bold text-white">Link Defender</h1>
  //         <p className="text-gray-400 text-lg">Chrome Extension - Link Preview Tooltip Demo</p>
  //       </div>

  //       <div className="grid md:grid-cols-2 gap-8">
  //         <div className="bg-gray-800 rounded-lg p-6 space-y-4">
  //           <h2 className="text-xl font-semibold text-white">Safe Link</h2>
  //           <p className="text-gray-400 text-sm">Hover over the link below to see the preview</p>
  //           <div className="relative">
  //             <a
  //               href="#"
  //               className="text-blue-400 hover:text-blue-300 underline"
  //               onMouseEnter={(e) => {
  //                 const rect = e.currentTarget.getBoundingClientRect();
  //                 const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
  //                 if (tooltip) {
  //                   tooltip.style.display = 'block';
  //                   tooltip.style.top = `${rect.bottom + 8}px`;
  //                   tooltip.style.left = `${rect.left}px`;
  //                 }
  //               }}
  //               onMouseLeave={(e) => {
  //                 const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
  //                 if (tooltip) {
  //                   tooltip.style.display = 'none';
  //                 }
  //               }}
  //             >
  //               Visit Example.com
  //             </a>
  //             <LinkPreviewTooltip {...demoLinkSafe} />
  //           </div>
  //         </div>

  //         <div className="bg-gray-800 rounded-lg p-6 space-y-4">
  //           <h2 className="text-xl font-semibold text-white">Suspicious Link</h2>
  //           <p className="text-gray-400 text-sm">Hover over the link below to see the warning</p>
  //           <div className="relative">
  //             <a
  //               href="#"
  //               className="text-red-400 hover:text-red-300 underline"
  //               onMouseEnter={(e) => {
  //                 const rect = e.currentTarget.getBoundingClientRect();
  //                 const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
  //                 if (tooltip) {
  //                   tooltip.style.display = 'block';
  //                   tooltip.style.top = `${rect.bottom + 8}px`;
  //                   tooltip.style.left = `${rect.left}px`;
  //                 }
  //               }}
  //               onMouseLeave={(e) => {
  //                 const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
  //                 if (tooltip) {
  //                   tooltip.style.display = 'none';
  //                 }
  //               }}
  //             >
  //               Visit Suspicious Site
  //             </a>
  //             <LinkPreviewTooltip {...demoLinkSuspicious} />
  //           </div>
  //         </div>
  //       </div>

  //       <div className="bg-gray-800 rounded-lg p-6 space-y-3">
  //         <h3 className="text-lg font-semibold text-white">Features</h3>
  //         <ul className="text-gray-400 space-y-2 list-disc list-inside">
  //           <li>Real-time link preview on hover</li>
  //           <li>Domain and final URL inspection</li>
  //           <li>HTTP status code display</li>
  //           <li>Security signals and warnings</li>
  //           <li>Quick copy URL functionality</li>
  //           <li>Dark theme with accessible design</li>
  //         </ul>
  //       </div>
  //     </div>
  //   </div>
  // );
}

export default App;
