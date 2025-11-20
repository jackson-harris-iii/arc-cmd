export const SHORTCUT_CATEGORIES = [
  { id: "actions", label: "Actions" },
  { id: "everyday", label: "Everyday Use" },
  { id: "navigation", label: "Quick Navigation" }
];

const combo = (keys, platforms) => ({ keys, platforms });
const MAC = ["mac"];
const NON_MAC = ["windows", "linux"];
const ALL = undefined;

export const SHORTCUTS = [
  {
    id: "viewHistory",
    label: "View history",
    description: "Command+Y / Ctrl+Y",
    category: "actions",
    action: "openHistory",
    commandId: "arc-view-history",
    combos: [combo(["Meta", "y"], MAC), combo(["Control", "y"], NON_MAC)]
  },
  {
    id: "zoomIn",
    label: "Zoom in webpage",
    description: "Command+Plus / Ctrl+Plus",
    category: "actions",
    action: "zoomIn",
    combos: [
      combo(["Meta", "="], MAC),
      combo(["Meta", "Shift", "+"], MAC),
      combo(["Control", "="], NON_MAC),
      combo(["Control", "Shift", "+"], NON_MAC)
    ]
  },
  {
    id: "zoomOut",
    label: "Zoom out webpage",
    description: "Command+Minus / Ctrl+Minus",
    category: "actions",
    action: "zoomOut",
    combos: [combo(["Meta", "-"], MAC), combo(["Control", "-"], NON_MAC)]
  },
  {
    id: "resetZoom",
    label: "Reset zoom",
    description: "Command+0 / Ctrl+0",
    category: "actions",
    action: "resetZoom",
    combos: [combo(["Meta", "0"], MAC), combo(["Control", "0"], NON_MAC)]
  },
  {
    id: "reload",
    label: "Reload webpage",
    description: "Command+R / Ctrl+R",
    category: "actions",
    action: "reload",
    commandId: "arc-reload",
    combos: [combo(["Meta", "r"], MAC), combo(["Control", "r"], NON_MAC)]
  },
  {
    id: "find",
    label: "Find in webpage",
    description: "Command+F / Ctrl+F",
    category: "actions",
    action: "find",
    combos: [combo(["Meta", "f"], MAC), combo(["Control", "f"], NON_MAC)]
  },
  {
    id: "newTab",
    label: "New tab",
    description: "Command+T / Ctrl+T",
    category: "everyday",
    action: "newTab",
    commandId: "arc-new-tab",
    combos: [combo(["Meta", "t"], MAC), combo(["Control", "t"], NON_MAC)]
  },
  {
    id: "newWindow",
    label: "New window",
    description: "Command+N / Ctrl+N",
    category: "everyday",
    action: "newWindow",
    commandId: "arc-new-window",
    combos: [combo(["Meta", "n"], MAC), combo(["Control", "n"], NON_MAC)]
  },
  {
    id: "newIncognito",
    label: "New incognito window",
    description: "Command+Shift+N / Ctrl+Shift+N",
    category: "everyday",
    action: "newIncognito",
    commandId: "arc-new-incognito-window",
    combos: [
      combo(["Meta", "Shift", "n"], MAC),
      combo(["Control", "Shift", "n"], NON_MAC)
    ]
  },
  {
    id: "littleArc",
    label: "Open Little Arc",
    description: "Command+Option+N / Ctrl+Alt+N",
    category: "everyday",
    action: "littleArc",
    combos: [
      combo(["Meta", "Alt", "n"], MAC),
      combo(["Control", "Alt", "n"], NON_MAC)
    ]
  },
  {
    id: "closeTab",
    label: "Close current tab",
    description: "Command+W / Ctrl+W",
    category: "everyday",
    action: "closeTab",
    commandId: "arc-close-tab",
    combos: [combo(["Meta", "w"], MAC), combo(["Control", "w"], NON_MAC)]
  },
  {
    id: "reopenTab",
    label: "Re-open last closed tab",
    description: "Command+Shift+T / Ctrl+Shift+T",
    category: "everyday",
    action: "reopenTab",
    commandId: "arc-reopen-tab",
    combos: [
      combo(["Meta", "Shift", "t"], MAC),
      combo(["Control", "Shift", "t"], NON_MAC)
    ]
  },
  {
    id: "pinTab",
    label: "Pin / Unpin current tab",
    description: "Command+D / Ctrl+D",
    category: "everyday",
    action: "pinTab",
    commandId: "arc-pin-tab",
    combos: [combo(["Meta", "d"], MAC), combo(["Control", "d"], NON_MAC)]
  },
  {
    id: "copyUrl",
    label: "Copy current tab URL",
    description: "Command+Shift+C / Ctrl+Shift+C",
    category: "everyday",
    action: "copyUrl",
    commandId: "arc-copy-url",
    combos: [
      combo(["Meta", "Shift", "c"], MAC),
      combo(["Control", "Shift", "c"], NON_MAC)
    ]
  },
  {
    id: "copyUrlMarkdown",
    label: "Copy URL as Markdown",
    description: "Command+Shift+Option+C / Ctrl+Shift+Alt+C",
    category: "everyday",
    action: "copyUrlMarkdown",
    commandId: "arc-copy-url-markdown",
    combos: [
      combo(["Meta", "Shift", "Alt", "c"], MAC),
      combo(["Control", "Shift", "Alt", "c"], NON_MAC)
    ]
  },
  {
    id: "changeUrl",
    label: "Change current tab URL",
    description: "Command+L / Ctrl+L",
    category: "everyday",
    action: "unsupported-change-url",
    combos: [combo(["Meta", "l"], MAC), combo(["Control", "l"], NON_MAC)]
  },
  {
    id: "toggleSidebar",
    label: "Show / Hide sidebar",
    description: "Command+S / Ctrl+S",
    category: "everyday",
    action: "unsupported-sidebar",
    combos: [combo(["Meta", "s"], MAC), combo(["Control", "s"], NON_MAC)]
  },
  {
    id: "clearUnpinned",
    label: "Clear unpinned tabs",
    description: "Command+Shift+K / Ctrl+Shift+K",
    category: "everyday",
    action: "clearUnpinned",
    combos: [
      combo(["Meta", "Shift", "k"], MAC),
      combo(["Control", "Shift", "k"], NON_MAC)
    ]
  },
  ...Array.from({ length: 9 }).map((_, index) => ({
    id: `tab-${index + 1}`,
    label: `Go to tab ${index + 1}`,
    description: `Command+${index + 1} / Ctrl+${index + 1}`,
    category: "navigation",
    action: "goToTab",
    commandId: `arc-go-tab-${index + 1}`,
    tabIndex: index,
    combos: [
      combo(["Meta", `${index + 1}`], MAC),
      combo(["Control", `${index + 1}`], NON_MAC)
    ]
  })),
  {
    id: "go-last-tab",
    label: "Go to last tab",
    description: "Command+9 / Ctrl+9",
    category: "navigation",
    action: "goToLastTab",
    commandId: "arc-go-last-tab",
    combos: [combo(["Meta", "9"], MAC), combo(["Control", "9"], NON_MAC)]
  },
  {
    id: "focusSpace1",
    label: "Focus on Space 1",
    description: "Control+1",
    category: "navigation",
    action: "focusSpace",
    spaceIndex: 0,
    combos: [combo(["Control", "1"], MAC)]
  },
  {
    id: "focusSpace2",
    label: "Focus on Space 2",
    description: "Control+2",
    category: "navigation",
    action: "focusSpace",
    spaceIndex: 1,
    combos: [combo(["Control", "2"], MAC)]
  },
  {
    id: "focusSpace3",
    label: "Focus on Space 3",
    description: "Control+3",
    category: "navigation",
    action: "focusSpace",
    spaceIndex: 2,
    combos: [combo(["Control", "3"], MAC)]
  },
  {
    id: "toggleRecent",
    label: "Toggle between recent tabs",
    description: "Control+Tab",
    category: "navigation",
    action: "toggleRecent",
    commandId: "arc-toggle-recent-tabs",
    combos: [combo(["Control", "Tab"], ALL)]
  },
  {
    id: "switchTabsUp",
    label: "Switch between tabs (Up)",
    description: "Command+Option+Up",
    category: "navigation",
    action: "previousTab",
    combos: [
      combo(["Meta", "Alt", "ArrowUp"], MAC),
      combo(["Control", "Alt", "ArrowUp"], NON_MAC)
    ]
  },
  {
    id: "switchTabsDown",
    label: "Switch between tabs (Down)",
    description: "Command+Option+Down",
    category: "navigation",
    action: "nextTab",
    combos: [
      combo(["Meta", "Alt", "ArrowDown"], MAC),
      combo(["Control", "Alt", "ArrowDown"], NON_MAC)
    ]
  },
  {
    id: "switchSpacesLeft",
    label: "Switch between spaces (Left)",
    description: "Command+Option+Left",
    category: "navigation",
    action: "previousWindow",
    combos: [
      combo(["Meta", "Alt", "ArrowLeft"], MAC),
      combo(["Control", "Alt", "ArrowLeft"], NON_MAC)
    ]
  },
  {
    id: "switchSpacesRight",
    label: "Switch between spaces (Right)",
    description: "Command+Option+Right",
    category: "navigation",
    action: "nextWindow",
    combos: [
      combo(["Meta", "Alt", "ArrowRight"], MAC),
      combo(["Control", "Alt", "ArrowRight"], NON_MAC)
    ]
  },
  {
    id: "historyForward",
    label: "Go forward on tab history",
    description: "Command+] / Alt+Right",
    category: "navigation",
    action: "historyForward",
    commandId: "arc-history-forward",
    combos: [combo(["Meta", "]"], MAC), combo(["Alt", "ArrowRight"], ALL)]
  },
  {
    id: "historyBack",
    label: "Go back on tab history",
    description: "Command+[ / Alt+Left",
    category: "navigation",
    action: "historyBack",
    commandId: "arc-history-back",
    combos: [combo(["Meta", "["], MAC), combo(["Alt", "ArrowLeft"], ALL)]
  },
  {
    id: "addSplitView",
    label: "Add Split View",
    description: "Control+Shift+Plus",
    category: "navigation",
    action: "unsupported-split-add",
    combos: [combo(["Control", "Shift", "+"], ALL)]
  },
  {
    id: "closeSplitView",
    label: "Close Split View",
    description: "Control+Shift+Minus",
    category: "navigation",
    action: "unsupported-split-close",
    combos: [combo(["Control", "Shift", "-"], ALL)]
  },
  {
    id: "focusSplit",
    label: "Switch Split View focus",
    description: "Control+Shift+1/2/...",
    category: "navigation",
    action: "unsupported-split-focus",
    combos: [
      combo(["Control", "Shift", "1"], ALL),
      combo(["Control", "Shift", "2"], ALL),
      combo(["Control", "Shift", "3"], ALL)
    ]
  }
];

export function buildDefaultFeatureState() {
  return SHORTCUTS.reduce((map, shortcut) => {
    map[shortcut.id] = true;
    return map;
  }, {});
}

export function createDefaultSettings() {
  return {
    arcMode: false,
    features: buildDefaultFeatureState()
  };
}

export function normalizeCombo(keys) {
  return keys
    .map((key) => key.toLowerCase())
    .sort((a, b) => {
      const order = ["control", "meta", "alt", "shift"];
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    })
    .join("+");
}


