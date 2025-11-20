const STORAGE_KEY = "arcCommandSettings";
const listEl = document.querySelector("[data-shortcut-list]");
const arcModeToggle = document.getElementById("arc-mode-toggle");

let SHORTCUTS = [];
let SHORTCUT_CATEGORIES = [];
let currentSettings = null;

initOptions();

async function initOptions() {
  const module = await import(chrome.runtime.getURL("shortcuts.js"));
  SHORTCUTS = module.SHORTCUTS;
  SHORTCUT_CATEGORIES = module.SHORTCUT_CATEGORIES;

  renderShortcutList();
  await loadSettings();
  bindEvents();
}

function bindEvents() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      currentSettings = mergeSettings(changes[STORAGE_KEY].newValue, currentSettings);
      syncUI();
    }
  });

  arcModeToggle.addEventListener("change", async (event) => {
    await chrome.runtime.sendMessage({
      type: "arc-cmd:set-arc-mode",
      arcMode: event.target.checked
    });
  });
}

function renderShortcutList() {
  SHORTCUT_CATEGORIES.forEach((category) => {
    const section = document.createElement("section");
    section.className = "category";
    const heading = document.createElement("h2");
    heading.textContent = category.label;
    section.appendChild(heading);

    const shortcuts = SHORTCUTS.filter((shortcut) => shortcut.category === category.id);
    shortcuts.forEach((shortcut) => {
      const row = document.createElement("label");
      row.className = "shortcut-row";
      row.dataset.shortcutId = shortcut.id;

      const meta = document.createElement("div");
      meta.className = "shortcut-meta";

      const title = document.createElement("h3");
      title.textContent = shortcut.label;
      meta.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = shortcut.description;
      meta.appendChild(desc);

      if (shortcut.action.startsWith("unsupported")) {
        const badge = document.createElement("span");
        badge.className = "unsupported-label";
        badge.textContent = "Not available in Chrome";
        meta.appendChild(badge);
      }

      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.dataset.shortcutId = shortcut.id;
      if (shortcut.action.startsWith("unsupported")) {
        toggle.disabled = true;
      } else {
        toggle.addEventListener("change", onFeatureToggle);
      }

      row.append(meta, toggle);
      section.appendChild(row);
    });

    listEl.appendChild(section);
  });
}

async function loadSettings() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  currentSettings = mergeSettings(
    data[STORAGE_KEY],
    moduleDefaultSettings(currentSettings)
  );
  syncUI();
}

function syncUI() {
  if (!currentSettings) return;
  arcModeToggle.checked = Boolean(currentSettings.arcMode);
  document.querySelectorAll("input[data-shortcut-id]").forEach((input) => {
    const shortcutId = input.dataset.shortcutId;
    if (shortcutId && currentSettings.features) {
      input.checked = currentSettings.features[shortcutId] !== false;
    }
  });
}

async function onFeatureToggle(event) {
  const shortcutId = event.target.dataset.shortcutId;
  if (!shortcutId) return;
  await chrome.runtime.sendMessage({
    type: "arc-cmd:set-feature",
    shortcutId,
    enabled: event.target.checked
  });
}

function mergeSettings(raw, fallback) {
  const base = fallback || moduleDefaultSettings();
  if (!raw) return base;
  return {
    arcMode: typeof raw.arcMode === "boolean" ? raw.arcMode : base.arcMode,
    features: {
      ...base.features,
      ...(raw.features || {})
    }
  };
}

function moduleDefaultSettings(current) {
  if (current) return current;
  return {
    arcMode: false,
    features: SHORTCUTS.reduce((map, shortcut) => {
      map[shortcut.id] = true;
      return map;
    }, {})
  };
}

