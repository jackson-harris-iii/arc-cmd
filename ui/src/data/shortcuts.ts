import '../types/bridge';

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
    if (!window.arcCommandBridge) {
      throw new Error('Arc Command bridge not available');
    }
    
    const data = await window.arcCommandBridge.loadShortcuts();
    SHORTCUTS = data.SHORTCUTS;
    SHORTCUT_CATEGORIES = data.SHORTCUT_CATEGORIES;
  } catch (error) {
    console.error('Failed to load shortcuts', error);
    throw error;
  }
}

