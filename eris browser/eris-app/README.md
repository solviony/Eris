# Eris

Eris is Solvionyx OS's in-house, Shift-inspired work browser.

## MVP features (this repo)

- **Spaces** (workstreams) with isolated sessions per Space via Electron `partition` (`persist:space-<id>`).
- **Apps**: pinned web apps per Space (open as tabs).
- **Tabs**: vertical list per Space.
- **Omnibox**: URL/search, Back/Forward/Reload.
- **Theme toggle** (system/dark/light) via Electron `nativeTheme`.

## Dev

Requirements: Node.js (LTS) and npm.

```bash
npm install
npm run dev
```

## Build (Linux)

```bash
npm run dist
```

Outputs to `release/` (AppImage + .deb).

## Notes

- This is a foundation. Next iterations should add:
  - Workspace templates, per-space theming, extension support strategy, tab groups, split view.
  - Keyboard shortcuts (Ctrl+L, Ctrl+T, Ctrl+W, Ctrl+1..9).
  - Better app icons (fetch favicon + cache).
  - Enterprise controls for Solvionyx (policies, managed defaults).

