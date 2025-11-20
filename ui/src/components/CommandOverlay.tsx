import { useState, useMemo, useEffect, useRef } from 'react';
import { useSettings } from '../hooks/useSettings';
import { ShortcutRow } from './ShortcutRow';
import { CategoryPills } from './CategoryPills';
import type { Shortcut, ShortcutCategory } from '../types';
import './CommandOverlay.css';

interface CommandOverlayProps {
  shortcuts: Shortcut[];
  categories: ShortcutCategory[];
  onClose: () => void;
}

export function CommandOverlay({ shortcuts, categories, onClose }: CommandOverlayProps) {
  const { settings, setFeature, triggerShortcut } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredShortcuts = useMemo(() => {
    let filtered = shortcuts;

    if (selectedCategory) {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.label.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [shortcuts, selectedCategory, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!settings) {
    return null;
  }

  return (
    <div className="arc-overlay-backdrop" onClick={onClose}>
      <div
        className="arc-overlay-container"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="arc-overlay-header">
          <input
            ref={searchInputRef}
            type="text"
            className="arc-overlay-search"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="arc-overlay-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <CategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <div className="arc-overlay-content">
          {filteredShortcuts.length === 0 ? (
            <div className="arc-overlay-empty">No shortcuts found</div>
          ) : (
            filteredShortcuts.map((shortcut) => (
              <ShortcutRow
                key={shortcut.id}
                shortcut={shortcut}
                enabled={settings.features[shortcut.id] !== false}
                onToggle={(enabled) => setFeature(shortcut.id, enabled)}
                onTrigger={() => {
                  triggerShortcut(shortcut.action, shortcut.id, shortcut);
                  onClose();
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

