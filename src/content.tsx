import ReactDOM from 'react-dom/client';
import LinkPreviewTooltip from './components/LinkPreviewTooltip'; 

const rootId = 'link-defender-root';
let rootElement = document.getElementById(rootId);

if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = rootId;
  document.body.appendChild(rootElement);
}

// Create shadow DOM to protect styles
const shadow = rootElement.shadowRoot || rootElement.attachShadow({ mode: 'open' });
// Create a mounting point inside shadow DOM
const mountPoint = document.createElement('div');
// Ensure we don't duplicate mount points
if (!shadow.contains(mountPoint)) {
    shadow.appendChild(mountPoint);
}

const reactRoot = ReactDOM.createRoot(mountPoint);

let currentTarget: HTMLAnchorElement | null = null;

// Handle Hover
document.addEventListener('mouseover', (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest('a');

  if (link && link.href && link !== currentTarget) {
    currentTarget = link;
    
    // send message to background
    chrome.runtime.sendMessage(
      { type: 'CHECK_LINK', url: link.href },
      (response) => {
        // Render your specific Tooltip component
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
});

// Handle Mouse Leave
document.addEventListener('mouseout', (e) => {
     // Add a small delay check here if needed later
     reactRoot.render(
        <LinkPreviewTooltip visible={false} data={null} position={{x:0, y:0}} />
     );
     currentTarget = null;
});