# Arc Command Chrome Extension

A Chrome extension that brings Arc Browser's keyboard shortcuts to any Chrome browser, with a beautiful React-based command overlay.

## Features

- **Arc Mode Toggle**: Enable/disable all Arc shortcuts with a single toggle
- **Individual Feature Controls**: Toggle each shortcut category on/off independently
- **Command Overlay**: Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux) to open a beautiful floating command palette
- **Full Shortcut Support**: All Arc browser shortcuts including:
  - Everyday Use (new tab, close tab, pin/unpin, etc.)
  - Quick Navigation (tab switching, history, spaces)
  - Actions (zoom, find, reload, etc.)

## Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm

### Building the Extension

1. **Install UI dependencies:**
   ```bash
   cd ui
   npm install
   ```

2. **Build the React overlay:**
   ```bash
   cd ui
   npm run build
   ```

3. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `arc-cmd` directory

### Project Structure

```
arc-cmd/
├── background.js          # Service worker for tab/window operations
├── content.js             # Content script for keyboard interception
├── shortcuts.js           # Shortcut definitions and categories
├── manifest.json          # Extension manifest
├── popup.html/js          # Extension popup UI
├── options.html/js        # Options page
├── overlay-dist/          # Built React overlay (generated)
└── ui/                    # React overlay source
    ├── src/
    │   ├── components/    # React components
    │   ├── hooks/         # React hooks
    │   └── data/          # Data loading utilities
    └── vite.config.ts     # Vite build config
```

## Usage

1. **Enable Arc Mode**: Click the extension icon and toggle "Arc Mode" on
2. **Open Command Overlay**: Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux)
3. **Customize Shortcuts**: Right-click the extension icon → Options to toggle individual features
4. **Use Shortcuts**: All Arc shortcuts now work when Arc Mode is enabled!

## Shortcuts

See the options page for a complete list of all available shortcuts, organized by category:
- **Everyday Use**: Tab management, window operations
- **Quick Navigation**: Tab switching, history navigation, spaces
- **Actions**: Zoom, find, reload, history

## Notes

Some Arc-specific features are not available in Chrome:
- Split View (not supported by Chrome APIs)
- Sidebar toggle (Chrome doesn't expose this API)
- Address bar focus via shortcut (limited by Chrome)

These shortcuts will show a notification when triggered, explaining the limitation.

## License

MIT

