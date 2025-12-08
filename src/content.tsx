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
let currentTarget: HTMLAnchorElement | null = null;

document.addEventListener('mouseover', (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest('a');

  if (link && link.href) {
    // Ignore internal links or empty links
    if (link.href.startsWith('#') || link.href.startsWith('javascript')) return;

    if (link !== currentTarget) {
      currentTarget = link;
      console.log('SafeLink: Hover detected on:', link.href);

      // Send message to background
      chrome.runtime.sendMessage(
        { type: 'CHECK_LINK', url: link.href },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('SafeLink: Message Error:', chrome.runtime.lastError);
            return;
          }

          console.log('SafeLink: Data received:', response);
          
          // Render Tooltip
          reactRoot.render(
            <LinkPreviewTooltip 
              visible={true} 
              data={response} 
              position={{ x: e.pageX, y: e.pageY }} 
            />
          );
        }
      );
    }
  }
});

document.addEventListener('mouseout', (e) => {
    // Only clear if we actually left the link
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    // If we moved to a child element of the same link, don't hide
    if (link && link === currentTarget) return;

    currentTarget = null;
    reactRoot.render(
       <LinkPreviewTooltip visible={false} data={null} position={{x:0, y:0}} />
    );
});