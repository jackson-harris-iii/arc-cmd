import { useState, useEffect } from 'react';
import type { Tab } from '../types/bridge';

export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTabs() {
      if (!window.arcCommandBridge) {
        setLoading(false);
        return;
      }

      try {
        const tabsList = await window.arcCommandBridge.getTabs();
        setTabs(tabsList);
      } catch (error) {
        console.error('Failed to load tabs', error);
      } finally {
        setLoading(false);
      }
    }

    loadTabs();

    // Refresh tabs periodically
    const interval = setInterval(loadTabs, 1000);
    return () => clearInterval(interval);
  }, []);

  async function activateTab(tabId: number) {
    if (!window.arcCommandBridge) return;
    try {
      await window.arcCommandBridge.activateTab(tabId);
    } catch (error) {
      console.error('Failed to activate tab', error);
    }
  }

  async function createTab(url: string) {
    if (!window.arcCommandBridge) return;
    try {
      await window.arcCommandBridge.createTab(url);
    } catch (error) {
      console.error('Failed to create tab', error);
    }
  }

  return { tabs, loading, activateTab, createTab };
}

