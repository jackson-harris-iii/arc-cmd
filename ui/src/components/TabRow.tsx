import type { Tab } from '../types/bridge';
import './TabRow.css';

interface TabRowProps {
  tab: Tab;
  highlighted: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

export function TabRow({ tab, highlighted, onSelect, onMouseEnter }: TabRowProps) {
  const getDomain = (url?: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getTitle = () => {
    return tab.title || getDomain(tab.url) || 'Untitled';
  };

  return (
    <div
      className={`arc-tab-row ${highlighted ? 'arc-tab-row-highlighted' : ''} ${tab.active ? 'arc-tab-row-active' : ''}`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <div className="arc-tab-icon">
        {tab.favIconUrl ? (
          <img src={tab.favIconUrl} alt="" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
        ) : (
          <div className="arc-tab-icon-placeholder"></div>
        )}
      </div>
      <div className="arc-tab-info">
        <div className="arc-tab-title">{getTitle()}</div>
        <div className="arc-tab-url">{getDomain(tab.url)}</div>
      </div>
      {tab.active && <div className="arc-tab-active-indicator">Active</div>}
    </div>
  );
}

