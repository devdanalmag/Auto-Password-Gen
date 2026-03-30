/**
 * Background Service Worker
 * Manages settings storage and message passing
 */

// Default settings
const DEFAULT_SETTINGS = {
  mode: 'pattern',           // 'default' or 'pattern'
  defaultPassword: '',       // Used in 'default' mode
  method: 1,                 // Active pattern method (1-6)
  customTemplate: '*{Domain}{year}#',  // Template for method 6
  autoFill: false,           // Auto-fill on page load (off by default for security)
  showIcon: true,            // Show key icon next to password fields
  siteOverrides: {}          // Per-site method overrides: { "github": 3, "bank": 1 }
};

/**
 * Initialize default settings on install
 */
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get('settings');
  if (!existing.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get('settings', (data) => {
      sendResponse(data.settings || DEFAULT_SETTINGS);
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set({ settings: message.settings }, () => {
      sendResponse({ success: true });
      // Notify all tabs of settings change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            settings: message.settings
          }).catch(() => {}); // Ignore errors for tabs without content script
        });
      });
    });
    return true;
  }

  if (message.type === 'GET_CURRENT_TAB_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url || '' });
    });
    return true;
  }
});
