type ThreatType = 'MALWARE' | 'SOCIAL_ENGINEERING' | 'UNWANTED_SOFTWARE' | 'POTENTIALLY_HARMFUL_APPLICATION';

interface LinkAnalysis {
  url: string;
  domain: string;
  isSafe: boolean;
  threats: string[];
  status: 'safe' | 'suspicious' | 'malicious' | 'unknown';
  httpStatus?: number;
}

class SafeBrowsingService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async checkUrl(url: string): Promise<LinkAnalysis> {
    try {
      const domain = new URL(url).hostname;
      let httpStatus = 0;
      try {
        const headResponse = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        httpStatus = headResponse.status || 0;
      } catch (headErr) {
        console.warn('HEAD request failed:', headErr);
      }

      const requestBody = {
        client: { clientId: "safelink-hoverguard", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      };

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const data = await response.json();
      return this.parseResponse(url, domain, data, httpStatus);
    } catch (error) {
      console.error('Safe Browsing API error:', error);
      return { url, domain: new URL(url).hostname, isSafe: false, threats: ['API Error'], status: 'unknown' };
    }
  }

  private parseResponse(url: string, domain: string, data: { matches?: { threatType: ThreatType }[] }, httpStatus: number): LinkAnalysis {
    if (!data.matches || data.matches.length === 0) {
      return { url, domain, isSafe: true, threats: [], status: 'safe', httpStatus };
    }

    const threats = data.matches.map((match) => {
      switch (match.threatType) {
        case 'MALWARE': return 'Malware detected';
        case 'SOCIAL_ENGINEERING': return 'Phishing/Social engineering';
        case 'UNWANTED_SOFTWARE': return 'Unwanted software';
        case 'POTENTIALLY_HARMFUL_APPLICATION': return 'Potentially harmful app';
        default: return 'Unknown threat';
      }
    });

    return { url, domain, isSafe: false, threats, status: 'malicious', httpStatus };
  }
}

class LinkPreviewTooltip {
  private tooltip: HTMLElement | null = null;
  private safeBrowsingService: SafeBrowsingService;
  private currentRequest: AbortController | null = null;

  constructor(apiKey: string) {
    this.safeBrowsingService = new SafeBrowsingService(apiKey);
    this.init();
  }

  private init() {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  private handleMouseOver(e: MouseEvent) {
    const target = e.target as HTMLAnchorElement | null;
    if (target?.tagName === 'A' && target.href) {
      this.showTooltip(target.href, e.clientX, e.clientY);
    }
  }

  private handleMouseOut(e: MouseEvent) {
    const target = e.target as HTMLAnchorElement | null;
    if (target?.tagName === 'A') {
      this.hideTooltip();
    }
  }

  private async showTooltip(url: string, x: number, y: number) {
    if (this.currentRequest) this.currentRequest.abort();

    this.tooltip = this.createTooltipElement(x, y);
    document.body.appendChild(this.tooltip);
    this.updateTooltipContent(this.createLoadingContent());

    this.currentRequest = new AbortController();
    const updatePosition = (e: MouseEvent) => {
      if (this.tooltip) {
        this.tooltip.style.top = `${e.clientY + 10}px`;
        this.tooltip.style.left = `${e.clientX + 10}px`;
      }
    };
    document.addEventListener('mousemove', updatePosition);

    try {
      const linkData = await this.safeBrowsingService.checkUrl(url);
      if (!this.currentRequest.signal.aborted && this.tooltip) {
        this.updateTooltipContent(this.createContentHTML(linkData));
      }
    } catch (error) {
      if (!this.currentRequest?.signal.aborted && this.tooltip) {
        this.updateTooltipContent(this.createErrorContent());
      }
    } finally {
      document.removeEventListener('mousemove', updatePosition);
    }
  }

  private hideTooltip() {
    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  private createTooltipElement(x: number, y: number): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.className = 'safelink-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      top: ${y + 10}px;
      left: ${x + 10}px;
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      max-width: 300px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      color: white;
    `;
    return tooltip;
  }

  private updateTooltipContent(content: string) {
    if (this.tooltip) this.tooltip.innerHTML = content;
  }

  private createLoadingContent(): string {
    return `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 16px; height: 16px; border: 2px solid #374151; border-top: 2px solid #60a5fa; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span style="color: #9ca3af;">Checking link safety...</span>
      </div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    `;
  }

  private createContentHTML(linkData: LinkAnalysis): string {
    const statusColor = linkData.isSafe ? '#10b981' : '#ef4444';
    const statusIcon = linkData.isSafe ? '✅' : '⚠️';
    const statusText = linkData.isSafe ? 'Safe Link' : 'Suspicious Link';

    return `
      <div style="margin-bottom: 8px;">
        <h3 style="margin: 0; font-weight: 600; color: ${statusColor}; display: flex; align-items: center; gap: 4px;">
          ${statusIcon} ${statusText}
        </h3>
      </div>
      <div style="margin-bottom: 6px;">
        <span style="color: #9ca3af;">Domain:</span>
        <span style="color: white; margin-left: 4px;">${linkData.domain}</span>
      </div>
      ${linkData.threats.length > 0 ? `
        <div style="margin-bottom: 6px;">
          <span style="color: #9ca3af;">Threats:</span>
          <ul style="margin: 4px 0 0 0; padding-left: 16px; color: #ef4444;">
            ${linkData.threats.map(threat => `<li>${threat}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151; color: #6b7280; font-size: 10px;">
        Powered by Google Safe Browsing
      </div>
    `;
  }

  private createErrorContent(): string {
    return `
      <div style="color: #f59e0b;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600;">⚠️ Unable to Check</h3>
        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
          Could not verify link safety. Proceed with caution.
        </p>
      </div>
    `;
  }

  public destroy() {
    document.removeEventListener('mouseover', this.handleMouseOver.bind(this));
    document.removeEventListener('mouseout', this.handleMouseOut.bind(this));
    this.hideTooltip();
  }
}

// Initialize with API key from storage or fallback
chrome.storage.sync.get(['apiKey'], (result) => {
  const apiKey = result.apiKey || 'YOUR_API_KEY_HERE'; // Replace with secure storage in production
  if (apiKey) {
    const tooltipInstance = new LinkPreviewTooltip(apiKey);
  } else {
    console.error('API key not found in storage');
  }
});