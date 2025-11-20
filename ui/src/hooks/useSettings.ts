import { useState, useEffect } from 'react';
import type { Settings } from '../types';

const STORAGE_KEY = 'arcCommandSettings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.arcCommandBridge) {
      console.error('Arc Command bridge not available');
      setLoading(false);
      return;
    }

    loadSettings();
    
    const listener = (changes: Record<string, any>) => {
      if (changes[STORAGE_KEY]) {
        setSettings(changes[STORAGE_KEY].newValue as Settings);
      }
    };
    
    window.arcCommandBridge.storageOnChanged.addListener(listener);
    return () => {
      // Note: Chrome storage listeners can't be easily removed, but this is fine
      // as the component will unmount
    };
  }, []);

  async function loadSettings() {
    if (!window.arcCommandBridge) {
      setSettings({ arcMode: false, features: {} });
      setLoading(false);
      return;
    }

    try {
      const data = await window.arcCommandBridge.storageGet(STORAGE_KEY);
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
    if (!window.arcCommandBridge) return;
    
    try {
      await window.arcCommandBridge.sendMessage({
        type: 'arc-cmd:set-arc-mode',
        arcMode: enabled,
      });
    } catch (error) {
      console.error('Failed to set arc mode', error);
    }
  }

  async function setFeature(shortcutId: string, enabled: boolean) {
    if (!window.arcCommandBridge) return;
    
    try {
      await window.arcCommandBridge.sendMessage({
        type: 'arc-cmd:set-feature',
        shortcutId,
        enabled,
      });
    } catch (error) {
      console.error('Failed to set feature', error);
    }
  }

  async function triggerShortcut(actionId: string, shortcutId: string, shortcutData: any) {
    if (!window.arcCommandBridge) return;
    
    try {
      await window.arcCommandBridge.sendMessage({
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

