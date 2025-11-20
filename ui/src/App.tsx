import { useState, useEffect } from 'react';
import { CommandOverlay } from './components/CommandOverlay';
import { loadShortcuts, SHORTCUTS, SHORTCUT_CATEGORIES } from './data/shortcuts';
import './App.css';

function App() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [shortcutsLoaded, setShortcutsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    loadShortcuts()
      .then(() => {
        setShortcutsLoaded(true);
        setLoadingError(null);
      })
      .catch((error) => {
        console.error('Failed to load shortcuts', error);
        setLoadingError('Failed to load shortcuts. Please refresh the page.');
      });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the same window
      if (event.source !== window) return;
      
      if (event.data?.type === 'arc-cmd:toggle-overlay') {
        setShowOverlay((prev) => !prev);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Close overlay on Escape key
  useEffect(() => {
    if (!showOverlay) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowOverlay(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showOverlay]);

  if (!shortcutsLoaded && !loadingError) {
    return null;
  }

  if (loadingError) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(220, 38, 38, 0.9)',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 2147483647,
        fontFamily: 'system-ui, sans-serif'
      }}>
        {loadingError}
      </div>
    );
  }

  return (
    <>
      {showOverlay && (
        <CommandOverlay
          shortcuts={SHORTCUTS}
          categories={SHORTCUT_CATEGORIES}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </>
  );
}

export default App;
