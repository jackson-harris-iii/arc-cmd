// Bridge for page context to access Chrome APIs
// This file is injected into the page context

(function() {
  'use strict';
  
  if (window.arcCommandBridge) return;
  
  // Create bridge in page context
  // This will proxy to content script via postMessage
  window.arcCommandBridge = {
    getURL: function(path) {
      // Try direct Chrome API first (may not work in page context)
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
          return chrome.runtime.getURL(path);
        } catch (e) {
          console.warn('[Arc Command] Direct Chrome API access failed, using fallback');
        }
      }
      // Fallback: construct URL manually
      const extId = document.querySelector('script[src*="content.js"]')?.src.match(/chrome-extension:\/\/([^\/]+)/)?.[1];
      if (extId) {
        return 'chrome-extension://' + extId + '/' + path;
      }
      throw new Error('Cannot determine extension URL');
    },
    
    storageGet: async function(key) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        try {
          return new Promise((resolve, reject) => {
            chrome.storage.sync.get(key, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });
        } catch (e) {
          console.warn('[Arc Command] Direct Chrome storage access failed');
        }
      }
      // Fallback: use postMessage to content script
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36);
        const handler = (event) => {
          if (event.data && event.data.type === 'arc-cmd:bridge-response' && event.data.id === id) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        };
        window.addEventListener('message', handler);
        window.postMessage({ type: 'arc-cmd:bridge-request', id, method: 'storageGet', args: [key] }, '*');
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Bridge request timeout'));
        }, 5000);
      });
    },
    
    storageSet: async function(data) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        try {
          return new Promise((resolve, reject) => {
            chrome.storage.sync.set(data, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });
        } catch (e) {
          console.warn('[Arc Command] Direct Chrome storage access failed');
        }
      }
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36);
        const handler = (event) => {
          if (event.data && event.data.type === 'arc-cmd:bridge-response' && event.data.id === id) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        };
        window.addEventListener('message', handler);
        window.postMessage({ type: 'arc-cmd:bridge-request', id, method: 'storageSet', args: [data] }, '*');
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Bridge request timeout'));
        }, 5000);
      });
    },
    
    storageOnChanged: {
      addListener: function(callback) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            chrome.storage.onChanged.addListener(function(changes, area) {
              if (area === 'sync') {
                callback(changes);
              }
            });
            return;
          } catch (e) {
            console.warn('[Arc Command] Direct Chrome storage listener failed');
          }
        }
        // Fallback: listen to messages from content script
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'arc-cmd:storage-changed') {
            callback(event.data.changes);
          }
        });
      },
      removeListener: function() {}
    },
    
    sendMessage: async function(message) {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          });
        } catch (e) {
          console.warn('[Arc Command] Direct Chrome message send failed');
        }
      }
      // Fallback: use postMessage
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36);
        const handler = (event) => {
          if (event.data && event.data.type === 'arc-cmd:bridge-response' && event.data.id === id) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        };
        window.addEventListener('message', handler);
        window.postMessage({ type: 'arc-cmd:bridge-request', id, method: 'sendMessage', args: [message] }, '*');
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Bridge request timeout'));
        }, 5000);
      });
    },
    
    loadShortcuts: async function() {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
          const shortcutsModule = await import(chrome.runtime.getURL('shortcuts.js'));
          return {
            SHORTCUTS: shortcutsModule.SHORTCUTS,
            SHORTCUT_CATEGORIES: shortcutsModule.SHORTCUT_CATEGORIES
          };
        } catch (e) {
          console.warn('[Arc Command] Direct Chrome module import failed');
        }
      }
      // Fallback: use postMessage
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36);
        const handler = (event) => {
          if (event.data && event.data.type === 'arc-cmd:bridge-response' && event.data.id === id) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        };
        window.addEventListener('message', handler);
        window.postMessage({ type: 'arc-cmd:bridge-request', id, method: 'loadShortcuts', args: [] }, '*');
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Bridge request timeout'));
        }, 5000);
      });
    }
  };
  
  console.log('[Arc Command] Bridge injected into page context');
})();

