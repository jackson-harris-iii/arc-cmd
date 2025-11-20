import type { Shortcut } from '../types';
import './ShortcutRow.css';

interface ShortcutRowProps {
  shortcut: Shortcut;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onTrigger: () => void;
}

export function ShortcutRow({ shortcut, enabled, onToggle, onTrigger }: ShortcutRowProps) {
  const isUnsupported = shortcut.action.startsWith('unsupported');

  return (
    <div className={`arc-shortcut-row ${!enabled ? 'arc-shortcut-disabled' : ''}`}>
      <div className="arc-shortcut-info" onClick={onTrigger}>
        <div className="arc-shortcut-label-row">
          <span className="arc-shortcut-label">{shortcut.label}</span>
          {isUnsupported && (
            <span className="arc-shortcut-badge">Not available in Chrome</span>
          )}
        </div>
        <span className="arc-shortcut-description">{shortcut.description}</span>
      </div>
      <label className="arc-shortcut-toggle">
        <input
          type="checkbox"
          checked={enabled}
          disabled={isUnsupported}
          onChange={(e) => onToggle(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="arc-shortcut-toggle-slider"></span>
      </label>
    </div>
  );
}

