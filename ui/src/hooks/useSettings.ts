import { useState, useEffect } from 'react';
import type { Settings } from '../types';

const STORAGE_KEY = 'arcCommandSettings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[STORAGE_KEY]) {
        setSettings(changes[STORAGE_KEY].newValue as Settings);
      }
    };
    
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  async function loadSettings() {
    try {
      const data = await chrome.storage.sync.get(STORAGE_KEY);
      const raw = data[STORAGE_KEY] as Settings | undefined;
      const settings: Settings = raw && typeof raw === 'object' && 'arcMode' in raw
        ? raw
        : { arcMode: false, features: {} };
      setSettings(settings);
    } catch (error) {
      console.error('Failed to load settings', error);
      setSettings({ arcMode: false, features: {} });
    } finally {
      setLoading(false);
    }
  }

  async function setArcMode(enabled: boolean) {
    try {
      await chrome.runtime.sendMessage({
        type: 'arc-cmd:set-arc-mode',
        arcMode: enabled,
      });
    } catch (error) {
      console.error('Failed to set arc mode', error);
    }
  }

  async function setFeature(shortcutId: string, enabled: boolean) {
    try {
      await chrome.runtime.sendMessage({
        type: 'arc-cmd:set-feature',
        shortcutId,
        enabled,
      });
    } catch (error) {
      console.error('Failed to set feature', error);
    }
  }

  async function triggerShortcut(actionId: string, shortcutId: string, shortcutData: any) {
    try {
      await chrome.runtime.sendMessage({
        type: 'arc-cmd:perform',
        actionId,
        shortcutId,
        shortcutData,
      });
    } catch (error) {
      console.error('Failed to trigger shortcut', error);
    }
  }

  return {
    settings,
    loading,
    setArcMode,
    setFeature,
    triggerShortcut,
  };
}

