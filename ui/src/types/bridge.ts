import type { Shortcut, ShortcutCategory } from '../types';

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
}

declare global {
  interface Window {
    arcCommandBridge?: ArcCommandBridge;
  }
}

