const STORAGE_KEY = "arcCommandSettings";
const LOCAL_ACTIONS = new Set(["find", "copyUrl", "copyUrlMarkdown"]);
let overlayLoaded = false;

// Inject bridge into page context IMMEDIATELY
// This must happen before the overlay loads
injectBridgeIntoPage();

// Create bridge in content script context
createOverlayBridge();

if (window.top === window.self) {
  initArcCommandContent();
}

// Inject bridge into page context (where overlay runs)
function injectBridgeIntoPage() {
  // Check if already injected
  if (document.getElementById('arc-command-bridge-injector')) {
    return;
  }

  // Check if Chrome APIs are available
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.warn('[Arc Command] Chrome APIs not available for bridge injection');
    return;
  }

  const script = document.createElement('script');
  script.id = 'arc-command-bridge-injector';
  script.src = chrome.runtime.getURL('bridge.js');
  script.type = 'text/javascript';
  
  script.onerror = () => {
    console.error('[Arc Command] Failed to load bridge script');
  };
  
  // Inject at the very beginning of the document
  if (document.documentElement) {
    (document.documentElement || document.head || document.body).appendChild(script);
  } else {
    // If document isn't ready, wait for it
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        (document.documentElement || document.head || document.body).appendChild(script);
      });
    } else {
      (document.head || document.body).appendChild(script);
    }
  }
}

// Create a bridge for the overlay to access Chrome APIs
function createOverlayBridge() {
  // Check if bridge already exists and is valid
  if (window.arcCommandBridge && typeof window.arcCommandBridge === 'object' && typeof window.arcCommandBridge.sendMessage === 'function') {
    return;
  }
  
  // Check if we're in a context where chrome APIs are available
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.storage) {
    console.warn('[Arc Command] Chrome APIs not available in this context');
    // Still create a placeholder bridge so overlay doesn't wait forever
    window.arcCommandBridge = {
      getURL: () => { throw new Error('Chrome API not available'); },
      storageGet: async () => { throw new Error('Chrome API not available'); },
      storageSet: async () => { throw new Error('Chrome API not available'); },
      storageOnChanged: { addListener: () => {}, removeListener: () => {} },
      sendMessage: async () => { throw new Error('Chrome API not available'); },
      loadShortcuts: async () => { throw new Error('Chrome API not available'); }
    };
    return;
  }
  
  try {
    // Create bridge in both content script context and page context
    const bridge = {
    // Proxy for chrome.runtime.getURL
    getURL: (path) => {
      if (typeof chrome === 'undefined') {
        throw new Error('Chrome API not available');
      }
      if (!chrome.runtime) {
        throw new Error('Chrome runtime API not available');
      }
      return chrome.runtime.getURL(path);
    },
    
    // Proxy for chrome.storage.sync.get
    storageGet: async (key) => {
      if (typeof chrome === 'undefined') {
        throw new Error('Chrome API not available');
      }
      if (!chrome.storage) {
        throw new Error('Chrome storage API not available');
      }
      if (!chrome.storage.sync) {
        throw new Error('Chrome storage sync API not available');
      }
      const data = await chrome.storage.sync.get(key);
      return data;
    },
    
    // Proxy for chrome.storage.sync.set
    storageSet: async (data) => {
      if (typeof chrome === 'undefined') {
        throw new Error('Chrome API not available');
      }
      if (!chrome.storage) {
        throw new Error('Chrome storage API not available');
      }
      if (!chrome.storage.sync) {
        throw new Error('Chrome storage sync API not available');
      }
      await chrome.storage.sync.set(data);
    },
    
    // Proxy for chrome.storage.onChanged
    storageOnChanged: {
      addListener: (callback) => {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          console.warn('Chrome storage API not available for listener');
          return;
        }
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === "sync") {
            callback(changes);
          }
        });
      },
      removeListener: (callback) => {
        // Note: Chrome doesn't support removing specific listeners easily
        // This is a limitation, but shouldn't cause issues in practice
      }
    },
    
    // Proxy for chrome.runtime.sendMessage
    sendMessage: async (message) => {
      if (typeof chrome === 'undefined') {
        throw new Error('Chrome API not available');
      }
      if (!chrome.runtime) {
        throw new Error('Chrome runtime API not available');
      }
      if (typeof chrome.runtime.sendMessage !== 'function') {
        throw new Error('Chrome runtime sendMessage API not available');
      }
      return await chrome.runtime.sendMessage(message);
    },
    
    // Load shortcuts module
    loadShortcuts: async () => {
      if (typeof chrome === 'undefined') {
        throw new Error('Chrome API not available');
      }
      if (!chrome.runtime) {
        throw new Error('Chrome runtime API not available');
      }
      const shortcutsModule = await import(chrome.runtime.getURL("shortcuts.js"));
      return {
        SHORTCUTS: shortcutsModule.SHORTCUTS,
        SHORTCUT_CATEGORIES: shortcutsModule.SHORTCUT_CATEGORIES
      };
    }
    };
    
    // Set bridge in window - this should be accessible to page context
    // Content script and page share the same window object for the main frame
    window.arcCommandBridge = bridge;
    
    // Mark bridge as ready
    window.arcCommandBridgeReady = true;
    
    console.log('[Arc Command] Bridge created successfully');
    
  } catch (error) {
    console.error('[Arc Command] Failed to create overlay bridge', error);
    // Create a placeholder bridge so overlay doesn't wait forever
    window.arcCommandBridge = {
      getURL: () => { throw new Error('Bridge creation failed'); },
      storageGet: async () => { throw new Error('Bridge creation failed'); },
      storageSet: async () => { throw new Error('Bridge creation failed'); },
      storageOnChanged: { addListener: () => {}, removeListener: () => {} },
      sendMessage: async () => { throw new Error('Bridge creation failed'); },
      loadShortcuts: async () => { throw new Error('Bridge creation failed'); }
    };
  }
}

async function initArcCommandContent() {
  // Ensure Chrome APIs are available
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.storage) {
    console.warn('Chrome APIs not available, skipping Arc Command initialization');
    return;
  }

  const {
    SHORTCUTS,
    normalizeCombo,
    createDefaultSettings
  } = await import(chrome.runtime.getURL("shortcuts.js"));

  const platform = detectPlatform();
  const comboMap = buildComboMap(SHORTCUTS, platform, normalizeCombo);
  let settings = createDefaultSettings();

  settings = await loadSettings(settings);

  if (chrome.storage) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync") {
        if (changes[STORAGE_KEY]) {
          settings = mergeSettings(changes[STORAGE_KEY].newValue, settings);
        }
        // Notify page context of storage changes
        window.postMessage({
          type: 'arc-cmd:storage-changed',
          changes
        }, '*');
      }
    });
  }

  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "pageAction") {
        handleLocalAction(message.actionId);
      }
    });
  }

  // Handle bridge requests from page context
  window.addEventListener('message', async (event) => {
    // Only handle messages from same window
    if (event.source !== window) return;
    
    if (event.data && event.data.type === 'arc-cmd:bridge-request') {
      const { id, method, args } = event.data;
      
      try {
        let result;
        switch (method) {
          case 'storageGet':
            result = await chrome.storage.sync.get(args[0]);
            break;
          case 'storageSet':
            await chrome.storage.sync.set(args[0]);
            result = undefined;
            break;
          case 'sendMessage':
            result = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage(args[0], (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            });
            break;
          case 'loadShortcuts':
            const shortcutsModule = await import(chrome.runtime.getURL('shortcuts.js'));
            result = {
              SHORTCUTS: shortcutsModule.SHORTCUTS,
              SHORTCUT_CATEGORIES: shortcutsModule.SHORTCUT_CATEGORIES
            };
            break;
          case 'getTabs':
            // Get all tabs in current window, sorted by lastAccessed
            const tabs = await chrome.tabs.query({ currentWindow: true });
            result = tabs
              .map(tab => ({
                id: tab.id,
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl,
                active: tab.active,
                lastAccessed: tab.lastAccessed || 0
              }))
              .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
            break;
          case 'activateTab':
            await chrome.tabs.update(args[0], { active: true });
            result = undefined;
            break;
          case 'createTab':
            // If URL looks like a URL, use it directly, otherwise search
            const url = args[0];
            const isUrl = /^(https?:\/\/|chrome:\/\/|about:|file:\/\/)/i.test(url);
            if (isUrl) {
              await chrome.tabs.create({ url });
            } else {
              // Treat as search query
              await chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(url)}` });
            }
            result = undefined;
            break;
          default:
            throw new Error(`Unknown bridge method: ${method}`);
        }
        
        window.postMessage({
          type: 'arc-cmd:bridge-response',
          id,
          result
        }, '*');
      } catch (error) {
        window.postMessage({
          type: 'arc-cmd:bridge-response',
          id,
          error: error.message
        }, '*');
      }
    }
  });

  // Load overlay when Arc mode is enabled
  if (settings.arcMode && !overlayLoaded) {
    loadOverlay();
  }

  // Watch for Arc mode changes to load/unload overlay
  if (chrome.storage) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes[STORAGE_KEY]) {
        const newSettings = mergeSettings(changes[STORAGE_KEY].newValue, settings);
        if (newSettings.arcMode && !overlayLoaded) {
          loadOverlay();
        }
      }
    });
  }

  window.addEventListener(
    "keydown",
    async (event) => {
      if (!settings.arcMode) return;
      
      // Handle Cmd+K / Ctrl+K to toggle overlay
      const isMac = detectPlatform() === "mac";
      const isOverlayToggle = 
        (isMac && event.metaKey && event.key === "k" && !event.shiftKey && !event.altKey && !event.ctrlKey) ||
        (!isMac && event.ctrlKey && event.key === "k" && !event.shiftKey && !event.altKey && !event.metaKey);
      
      if (isOverlayToggle) {
        event.preventDefault();
        event.stopPropagation();
        if (!overlayLoaded) {
          await loadOverlay();
        }
        // Toggle overlay via message
        window.postMessage({ type: "arc-cmd:toggle-overlay" }, "*");
        return;
      }

      const key = eventToComboKey(event, normalizeCombo);
      if (!key) return;
      const matches = comboMap.get(key);
      if (!matches?.length) return;

      const shortcut = matches.find((entry) => settings.features[entry.id] !== false);
      if (!shortcut) return;

      event.preventDefault();
      event.stopPropagation();

      if (LOCAL_ACTIONS.has(shortcut.action)) {
        handleLocalAction(shortcut.action);
        return;
      }

      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
          await chrome.runtime.sendMessage({
            type: "arc-cmd:perform",
            actionId: shortcut.action,
            shortcutId: shortcut.id,
            shortcutData: shortcut
          });
        } else {
          console.warn("Chrome runtime API not available for sending message");
        }
      } catch (error) {
        // Only log if it's not a "Chrome API not available" type error
        if (error && error.message && !error.message.includes('not available')) {
          console.warn("Arc Command dispatch failed", error);
        }
      }
    },
    true
  );
}

async function loadOverlay() {
  if (overlayLoaded) return;
  
  // Wait for document to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => loadOverlay());
    return;
  }
  
  try {
    // Check if already loaded
    if (document.getElementById("arc-overlay-root")) {
      overlayLoaded = true;
      return;
    }

    // Ensure bridge exists before loading overlay
    if (!window.arcCommandBridge) {
      createOverlayBridge();
    }
    
    // Wait a bit to ensure bridge is fully initialized
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (!window.arcCommandBridge) {
      console.error('Failed to create overlay bridge');
      return;
    }

    // Use bridge to get URLs (safer than direct Chrome API access)
    const bridge = window.arcCommandBridge;

    // Load overlay CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = bridge.getURL("overlay-dist/overlay.css");
    link.id = "arc-overlay-stylesheet";
    if (!document.getElementById("arc-overlay-stylesheet")) {
      document.head.appendChild(link);
    }

    // Load overlay JS
    const script = document.createElement("script");
    script.type = "module";
    script.src = bridge.getURL("overlay-dist/overlay.js");
    script.id = "arc-overlay-script";
    script.onload = () => {
      overlayLoaded = true;
    };
    script.onerror = (error) => {
      console.error("Failed to load overlay", error);
      overlayLoaded = false;
    };
    if (!document.getElementById("arc-overlay-script")) {
      document.head.appendChild(script);
    }
  } catch (error) {
    console.error("Failed to load overlay", error);
    overlayLoaded = false;
  }
}

function detectPlatform() {
  const platform =
    (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
  if (/mac/i.test(platform)) return "mac";
  if (/win/i.test(platform)) return "windows";
  return "linux";
}

function buildComboMap(shortcuts, platform, normalizeCombo) {
  const map = new Map();
  shortcuts.forEach((shortcut) => {
    shortcut.combos.forEach((combo) => {
      const { keys, platforms } = combo;
      if (platforms && !platforms.includes(platform)) return;
      const normalized = normalizeCombo(keys);
      if (!map.has(normalized)) map.set(normalized, []);
      map.get(normalized).push(shortcut);
    });
  });
  return map;
}

function eventToComboKey(event, normalizeCombo) {
  const keys = [];
  if (event.metaKey) keys.push("Meta");
  if (event.ctrlKey) keys.push("Control");
  if (event.altKey) keys.push("Alt");
  if (event.shiftKey) keys.push("Shift");

  const key = event.key;
  if (!key) return null;
  if (!["Control", "Meta", "Alt", "Shift"].includes(key)) {
    keys.push(key.length === 1 ? key.toLowerCase() : key);
  }

  if (!keys.length) return null;
  return normalizeCombo(keys);
}

async function loadSettings(fallback) {
  if (!chrome.storage || !chrome.storage.sync) {
    return fallback || { arcMode: false, features: {} };
  }
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return mergeSettings(data[STORAGE_KEY], fallback);
}

function mergeSettings(raw, fallback) {
  const base = fallback || { arcMode: false, features: {} };
  if (!raw) return base;
  return {
    arcMode: typeof raw.arcMode === "boolean" ? raw.arcMode : base.arcMode,
    features: {
      ...base.features,
      ...(raw.features || {})
    }
  };
}

async function handleLocalAction(actionId) {
  switch (actionId) {
    case "find":
      triggerFind();
      break;
    case "copyUrl":
      await copyToClipboard(window.location.href);
      break;
    case "copyUrlMarkdown":
      await copyToClipboard(`[${document.title || window.location.href}](${window.location.href})`);
      break;
    default:
      break;
  }
}

function triggerFind() {
  try {
    document.execCommand("find");
  } catch {
    const selection = window.getSelection()?.toString() || "";
    const query = window.prompt("Find in page", selection);
    if (query) {
      window.find(query);
    }
  }
}

async function copyToClipboard(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    flashOverlay("Copied!");
  } catch {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    flashOverlay("Copied!");
  } catch (error) {
    console.warn("Arc Command copy failed", error);
  } finally {
    document.body.removeChild(textarea);
  }
}

function flashOverlay(message) {
  const existing = document.getElementById("arc-command-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "arc-command-toast";
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed",
    top: "12px",
    right: "12px",
    background: "rgba(28,32,44,0.9)",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "8px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "13px",
    zIndex: 2147483646,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "opacity 0.2s ease"
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 1200);
}

