const API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY || '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_LINK') {
    // We must return true to indicate we will respond asynchronously
    handleLinkCheck(request.url).then(sendResponse);
    return true; 
  }
});

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
    return true; // If we can't parse URLs, assume suspicious
  }
}

async function handleLinkCheck(url: string) {
  try {
    const domain = new URL(url).hostname;
    
    // Perform HEAD request to check for redirects and status
    let response;
    try {
        response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    } catch (e) {
        // If HEAD fails, we return a basic error state but still return data
        return {
            loading: false,
            safe: false,
            domain: domain,
            originalUrl: url,
            finalUrl: url,
            status: 0,
            riskSignals: ['Could not reach site (Network Error)']
        };
    }

    const finalUrl = response.url;
    const status = response.status;
    const isHttps = finalUrl.startsWith('https://');
    
    const riskSignals: string[] = [];
    if (!isHttps) riskSignals.push('Not Secure (HTTP only)');

    if (finalUrl !== url && isSuspiciousRedirect(url, finalUrl)) {
        riskSignals.push('Redirected from original link');
    }

    // Google Safe Browsing Check
    const isSafe = await checkSafeBrowsing(finalUrl);
    if (!isSafe) riskSignals.push('Flagged by Google Safe Browsing');

    return {
      loading: false,
      safe: riskSignals.length === 0,
      domain: new URL(finalUrl).hostname,
      originalUrl: url,
      finalUrl: finalUrl,
      status: status,
      riskSignals: riskSignals
    };

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