const API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY || '';

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
    // send the URL to our flask server
    const response = await fetch('http://localhost:5000/predict', {
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
  // kill switch timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    let finalUrl = url;
    let status = 0;
    let isHttps = url.startsWith('https://');
    let riskSignals: string[] = [];
    let networkFailed = false;

    try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
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

    if (!networkFailed && finalUrl !== url && isSuspiciousRedirect(url, finalUrl)) {
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