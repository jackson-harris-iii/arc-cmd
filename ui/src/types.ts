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

export interface Settings {
  arcMode: boolean;
  features: Record<string, boolean>;
}

