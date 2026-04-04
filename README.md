# Eris

**Eris** is Solvionyx OS's in-house work browser — built on Electron + React + TypeScript. Organize work into isolated Spaces, pin web apps, and route traffic through built-in VPN proxy support.

> v0.2.0 — Full rewrite on the TypeScript/React/electron-vite stack.

---

## Features

| | |
|---|---|
| **Spaces** | Isolated browser sessions via Electron `persist:space-<id>` partitions — separate cookies, storage, and logins per Space |
| **Apps** | Pinned web apps per Space, displayed in a quick-launch grid |
| **Vertical Tabs** | Per-Space tab list with live favicons, titles, and loading indicator |
| **Omnibox** | URL bar with Back · Forward · Reload; falls back to DuckDuckGo search |
| **Built-in VPN** | Proxy routing via `session.setProxy()` — SOCKS5, SOCKS4, HTTP; scope per-Space or all Spaces |
| **New Tab Page** | Clean NTP with clock, search bar, and quick links |
| **Theme** | Dark / Light / System via Electron `nativeTheme` |
| **Auto-updater** | GitHub Releases integration via `electron-updater` |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘T` / `Ctrl+T` | New tab |
| `⌘W` / `Ctrl+W` | Close tab |
| `⌘L` / `Ctrl+L` | Focus omnibox |
| `⌘R` / `Ctrl+R` | Reload |
| `⌘1`–`⌘9` | Switch to Space 1–9 |

---

## VPN

Eris proxies traffic at the Electron `session` level — the same mechanism browser VPN extensions use, but applied natively.

**Built-in servers** (require local daemon):

| Server | Protocol | Default |
|---|---|---|
| Cloudflare WARP | SOCKS5 | `127.0.0.1:40000` |
| Tor | SOCKS5 | `127.0.0.1:9050` |
| Privoxy | HTTP | `127.0.0.1:8118` |
| Squid | HTTP | `127.0.0.1:3128` |

**Custom servers** — add any SOCKS5 / SOCKS4 / HTTP proxy via the VPN panel.

**Scope** — apply proxy to just the current Space, or all Spaces at once.

---

## Dev

Requires Node.js LTS (18+) and npm.

```bash
npm install
npm run dev
```

---

## Build

```bash
npm run dist          # current platform
npm run dist:mac      # macOS .dmg
npm run dist:win      # Windows .exe (NSIS)
npm run dist:linux    # Linux .AppImage + .deb
```

Outputs to `release/`.

---

## Project Structure

```
src/
├── main/
│   └── index.ts               # Electron main — window, store, VPN IPC, auto-updater
├── preload/
│   └── index.ts               # contextBridge — exposes window.eris + window.erisUpdater
└── renderer/
    ├── index.html
    └── src/
        ├── App.tsx             # Root layout
        ├── types.ts            # All TypeScript types + global declarations
        ├── hooks/
        │   └── useBrowser.ts   # All browser state + actions
        ├── components/
        │   ├── SpaceRail.tsx   # Left rail — space switcher
        │   ├── Sidebar.tsx     # Space header, apps grid, tab list
        │   ├── Navbar.tsx      # Omnibox, nav controls, VPN pill
        │   ├── BrowserStage.tsx# Webview container + NTP routing
        │   ├── Ntp.tsx         # New Tab Page
        │   ├── VpnPanel.tsx    # Slide-in VPN panel
        │   └── UpdateBanner.tsx# Auto-update toast
        └── styles/
            └── global.css      # Design tokens + reset
```

---

## Roadmap

- [ ] Tab groups
- [ ] Split view
- [ ] Extension support (Manifest V3 strategy)
- [ ] Per-Space theming
- [ ] Workspace templates
- [ ] WARP daemon auto-start
- [ ] Solvionyx account sync
- [ ] Password manager integration

---

*Part of [Solvionyx OS](https://solviony.com)*
