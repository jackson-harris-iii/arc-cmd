import { createDefaultSettings } from "./shortcuts.js";

const STORAGE_KEY = "arcCommandSettings";
const recentTabs = new Map();
let cachedSettings = null;

// Ensure chrome.tabs is available (should always be in background script)
console.log('[Arc Command] Background script loaded');
console.log('[Arc Command] chrome available:', typeof chrome !== 'undefined');
console.log('[Arc Command] chrome.tabs available:', typeof chrome !== 'undefined' && typeof chrome.tabs !== 'undefined');
if (typeof chrome === 'undefined' || !chrome.tabs) {
  console.error('[Arc Command] chrome.tabs API not available in background script!');
}

function cloneDefaults() {
  return createDefaultSettings();
}

function mergeSettings(raw) {
  const defaults = cloneDefaults();
  if (!raw) return defaults;
  return {
    arcMode: Boolean(raw.arcMode),
    features: {
      ...defaults.features,
      ...(raw.features || {})
    }
  };
}

async function getSettings() {
  if (cachedSettings) return cachedSettings;
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  cachedSettings = mergeSettings(data[STORAGE_KEY]);
  if (!data[STORAGE_KEY]) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: cachedSettings });
  }
  return cachedSettings;
}

async function setSettings(updater) {
  const current = await getSettings();
  const next = typeof updater === "function" ? updater(current) : updater;
  cachedSettings = mergeSettings(next);
  await chrome.storage.sync.set({ [STORAGE_KEY]: cachedSettings });
  return cachedSettings;
}

function featureEnabled(settings, shortcutId) {
  const features = settings.features || {};
  if (typeof features[shortcutId] === "undefined") {
    features[shortcutId] = true;
  }
  return features[shortcutId];
}

async function ensureDefaults() {
  await getSettings();
}

function updateRecentTabs(windowId, tabId) {
  const current = recentTabs.get(windowId) || { current: null, previous: null };
  if (current.current === tabId) return;
  current.previous = current.current;
  current.current = tabId;
  recentTabs.set(windowId, current);
}

chrome.runtime.onInstalled.addListener(() => {
  ensureDefaults();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes[STORAGE_KEY]) return;
  cachedSettings = mergeSettings(changes[STORAGE_KEY].newValue);
});

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  updateRecentTabs(windowId, tabId);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const info = recentTabs.get(removeInfo.windowId);
  if (!info) return;
  if (info.current === tabId) info.current = null;
  if (info.previous === tabId) info.previous = null;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message || {};
  console.log('[Arc Command] Background: Received message type:', type);
  
  if (type === "arc-cmd:perform") {
    handleAction(message.actionId, {
      shortcutId: message.shortcutId,
      tabId: sender.tab?.id,
      shortcut: message.shortcutData,
      payload: message.payload
    });
    sendResponse({ ok: true });
    return true;
  }
  if (type === "arc-cmd:get-settings") {
    getSettings().then((settings) => sendResponse({ settings }));
    return true;
  }
  if (type === "arc-cmd:set-arc-mode") {
    setSettings((prev) => ({ ...prev, arcMode: message.arcMode }));
    sendResponse({ ok: true });
    return true;
  }
  if (type === "arc-cmd:set-feature") {
    setSettings((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [message.shortcutId]: message.enabled
      }
    }));
    sendResponse({ ok: true });
    return true;
  }
  if (type === "arc-cmd:get-tabs") {
    // Get all tabs in current window, sorted by lastAccessed
    try {
      if (typeof chrome === 'undefined') {
        throw new Error('Chrome API not available');
      }
      if (!chrome.tabs) {
        throw new Error('chrome.tabs API not available');
      }
      if (typeof chrome.tabs.query !== 'function') {
        throw new Error('chrome.tabs.query is not a function');
      }
      
      console.log('[Arc Command] Background: Fetching tabs...');
      chrome.tabs.query({ currentWindow: true })
        .then((tabs) => {
          console.log('[Arc Command] Background: Found', tabs.length, 'tabs');
          const result = tabs
            .map(tab => ({
              id: tab.id,
              title: tab.title || 'Untitled',
              url: tab.url || '',
              favIconUrl: tab.favIconUrl || undefined,
              active: tab.active || false,
              lastAccessed: tab.lastAccessed || tab.id || 0
            }))
            .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
          console.log('[Arc Command] Background: Returning', result.length, 'sorted tabs');
          sendResponse({ tabs: result });
        })
        .catch((error) => {
          console.error('[Arc Command] Background: Error in get-tabs promise:', error);
          sendResponse({ error: error.message || 'Failed to get tabs' });
        });
    } catch (error) {
      console.error('[Arc Command] Background: Error in get-tabs handler:', error);
      sendResponse({ error: error.message || 'Failed to get tabs' });
    }
    return true; // Keep channel open for async response
  }
  if (type === "arc-cmd:activate-tab") {
    try {
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        throw new Error('chrome.tabs API not available');
      }
      if (typeof chrome.tabs.update !== 'function') {
        throw new Error('chrome.tabs.update is not a function');
      }
      chrome.tabs.update(message.tabId, { active: true })
        .then(() => sendResponse({ ok: true }))
        .catch((error) => {
          console.error('[Arc Command] Error activating tab:', error);
          sendResponse({ error: error.message || 'Failed to activate tab' });
        });
    } catch (error) {
      console.error('[Arc Command] Error in activate-tab handler:', error);
      sendResponse({ error: error.message || 'Failed to activate tab' });
    }
    return true;
  }
  if (type === "arc-cmd:create-tab") {
    try {
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        throw new Error('chrome.tabs API not available');
      }
      if (typeof chrome.tabs.create !== 'function') {
        throw new Error('chrome.tabs.create is not a function');
      }
      const url = message.url;
      // If URL looks like a URL, use it directly, otherwise search
      const isUrl = /^(https?:\/\/|chrome:\/\/|about:|file:\/\/)/i.test(url);
      const tabUrl = isUrl ? url : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      chrome.tabs.create({ url: tabUrl })
        .then(() => sendResponse({ ok: true }))
        .catch((error) => {
          console.error('[Arc Command] Error creating tab:', error);
          sendResponse({ error: error.message || 'Failed to create tab' });
        });
    } catch (error) {
      console.error('[Arc Command] Error in create-tab handler:', error);
      sendResponse({ error: error.message || 'Failed to create tab' });
    }
    return true;
  }
  return false;
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

async function handleAction(actionId, context = {}) {
  const tab = await getActiveTab();
  const targetTabId = context.tabId || tab?.id;
  switch (actionId) {
    case "newTab":
      await chrome.tabs.create({});
      break;
    case "newWindow":
      await chrome.windows.create({});
      break;
    case "newIncognito":
      await chrome.windows.create({ incognito: true });
      break;
    case "littleArc":
      await chrome.windows.create({
        type: "popup",
        width: 980,
        height: 640,
        focused: true,
        url: "chrome://newtab"
      });
      break;
    case "closeTab":
      if (targetTabId) await chrome.tabs.remove(targetTabId);
      break;
    case "reopenTab":
      await chrome.sessions.restore();
      break;
    case "pinTab":
      if (targetTabId) {
        const currentTab = await chrome.tabs.get(targetTabId);
        await chrome.tabs.update(targetTabId, { pinned: !currentTab.pinned });
      }
      break;
    case "copyUrl":
      await relayToTab(targetTabId, { type: "pageAction", actionId: "copyUrl" });
      break;
    case "copyUrlMarkdown":
      await relayToTab(targetTabId, {
        type: "pageAction",
        actionId: "copyUrlMarkdown"
      });
      break;
    case "clearUnpinned":
      await clearUnpinnedTabs();
      break;
    case "goToTab":
      if (typeof context.shortcut?.tabIndex === "number") {
        await activateTabIndex(context.shortcut.tabIndex);
      }
      break;
    case "goToLastTab":
      await activateLastTab();
      break;
    case "focusSpace":
      if (typeof context.shortcut?.spaceIndex === "number") {
        await focusWindowByIndex(context.shortcut.spaceIndex);
      }
      break;
    case "toggleRecent":
      await toggleRecentTab();
      break;
    case "nextTab":
      await cycleTabs(1);
      break;
    case "previousTab":
      await cycleTabs(-1);
      break;
    case "nextWindow":
      await cycleWindows(1);
      break;
    case "previousWindow":
      await cycleWindows(-1);
      break;
    case "historyForward":
      if (targetTabId) await chrome.tabs.goForward(targetTabId);
      break;
    case "historyBack":
      if (targetTabId) await chrome.tabs.goBack(targetTabId);
      break;
    case "openHistory":
      await chrome.tabs.create({ url: "chrome://history" });
      break;
    case "zoomIn":
      await adjustZoom(0.1);
      break;
    case "zoomOut":
      await adjustZoom(-0.1);
      break;
    case "resetZoom":
      if (targetTabId) await chrome.tabs.setZoom(targetTabId, 1);
      break;
    case "reload":
      if (targetTabId) await chrome.tabs.reload(targetTabId);
      break;
    case "find":
      await relayToTab(targetTabId, { type: "pageAction", actionId: "find" });
      break;
    default:
      if (actionId.startsWith("unsupported")) {
        notifyUnsupported(actionId);
      }
  }
}

async function relayToTab(tabId, message) {
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.warn("Arc Command relay failed", error);
  }
}

async function clearUnpinnedTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true, pinned: false });
  const ids = tabs.map((tab) => tab.id).filter(Boolean);
  if (ids.length) {
    await chrome.tabs.remove(ids);
  }
}

async function activateTabIndex(index) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  if (tabs[index]) {
    await chrome.tabs.update(tabs[index].id, { active: true });
  }
}

async function activateLastTab() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const target = tabs[tabs.length - 1];
  if (target) await chrome.tabs.update(target.id, { active: true });
}

async function focusWindowByIndex(idx) {
  const windows = await chrome.windows.getAll({ populate: false, windowTypes: ["normal"] });
  if (!windows.length) return;
  const sorted = windows.sort((a, b) => a.id - b.id);
  const target = sorted[idx];
  if (target?.id) {
    await chrome.windows.update(target.id, { focused: true });
  }
}

async function toggleRecentTab() {
  const tab = await getActiveTab();
  if (!tab) return;
  const info = recentTabs.get(tab.windowId);
  if (!info?.previous) {
    notifyUnsupported("recent-tabs-missing");
    return;
  }
  const previousId = info.previous;
  info.previous = info.current;
  info.current = previousId;
  await chrome.tabs.update(previousId, { active: true });
}

async function cycleTabs(direction) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  if (!tabs.length) return;
  const activeIndex = tabs.findIndex((tab) => tab.active);
  if (activeIndex === -1) return;
  let nextIndex = (activeIndex + direction) % tabs.length;
  if (nextIndex < 0) nextIndex = tabs.length - 1;
  await chrome.tabs.update(tabs[nextIndex].id, { active: true });
}

async function cycleWindows(direction) {
  const windows = await chrome.windows.getAll({ populate: false, windowTypes: ["normal"] });
  if (windows.length < 2) return;
  windows.sort((a, b) => a.id - b.id);
  const focusedIndex = windows.findIndex((win) => win.focused);
  if (focusedIndex === -1) return;
  let nextIndex = (focusedIndex + direction) % windows.length;
  if (nextIndex < 0) nextIndex = windows.length - 1;
  await chrome.windows.update(windows[nextIndex].id, { focused: true });
}

async function adjustZoom(delta) {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  const currentZoom = await chrome.tabs.getZoom(tab.id);
  const nextZoom = Math.max(0.25, Math.min(5, currentZoom + delta));
  await chrome.tabs.setZoom(tab.id, nextZoom);
}

function notifyUnsupported(actionId) {
  const message = (() => {
    switch (actionId) {
      case "unsupported-change-url":
        return "Changing the Chrome address bar via shortcut is unavailable.";
      case "unsupported-sidebar":
        return "Chrome does not expose a sidebar toggle API.";
      case "unsupported-split-add":
      case "unsupported-split-close":
      case "unsupported-split-focus":
        return "Split View is not supported in Chrome.";
      case "recent-tabs-missing":
        return "No previous tab to toggle.";
      default:
        return "This Arc shortcut is not supported in Chrome.";
    }
  })();
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Arc Command",
    message
  });
}

