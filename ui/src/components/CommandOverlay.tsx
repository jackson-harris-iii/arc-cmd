import { useState, useMemo, useEffect, useRef } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useTabs } from '../hooks/useTabs';
import { TabRow } from './TabRow';
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
  const { tabs, loading: tabsLoading, activateTab, createTab } = useTabs();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [viewMode] = useState<'tabs' | 'shortcuts'>('tabs');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus search input immediately
    searchInputRef.current?.focus();
    setHighlightedIndex(0);
  }, [searchQuery, selectedCategory, viewMode]);

  // Filter tabs based on search query
  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) {
      return tabs;
    }
    const query = searchQuery.toLowerCase();
    return tabs.filter(
      (tab) =>
        (tab.title || '').toLowerCase().includes(query) ||
        (tab.url || '').toLowerCase().includes(query)
    );
  }, [tabs, searchQuery]);

  // Filter shortcuts based on search query and category
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

  // Determine which list to use
  const currentList = viewMode === 'tabs' ? filteredTabs : filteredShortcuts;
  const maxIndex = currentList.length - 1;

  // Scroll highlighted item into view
  useEffect(() => {
    if (contentRef.current && highlightedIndex >= 0) {
      const selector = viewMode === 'tabs' ? '.arc-tab-row' : '.arc-shortcut-row';
      const items = contentRef.current.querySelectorAll(selector);
      const item = items[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, viewMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (viewMode === 'tabs') {
        if (filteredTabs.length > 0 && highlightedIndex < filteredTabs.length) {
          const tab = filteredTabs[highlightedIndex];
          if (tab.id) {
            activateTab(tab.id);
            onClose();
          }
        } else if (searchQuery.trim()) {
          // No matches, treat as URL/search query
          createTab(searchQuery);
          onClose();
        }
      } else if (settings) {
        const shortcut = filteredShortcuts[highlightedIndex];
        if (shortcut && settings.features[shortcut.id] !== false) {
          triggerShortcut(shortcut.action, shortcut.id, shortcut);
          onClose();
        }
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
            placeholder={viewMode === 'tabs' ? 'Search tabs or type URL...' : 'Search shortcuts...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            autoFocus
          />
          <button className="arc-overlay-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {viewMode === 'shortcuts' && (
          <CategoryPills
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        <div className="arc-overlay-content" ref={contentRef}>
          {viewMode === 'tabs' ? (
            tabsLoading ? (
              <div className="arc-overlay-empty">Loading tabs...</div>
            ) : filteredTabs.length === 0 ? (
              <div className="arc-overlay-empty">
                {searchQuery.trim() ? 'No tabs found. Press Enter to open as URL/search.' : 'No tabs found'}
              </div>
            ) : (
              filteredTabs.map((tab, index) => (
                <TabRow
                  key={tab.id}
                  tab={tab}
                  highlighted={index === highlightedIndex}
                  onSelect={() => {
                    if (tab.id) {
                      activateTab(tab.id);
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                />
              ))
            )
          ) : filteredShortcuts.length === 0 ? (
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

