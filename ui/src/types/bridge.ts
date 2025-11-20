import type { Shortcut, ShortcutCategory } from '../types';

export interface Tab {
  id?: number;
  title?: string;
  url?: string;
  favIconUrl?: string;
  active?: boolean;
  lastAccessed?: number;
}

export interface ArcCommandBridge {
  getURL: (path: string) => string;
  storageGet: (key: string) => Promise<Record<string, any>>;
  storageSet: (data: Record<string, any>) => Promise<void>;
  storageOnChanged: {
    addListener: (callback: (changes: Record<string, any>) => void) => void;
    removeListener: (callback: any) => void;
  };
  sendMessage: (message: any) => Promise<any>;
  loadShortcuts: () => Promise<{
    SHORTCUTS: Shortcut[];
    SHORTCUT_CATEGORIES: ShortcutCategory[];
  }>;
  getTabs: () => Promise<Tab[]>;
  activateTab: (tabId: number) => Promise<void>;
  createTab: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    arcCommandBridge?: ArcCommandBridge;
  }
}

