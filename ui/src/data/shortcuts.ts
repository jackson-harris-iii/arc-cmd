// This will be loaded dynamically from the extension's shortcuts.js
// For now, we'll define a minimal type-safe interface

export interface ShortcutCombo {
  keys: string[];
  platforms?: string[];
}

export interface Shortcut {
  id: string;
  label: string;
  description: string;
  category: string;
  action: string;
  commandId?: string;
  combos: ShortcutCombo[];
  tabIndex?: number;
  spaceIndex?: number;
}

export interface ShortcutCategory {
  id: string;
  label: string;
}

// This will be populated at runtime from the extension's shortcuts.js module
export let SHORTCUTS: Shortcut[] = [];
export let SHORTCUT_CATEGORIES: ShortcutCategory[] = [];

export async function loadShortcuts() {
  try {
    const shortcutsModule = await import(
      chrome.runtime.getURL('shortcuts.js')
    );
    SHORTCUTS = shortcutsModule.SHORTCUTS;
    SHORTCUT_CATEGORIES = shortcutsModule.SHORTCUT_CATEGORIES;
  } catch (error) {
    console.error('Failed to load shortcuts', error);
  }
}

