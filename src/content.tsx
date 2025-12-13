import ReactDOM from 'react-dom/client';
import LinkPreviewTooltip from './components/LinkPreviewTooltip'; // Ensure path is correct
// Import your CSS so Vite includes it in the bundle
import cssStyles from './index.css?inline'; 

console.log('SafeLink: Content script loaded and running!');

const rootId = 'link-defender-root';

// Setup the Container
function getOrCreateRoot() {
  let rootElement = document.getElementById(rootId);
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = rootId;
    // Make sure the container itself doesn't block clicks when hidden
    rootElement.style.position = 'absolute';
    rootElement.style.top = '0';
    rootElement.style.left = '0';
    rootElement.style.zIndex = '2147483647'; // Max z-index
    rootElement.style.pointerEvents = 'none'; // Let clicks pass through
    document.body.appendChild(rootElement);
  }
  return rootElement;
}

const host = getOrCreateRoot();
// Setup Shadow DOM (Styles must be injected here to work!)
const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
// check if we already added styles to avoid duplicates
if (!shadow.querySelector('style')) {
  const style = document.createElement('style');
  // This puts the Tailwind CSS directly inside the shadow root
  style.textContent = cssStyles; 
  shadow.appendChild(style);
}

const mountPoint = document.createElement('div');
mountPoint.style.pointerEvents = 'auto'; 
mountPoint.style.display = 'block';

if (!shadow.contains(mountPoint)) {
  shadow.appendChild(mountPoint);
}

const reactRoot = ReactDOM.createRoot(mountPoint);
// Event Listeners
let currentHoveredLink: HTMLAnchorElement | null = null;
let lastMousePos = { x: 0, y: 0 };
let isTooltipVisible = false;
let hideTimer: any = null;

const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
};

const startHideTimer = () => {
  clearHideTimer();
  // Wait 500ms before closing. If user enters tooltip in this time, we cancel
  hideTimer = setTimeout(() => {
    hideTooltip();
  }, 500); 
};

const hideTooltip = () => {
  // if (!isTooltipVisible) return;
  currentHoveredLink = null;
  isTooltipVisible = false;
  reactRoot.render(
     <LinkPreviewTooltip visible={false} data={null} position={{x:0, y:0}} />
  );
};

const fetchAndShowTooltip = (link: HTMLAnchorElement, x: number, y: number) => {
  // Prevent duplicate requests if already showing
  if (isTooltipVisible) return; 
  
  console.log('SafeLink: Analyzing...', link.href);
  clearHideTimer();
  isTooltipVisible = true;

  // Render Loading State Immediately
  reactRoot.render(
    <LinkPreviewTooltip 
      visible={true} 
      data={{
        loading: true,
        safe: true,
        originalUrl: link.href,
        finalUrl: link.href,
        domain: new URL(link.href).hostname,
        status: 0,
        riskSignals: []
      }} 
      position={{ x, y }} 
    />
  );

  // Check if the extension context is still valid before sending
  if (!chrome.runtime?.id) {
    console.log('SafeLink: Extension was reloaded. Stopping request to avoid crash.');
    return;
  }

  // Fetch Data
  chrome.runtime.sendMessage(
    { type: 'CHECK_LINK', url: link.href },
    (response) => {
      // If the user moved away or let go of shift while fetching, don't render
      if (!currentHoveredLink || currentHoveredLink !== link) return;

      if (chrome.runtime.lastError) {
        console.error('SafeLink: Message Error:', chrome.runtime.lastError);
        return;
      }
      
      // Render Actual Result
      reactRoot.render(
        <LinkPreviewTooltip 
          visible={true} 
          data={response} 
          position={{ x, y }} 
        />
      );
    }
  );
};

// if mouse enters the Tooltip itself, cancel the hide timer
mountPoint.addEventListener('mouseenter', () => {
  clearHideTimer();
});

// if mouse leaves the Tooltip, restart the hide timer
mountPoint.addEventListener('mouseleave', () => {
  startHideTimer();
});

// event listeners
// track mouse position 
document.addEventListener('mousemove', (e) => {
  lastMousePos = { x: e.pageX, y: e.pageY };
});

// Handle Key Presses (The "Peek" Trigger)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Shift' && currentHoveredLink) {
    clearHideTimer();
    fetchAndShowTooltip(currentHoveredLink, lastMousePos.x, lastMousePos.y);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') {
    hideTooltip();
  }
});

// handle link hovering
document.addEventListener('mouseover', (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest('a');

  if (link && link.href) {
    // ignore internal links or empty links
    if (link.href.startsWith('#') || link.href.startsWith('javascript')) return;

    clearHideTimer();
    currentHoveredLink = link;
    // immediately show if shift is held down
    if (e.shiftKey) {
      fetchAndShowTooltip(link, e.clientX, e.clientY);
    }
  }
});

document.addEventListener('mouseout', (e) => {
    // Only clear if we actually left the link
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    // ignore if moving into child elem of same link
    if (link && link === currentHoveredLink && link.contains(e.relatedTarget as Node)) {
      return;
    }

    if (link === currentHoveredLink) {
      startHideTimer();
    }
});