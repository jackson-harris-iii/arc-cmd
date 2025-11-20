const STORAGE_KEY = "arcCommandSettings";
const LOCAL_ACTIONS = new Set(["find", "copyUrl", "copyUrlMarkdown"]);
let overlayLoaded = false;

if (window.top === window.self) {
  initArcCommandContent();
}

async function initArcCommandContent() {
  const {
    SHORTCUTS,
    normalizeCombo,
    createDefaultSettings
  } = await import(chrome.runtime.getURL("shortcuts.js"));

  const platform = detectPlatform();
  const comboMap = buildComboMap(SHORTCUTS, platform, normalizeCombo);
  let settings = createDefaultSettings();

  settings = await loadSettings(settings);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      settings = mergeSettings(changes[STORAGE_KEY].newValue, settings);
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "pageAction") {
      handleLocalAction(message.actionId);
    }
  });

  // Load overlay when Arc mode is enabled
  if (settings.arcMode && !overlayLoaded) {
    loadOverlay();
  }

  // Watch for Arc mode changes to load/unload overlay
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      const newSettings = mergeSettings(changes[STORAGE_KEY].newValue, settings);
      if (newSettings.arcMode && !overlayLoaded) {
        loadOverlay();
      }
    }
  });

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
        await chrome.runtime.sendMessage({
          type: "arc-cmd:perform",
          actionId: shortcut.action,
          shortcutId: shortcut.id,
          shortcutData: shortcut
        });
      } catch (error) {
        console.warn("Arc Command dispatch failed", error);
      }
    },
    true
  );
}

async function loadOverlay() {
  if (overlayLoaded) return;
  
  try {
    // Load overlay CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("overlay-dist/overlay.css");
    document.head.appendChild(link);

    // Load overlay JS
    const script = document.createElement("script");
    script.type = "module";
    script.src = chrome.runtime.getURL("overlay-dist/overlay.js");
    script.onload = () => {
      overlayLoaded = true;
    };
    script.onerror = (error) => {
      console.error("Failed to load overlay", error);
    };
    document.head.appendChild(script);
  } catch (error) {
    console.error("Failed to load overlay", error);
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

