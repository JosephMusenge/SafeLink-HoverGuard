// src/content.js
document.addEventListener('mouseover', (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (target && target.tagName === 'A' && target.href) {
      chrome.runtime.sendMessage({ type: 'showTooltip', url: target.href, x: e.clientX, y: e.clientY });
    }
  });
  
  document.addEventListener('mouseout', (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (target && target.tagName === 'A') {
      const tooltip = document.querySelector('[role="tooltip"]');
      if (tooltip) tooltip.style.display = 'none';
    }
  });