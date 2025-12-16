const API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY || '';
const CACHE_DURATION_MS = 15 * 60 * 1000; 
const scanCache = new Map<string, { result: any, timestamp: number }>();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_LINK') {
    // We must return true to indicate we will respond asynchronously
    handleLinkCheck(request.url).then(sendResponse);
    return true; 
  }
});

// call python server
async function checkLocalML(url: string) {
  try {
    console.log("Attempting to contact Python Server...");
    // send the URL to our flask server
    const response = await fetch('https://safelink-hoverguard.onrender.com/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    // if the Python server isn't running, just silently fail (don't break the extension)
    console.log('ML Server offline');
    return null;
  }
}

// helper func to check if domain is whitelisted
async function isWhitelisted(url: string): Promise<boolean> {
  try {
    const domain = new URL(url).hostname;
    const { whitelist } = await chrome.storage.local.get('whitelist');
    
    if (!whitelist || !Array.isArray(whitelist)) return false;

    return whitelist.some(trusted => domain === trusted || domain.endsWith('.' + trusted));
  } catch (e) {
    return false;
  }
}

// helper func to determine if a redirect is actually risky
function isSuspiciousRedirect(original: string, final: string): boolean {
  try {
    const u1 = new URL(original);
    const u2 = new URL(final);

    if (u1.hostname !== u2.hostname) {
        // Exception: www vs non-www on same domain is usually fine
        const h1 = u1.hostname.replace(/^www\./, '');
        const h2 = u2.hostname.replace(/^www\./, '');
        if (h1 !== h2) return true; 
    }
    // Normalize paths by stripping trailing slash
    const path1 = u1.pathname.replace(/\/$/, '');
    const path2 = u2.pathname.replace(/\/$/, '');

    // If path is effectively the same, it's SAFE
    if (path1 === path2) return false;

    return false; 

  } catch (e) {
    return true;
  }
}

// helper func to unwrap microsoft safeLinks to analyze real destination
function unwrapMicrosoftSafeLink(url: string): string {
  try {
    const urlObj = new URL(url);
    // check for common SafeLink domains
    if (urlObj.hostname.includes('safelinks.protection.outlook.com') || 
        urlObj.hostname.includes('safelinks.protection.office365.com')) {
      
      const realUrl = urlObj.searchParams.get('url');
      if (realUrl) {
        console.log('SafeLink Detected! Unwrapped to:', realUrl);
        return realUrl; 
      }
    }
  } catch (e) {
    // if parsing fails, just analyze the original
  }
  return url;
}

async function handleLinkCheck(url: string) {
  const targetUrl = unwrapMicrosoftSafeLink(url);
  // kill switch timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  const isTrusted = await isWhitelisted(targetUrl);
  if (isTrusted) {
    return {
      loading: false,
      safe: true,
      domain: new URL(targetUrl).hostname,
      originalUrl: url,
      finalUrl: targetUrl,
      status: 200,
      riskSignals: []
    };
  }

  // check if we scanned this exact URL recently
  const cached = scanCache.get(targetUrl);
  if (cached) {
    const isFresh = (Date.now() - cached.timestamp) < CACHE_DURATION_MS;
    if (isFresh) {
      console.log('Serving from Cache:', targetUrl);
      return { ...cached.result, loading: false }; // Return cached data instantly
    } else {
      // Cache expired, delete it
      scanCache.delete(targetUrl);
    }
  }

  try {
    const domain = new URL(targetUrl).hostname;
    let finalUrl = targetUrl;
    let status = 0;
    let isHttps = targetUrl.startsWith('https://');
    let riskSignals: string[] = [];
    let networkFailed = false;

    try {
        const response = await fetch(targetUrl, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
        clearTimeout(timeoutId);

        finalUrl = response.url;
        status = response.status;
        isHttps = finalUrl.startsWith('https://');
        
    } catch (e: any) {
        clearTimeout(timeoutId);
        networkFailed = true;
        // If HEAD fails, we return a basic error state but still return data
        if (e.name === 'AbortError') {
          riskSignals.push('Site took too long to respond (Suspicious)');
        } else {
          // other network errors
          riskSignals.push('Could not reach site (Network Error)');
        }
    }

    // run security checks even if network failed
    if (!networkFailed && !isHttps) riskSignals.push('Not Secure (HTTP only)');

    if (!networkFailed && finalUrl !== targetUrl && isSuspiciousRedirect(targetUrl, finalUrl)) {
      riskSignals.push('Redirected from original link');
    }

    // AI analysis check - check the FINAL url
    const mlResult = await checkLocalML(finalUrl);
    
    if (mlResult && mlResult.is_phishing) {
        // only warn if confidence is high (> 60%)
        if (mlResult.confidence_score > 60) {
            riskSignals.push(`AI Flagged: ${mlResult.confidence_score.toFixed(0)}% Phishing Confidence`);
        }
    }

    // Google Safe Browsing Check
    const isSafe = await checkSafeBrowsing(finalUrl);
    if (!isSafe) riskSignals.push('Flagged by Google Safe Browsing');

    const finalResult = {
      loading: false,
      safe: riskSignals.length === 0,
      domain: new URL(finalUrl).hostname,
      originalUrl: url,
      finalUrl: finalUrl,
      status: status,
      riskSignals: riskSignals
    };
    // only cache if it wasn't a network error
    if (!networkFailed) {
        scanCache.set(targetUrl, { result: finalResult, timestamp: Date.now() });
    }

    return finalResult;

  } catch (error) {
    return { 
        loading: false, 
        safe: false, 
        originalUrl: url, 
        domain: 'error',
        riskSignals: ['Analysis Failed'] 
    };
  }
}

async function checkSafeBrowsing(url: string): Promise<boolean> {
  if (!API_KEY) return true; // Skip if no key

  const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;
  const requestBody = {
    client: { clientId: "safelink-hoverguard", clientVersion: "1.0.0" },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    // If matches is found, it is NOT safe
    return !data.matches || data.matches.length === 0;
  } catch (e) {
    console.error('Safe Browsing Error', e);
    return true; // Fail open (assume safe if API fails) to avoid blocking user
  }
}