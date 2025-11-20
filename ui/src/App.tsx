import { useState, useEffect } from 'react';
import { CommandOverlay } from './components/CommandOverlay';
import { loadShortcuts, SHORTCUTS, SHORTCUT_CATEGORIES } from './data/shortcuts';
import './App.css';

function App() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [shortcutsLoaded, setShortcutsLoaded] = useState(false);

  useEffect(() => {
    loadShortcuts().then(() => {
      setShortcutsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'arc-cmd:toggle-overlay') {
        setShowOverlay((prev) => !prev);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!shortcutsLoaded) {
    return null;
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
