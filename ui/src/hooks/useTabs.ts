import { useState, useEffect } from 'react';
import type { Tab } from '../types/bridge';

export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTabs() {
      // Wait for bridge to be available (with timeout)
      const maxWait = 5000; // 5 seconds
      const checkInterval = 100; // Check every 100ms
      const startTime = Date.now();
      
      while (!window.arcCommandBridge && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
      
      if (!window.arcCommandBridge) {
        console.error('[Arc Command] Bridge not available for loading tabs');
        setError('Bridge not available');
        setLoading(false);
        return;
      }

      try {
        const tabsList = await window.arcCommandBridge.getTabs();
        console.log('[Arc Command] Loaded tabs:', tabsList);
        setTabs(tabsList || []);
        setError(null);
      } catch (error) {
        console.error('[Arc Command] Failed to load tabs', error);
        setError(error instanceof Error ? error.message : 'Failed to load tabs');
        setTabs([]);
      } finally {
        setLoading(false);
      }
    }

    loadTabs();

    // Refresh tabs periodically
    const interval = setInterval(loadTabs, 2000);
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

  return { tabs, loading, error, activateTab, createTab };
}

