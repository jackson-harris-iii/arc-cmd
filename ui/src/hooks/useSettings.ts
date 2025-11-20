import { useState, useEffect } from 'react';
import type { Settings } from '../types';

const STORAGE_KEY = 'arcCommandSettings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for bridge to be available
    const initSettings = async () => {
      const maxWait = 5000;
      const checkInterval = 100;
      const startTime = Date.now();
      
      while (!window.arcCommandBridge && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
      
      if (!window.arcCommandBridge) {
        console.error('Arc Command bridge not available');
        setSettings({ arcMode: false, features: {} });
        setLoading(false);
        return;
      }

      await loadSettings();
      
      const listener = (changes: Record<string, any>) => {
        if (changes[STORAGE_KEY]) {
          setSettings(changes[STORAGE_KEY].newValue as Settings);
        }
      };
      
      window.arcCommandBridge.storageOnChanged.addListener(listener);
    };
    
    initSettings();
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

