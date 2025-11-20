# React Overlay Plan

## Overview
Replace the current vanilla popup/options UI with a React-based overlay that mimics Arc's command bar. The initial scope focuses on reproducing existing toggles and shortcut categories inside an injected floating UI that appears on top of pages when Arc Mode is active.

## Steps

1. **Tooling Setup**
   - Add a lightweight React build pipeline (Vite or esbuild) inside `ui/`.
   - Configure npm scripts (`npm install`, `npm run build`) producing assets under `dist/` consumed by the extension.
   - Update `.gitignore` to exclude `node_modules/` and build artifacts.

2. **Manifest & Packaging**
   - Reference the compiled React bundle (e.g., `dist/overlay.js`, `dist/overlay.css`) from `content.js`.
   - Ensure `web_accessible_resources` exposes the built assets so the content script can inject them.

3. **Overlay React App**
   - Create a `CommandPalette` component featuring:
     - Search field
     - Category pills (Actions, Everyday Use, Quick Navigation)
     - List of shortcuts with icons, descriptions, and enable toggles
   - Manage state via hooks, syncing with `chrome.storage.sync`.
   - Provide keyboard handling to open/close the palette (e.g., Command+K while Arc Mode on).

4. **Content Script Integration**
   - Lazy-load the React overlay bundle when Arc Mode activates.
   - Mount the overlay into the page (portal/root div) and expose open/close helpers.
   - Ensure keyboard events still route through the existing shortcut logic, but showing the overlay when the user presses the palette shortcut.

5. **Styling & UX**
   - Mirror Arc aesthetic: floating rounded panel, translucent background, icons per shortcut.
   - Include toggle controls to enable/disable shortcuts directly inside the palette.
   - Provide visual feedback for unsupported shortcuts (badges, tooltips).

6. **Testing**
   - Load the unpacked extension and validate:
     - React overlay loads and unmounts cleanly across different sites.
     - Storage sync reflects toggle changes in popup/options (if still exposed).
     - Shortcuts remain functional while overlay is open/closed.


