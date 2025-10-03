chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'showTooltip') {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ['index.html'], // Injects the React app
        injectImmediately: true,
      });
    }
  });