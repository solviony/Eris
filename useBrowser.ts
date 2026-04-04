import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import {
  type AppPin, type ProxyConfig, type Space, type Tab,
  type ThemeMode, type VpnScope, type VpnServer,
  BUILTIN_SERVERS, SPACE_COLORS, SPACE_EMOJIS,
} from '../types'

// ─── URL normalizer ───────────────────────────────────────────────────────────

export function normalizeUrl(raw: string): string {
  const v = raw.trim()
  if (!v || v === 'about:blank') return 'about:newtab'
  if (v === 'about:newtab') return 'about:newtab'
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('file://')) return v
  if (v.includes('.') && !v.includes(' ')) return `https://${v}`
  return `https://duckduckgo.com/?q=${encodeURIComponent(v)}`
}

function partition(spaceId: string) {
  return `persist:space-${spaceId}`
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBrowser() {
  const [ready, setReady] = useState(false)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [activeSpaceId, setActiveSpaceId] = useState<string>('')
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [omnibox, setOmnibox] = useState('')
  const [vpnEnabled, setVpnEnabled] = useState(false)
  const [vpnConnecting, setVpnConnecting] = useState(false)
  const [vpnServerId, setVpnServerId] = useState<string | null>('warp')
  const [vpnScope, setVpnScope] = useState<VpnScope>('space')
  const [customServers, setCustomServers] = useState<VpnServer[]>([])
  const [vpnIp, setVpnIp] = useState<string | null>(null)
  const [vpnPanelOpen, setVpnPanelOpen] = useState(false)

  const webviewRefs = useRef<Record<string, HTMLElement>>({})

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? null
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null
  const spaceTabs = tabs.filter((t) => t.spaceId === activeSpaceId)
  const allServers: VpnServer[] = [...BUILTIN_SERVERS, ...customServers]

  // ─── Load state ──────────────────────────────────────────────────────────────

  useEffect(() => {
    ;(async () => {
      const state = await window.eris.getState()

      const th = state.ui.theme
      setThemeState(th)

      const customSvrs: VpnServer[] = (state.vpn?.customServers ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        proxy: s.proxy,
        builtin: false,
      }))
      setCustomServers(customSvrs)

      const loadedSpaces: Space[] =
        state.spaces?.length
          ? (state.spaces as any[]).map((s) => ({
              id: String(s.id),
              name: String(s.name ?? 'Space'),
              emoji: s.emoji ?? '🪐',
              color: s.color ?? SPACE_COLORS[0],
              apps: Array.isArray(s.apps) ? s.apps : [],
            }))
          : [
              { id: 'work', name: 'Work', emoji: '💼', color: SPACE_COLORS[0], apps: [] },
              { id: 'personal', name: 'Personal', emoji: '🌙', color: SPACE_COLORS[1], apps: [] },
            ]

      setSpaces(loadedSpaces)
      const firstId = loadedSpaces[0].id
      setActiveSpaceId(firstId)

      const firstTab: Tab = {
        id: nanoid(),
        spaceId: firstId,
        url: 'about:newtab',
        title: 'New Tab',
        loading: false,
      }
      setTabs([firstTab])
      setActiveTabId(firstTab.id)
      setOmnibox('')
      setReady(true)
    })()
  }, [])

  // ─── Persist spaces ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!ready) return
    window.eris.saveSpaces(spaces)
  }, [spaces, ready])

  // ─── Sync omnibox to active tab ───────────────────────────────────────────────

  useEffect(() => {
    if (!activeTab) return
    setOmnibox(activeTab.url === 'about:newtab' ? '' : activeTab.url)
  }, [activeTabId])

  // ─── Theme ───────────────────────────────────────────────────────────────────

  const setTheme = useCallback(async (t: ThemeMode) => {
    setThemeState(t)
    await window.eris.setTheme(t)
  }, [])

  // ─── Spaces ───────────────────────────────────────────────────────────────────

  const createSpace = useCallback(() => {
    const idx = spaces.length
    const id = nanoid(6)
    const sp: Space = {
      id,
      name: `Space ${idx + 1}`,
      emoji: SPACE_EMOJIS[idx % SPACE_EMOJIS.length],
      color: SPACE_COLORS[idx % SPACE_COLORS.length],
      apps: [],
    }
    setSpaces((prev) => [...prev, sp])
    const tab: Tab = { id: nanoid(), spaceId: id, url: 'about:newtab', title: 'New Tab', loading: false }
    setTabs((prev) => [...prev, tab])
    setActiveSpaceId(id)
    setActiveTabId(tab.id)
    setOmnibox('')
  }, [spaces.length])

  const deleteSpace = useCallback(
    (spaceId: string) => {
      if (spaces.length <= 1) return
      window.eris.clearPartition(partition(spaceId)).catch(() => {})
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId))
      setTabs((prev) => prev.filter((t) => t.spaceId !== spaceId))
      if (activeSpaceId === spaceId) {
        const remaining = spaces.filter((s) => s.id !== spaceId)
        const next = remaining[0]
        setActiveSpaceId(next.id)
        const nextTab = tabs.find((t) => t.spaceId === next.id)
        if (nextTab) setActiveTabId(nextTab.id)
      }
    },
    [spaces, tabs, activeSpaceId]
  )

  const selectSpace = useCallback(
    (spaceId: string) => {
      setActiveSpaceId(spaceId)
      const t = tabs.find((x) => x.spaceId === spaceId)
      if (t) {
        setActiveTabId(t.id)
        setOmnibox(t.url === 'about:newtab' ? '' : t.url)
      }
    },
    [tabs]
  )

  const updateSpace = useCallback((spaceId: string, patch: Partial<Omit<Space, 'id' | 'apps'>>) => {
    setSpaces((prev) => prev.map((s) => (s.id === spaceId ? { ...s, ...patch } : s)))
  }, [])

  // ─── Apps ─────────────────────────────────────────────────────────────────────

  const addApp = useCallback(
    (spaceId: string, pin: Omit<AppPin, 'id'>) => {
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === spaceId ? { ...s, apps: [...s.apps, { id: nanoid(6), ...pin }] } : s
        )
      )
    },
    []
  )

  const removeApp = useCallback((spaceId: string, appId: string) => {
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, apps: s.apps.filter((a) => a.id !== appId) } : s))
    )
  }, [])

  const openApp = useCallback(
    (pin: AppPin) => {
      const tab: Tab = {
        id: nanoid(),
        spaceId: activeSpaceId,
        url: normalizeUrl(pin.url),
        title: pin.name,
        loading: false,
        pinnedAppId: pin.id,
      }
      setTabs((prev) => [...prev, tab])
      setActiveTabId(tab.id)
      setOmnibox(tab.url)
    },
    [activeSpaceId]
  )

  // ─── Tabs ─────────────────────────────────────────────────────────────────────

  const newTab = useCallback(
    (url?: string) => {
      const resolved = url ? normalizeUrl(url) : 'about:newtab'
      const tab: Tab = {
        id: nanoid(),
        spaceId: activeSpaceId,
        url: resolved,
        title: resolved === 'about:newtab' ? 'New Tab' : resolved,
        loading: false,
      }
      setTabs((prev) => [...prev, tab])
      setActiveTabId(tab.id)
      setOmnibox(resolved === 'about:newtab' ? '' : resolved)
    },
    [activeSpaceId]
  )

  const closeTab = useCallback(
    (tabId: string) => {
      const t = tabs.find((x) => x.id === tabId)
      if (!t) return
      delete webviewRefs.current[tabId]
      const siblings = tabs.filter((x) => x.spaceId === t.spaceId)
      setTabs((prev) => prev.filter((x) => x.id !== tabId))

      if (activeTabId === tabId) {
        const idx = siblings.findIndex((x) => x.id === tabId)
        const next = siblings[idx + 1] ?? siblings[idx - 1]
        if (next) {
          setActiveTabId(next.id)
          setOmnibox(next.url === 'about:newtab' ? '' : next.url)
        } else {
          // Open a blank tab so the space isn't empty
          const blank: Tab = {
            id: nanoid(),
            spaceId: t.spaceId,
            url: 'about:newtab',
            title: 'New Tab',
            loading: false,
          }
          setTabs((prev) => [...prev.filter((x) => x.id !== tabId), blank])
          setActiveTabId(blank.id)
          setOmnibox('')
        }
      }
    },
    [tabs, activeTabId]
  )

  const selectTab = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId)
      const t = tabs.find((x) => x.id === tabId)
      if (t) setOmnibox(t.url === 'about:newtab' ? '' : t.url)
    },
    [tabs]
  )

  const navigate = useCallback(
    (raw: string) => {
      if (!activeTabId) return
      const url = normalizeUrl(raw)
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, url, title: url, loading: true } : t)))
      setOmnibox(url)
      const wv = webviewRefs.current[activeTabId] as any
      if (wv?.loadURL) wv.loadURL(url)
    },
    [activeTabId]
  )

  const goBack = useCallback(() => {
    const wv = webviewRefs.current[activeTabId] as any
    if (wv?.canGoBack?.()) wv.goBack()
  }, [activeTabId])

  const goForward = useCallback(() => {
    const wv = webviewRefs.current[activeTabId] as any
    if (wv?.canGoForward?.()) wv.goForward()
  }, [activeTabId])

  const reload = useCallback(() => {
    const wv = webviewRefs.current[activeTabId] as any
    if (wv?.reload) wv.reload()
  }, [activeTabId])

  // ─── Webview event wiring ─────────────────────────────────────────────────────

  const toggleVpnPanel = useCallback(() => setVpnPanelOpen((v) => !v), [])

  const attachWebview = useCallback((tabId: string, el: HTMLElement | null) => {
    if (!el) {
      delete webviewRefs.current[tabId]
      return
    }
    // Already wired up
    if (webviewRefs.current[tabId] === el) return
    webviewRefs.current[tabId] = el
    const wv = el as any

    const onTitle = () => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? { ...t, title: wv.getTitle() || t.title, url: wv.getURL() || t.url }
            : t
        )
      )
    }

    const onFavicon = (_e: any, favicons: string[]) => {
      const favicon = favicons?.[0]
      if (!favicon) return
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, favicon } : t)))
    }

    const onStartLoad = () =>
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, loading: true } : t)))

    const onStopLoad = () => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? { ...t, loading: false, title: wv.getTitle() || t.title, url: wv.getURL() || t.url }
            : t
        )
      )
      // sync omnibox if still active tab
      setActiveTabId((cur) => {
        if (cur === tabId) setOmnibox(wv.getURL?.() || '')
        return cur
      })
    }

    const onNewWindow = (e: any) => {
      e.preventDefault?.()
      if (e.url) window.open(e.url)
    }

    wv.addEventListener('did-start-loading', onStartLoad)
    wv.addEventListener('did-stop-loading', onStopLoad)
    wv.addEventListener('page-title-updated', onTitle)
    wv.addEventListener('did-navigate', onTitle)
    wv.addEventListener('did-navigate-in-page', onTitle)
    wv.addEventListener('page-favicon-updated', onFavicon)
    wv.addEventListener('new-window', onNewWindow)
  }, [])

  // ─── VPN ──────────────────────────────────────────────────────────────────────

  const vpnConnect = useCallback(async () => {
    if (!vpnServerId) return
    const server = allServers.find((s) => s.id === vpnServerId)
    if (!server) return
    setVpnConnecting(true)
    try {
      const cfg: ProxyConfig = server.proxy
      if (vpnScope === 'all') {
        const parts = spaces.map((s) => partition(s.id))
        await window.eris.setAllProxy(parts, cfg)
      } else {
        await window.eris.setProxy(partition(activeSpaceId), cfg)
      }
      setVpnEnabled(true)
      checkIp()
    } finally {
      setVpnConnecting(false)
    }
  }, [vpnServerId, vpnScope, allServers, spaces, activeSpaceId])

  const vpnDisconnect = useCallback(async () => {
    const parts = spaces.map((s) => partition(s.id))
    await window.eris.setAllProxy(parts, null)
    setVpnEnabled(false)
    setVpnIp(null)
  }, [spaces])

  const checkIp = useCallback(async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json')
      const { ip } = await res.json()
      setVpnIp(ip)
    } catch {
      setVpnIp(null)
    }
  }, [])

  const addCustomServer = useCallback(
    (server: Omit<VpnServer, 'id' | 'builtin'>) => {
      const s: VpnServer = { id: nanoid(6), builtin: false, ...server }
      setCustomServers((prev) => {
        const next = [...prev, s]
        window.eris.saveVpnCustomServers(next).catch(() => {})
        return next
      })
    },
    []
  )

  const removeCustomServer = useCallback((id: string) => {
    setCustomServers((prev) => {
      const next = prev.filter((s) => s.id !== id)
      window.eris.saveVpnCustomServers(next).catch(() => {})
      return next
    })
  }, [])

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!ready) return
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return

      if (e.key === 't') { e.preventDefault(); newTab() }
      if (e.key === 'w') { e.preventDefault(); closeTab(activeTabId) }
      if (e.key === 'r') { e.preventDefault(); reload() }
      if (e.key === 'l') {
        e.preventDefault()
        document.getElementById('omnibox')?.focus()
      }
      // Cmd+1..9: switch spaces
      const n = parseInt(e.key)
      if (!isNaN(n) && n >= 1 && n <= 9 && spaces[n - 1]) {
        e.preventDefault()
        selectSpace(spaces[n - 1].id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [ready, newTab, closeTab, activeTabId, reload, selectSpace, spaces])

  return {
    // State
    ready,
    spaces,
    activeSpaceId,
    activeSpace,
    tabs,
    spaceTabs,
    activeTabId,
    activeTab,
    omnibox,
    setOmnibox,
    theme,
    webviewRefs,
    // VPN
    vpnEnabled,
    vpnConnecting,
    vpnServerId,
    setVpnServerId,
    vpnScope,
    setVpnScope,
    customServers,
    allServers,
    vpnIp,
    vpnPanelOpen,
    setVpnPanelOpen,
    // Actions
    setTheme,
    createSpace,
    deleteSpace,
    selectSpace,
    updateSpace,
    addApp,
    removeApp,
    openApp,
    newTab,
    closeTab,
    selectTab,
    navigate,
    goBack,
    goForward,
    reload,
    attachWebview,
    toggleVpnPanel,
    vpnConnect,
    vpnDisconnect,
    checkIp,
    addCustomServer,
    removeCustomServer,
  }
}
