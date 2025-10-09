chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'showTooltip') {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ['static/js/tooltip.js'], // Injects the bundled react tooltip script
        injectImmediately: true,
      }, () => {
        chrome.tabs.sendMessage(sender.tab.id, message);
      });
    }
  });