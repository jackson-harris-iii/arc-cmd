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
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
    setHighlightedIndex(0);
  }, [searchQuery, selectedCategory]);

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

  // Scroll highlighted item into view
  useEffect(() => {
    if (contentRef.current && highlightedIndex >= 0) {
      const items = contentRef.current.querySelectorAll('.arc-shortcut-row');
      const item = items[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredShortcuts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && settings) {
      const shortcut = filteredShortcuts[highlightedIndex];
      if (shortcut && settings.features[shortcut.id] !== false) {
        triggerShortcut(shortcut.action, shortcut.id, shortcut);
        onClose();
      }
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

        <div className="arc-overlay-content" ref={contentRef}>
          {filteredShortcuts.length === 0 ? (
            <div className="arc-overlay-empty">No shortcuts found</div>
          ) : (
            filteredShortcuts.map((shortcut, index) => (
              <ShortcutRow
                key={shortcut.id}
                shortcut={shortcut}
                enabled={settings.features[shortcut.id] !== false}
                highlighted={index === highlightedIndex}
                onToggle={(enabled) => setFeature(shortcut.id, enabled)}
                onTrigger={() => {
                  triggerShortcut(shortcut.action, shortcut.id, shortcut);
                  onClose();
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

