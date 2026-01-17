import React, { useEffect, useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid'

type AppPin = {
  id: string
  name: string
  url: string
}

type Space = {
  id: string
  name: string
  emoji?: string
  color?: string
  apps: AppPin[]
}

type Tab = {
  id: string
  spaceId: string
  url: string
  title?: string
  favicon?: string
  pinnedAppId?: string
}

const DEFAULT_SPACES: Space[] = [
  { id: 'work', name: 'Work', emoji: '💼', color: '#49a7ff', apps: [] },
  { id: 'personal', name: 'Personal', emoji: '🌙', color: '#9b6bff', apps: [] },
]

function normalizeUrl(raw: string): string {
  const v = raw.trim()
  if (!v) return 'about:blank'
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('file://') || v.startsWith('about:')) return v
  // Heuristic: treat as URL if it contains a dot and no spaces
  if (v.includes('.') && !v.includes(' ')) return `https://${v}`
  return `https://www.google.com/search?q=${encodeURIComponent(v)}`
}

export default function App() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [activeSpaceId, setActiveSpaceId] = useState<string>('')
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [omnibox, setOmnibox] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)

  const webviewsRef = useRef<Record<string, any>>({})

  const activeSpace = useMemo(() => spaces.find(s => s.id === activeSpaceId) || null, [spaces, activeSpaceId])
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || null, [tabs, activeTabId])

  useEffect(() => {
    ;(async () => {
      const state = await window.eris.getState()
      const loadedSpaces: Space[] = (state.spaces?.length ? state.spaces : DEFAULT_SPACES).map((s: any) => ({
        id: String(s.id),
        name: String(s.name ?? 'Space'),
        emoji: s.emoji,
        color: s.color,
        apps: Array.isArray(s.apps) ? s.apps : []
      }))

      setSpaces(loadedSpaces)
      setActiveSpaceId(loadedSpaces[0]?.id ?? '')
      // Start with a single tab per first space
      const firstSpaceId = loadedSpaces[0]?.id
      const t0: Tab[] = firstSpaceId
        ? [{ id: nanoid(), spaceId: firstSpaceId, url: 'https://solviony.com', title: 'New Tab' }]
        : []
      setTabs(t0)
      setActiveTabId(t0[0]?.id ?? '')
      setOmnibox('https://solviony.com')
      setIsLoaded(true)
    })()
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    window.eris.saveSpaces(spaces)
  }, [spaces, isLoaded])

  useEffect(() => {
    // keep omnibox synced to active tab
    if (activeTab?.url) setOmnibox(activeTab.url)
  }, [activeTabId])

  const spaceTabs = useMemo(() => tabs.filter(t => t.spaceId === activeSpaceId), [tabs, activeSpaceId])

  function createSpace() {
    const id = nanoid(6)
    const s: Space = { id, name: `Space ${spaces.length + 1}`, emoji: '🪐', color: '#49a7ff', apps: [] }
    setSpaces(prev => [...prev, s])
    setActiveSpaceId(id)
    // create a new tab for that space
    const tab: Tab = { id: nanoid(), spaceId: id, url: 'https://www.google.com', title: 'New Tab' }
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }

  function removeSpace(spaceId: string) {
    if (spaces.length <= 1) return
    const partition = `persist:space-${spaceId}`
    window.eris.clearPartition(partition).catch(() => {})

    setSpaces(prev => prev.filter(s => s.id !== spaceId))
    setTabs(prev => prev.filter(t => t.spaceId !== spaceId))

    if (activeSpaceId === spaceId) {
      const remaining = spaces.filter(s => s.id !== spaceId)
      const nextSpace = remaining[0]
      setActiveSpaceId(nextSpace.id)
      const nextTab = tabs.find(t => t.spaceId === nextSpace.id)
      if (nextTab) setActiveTabId(nextTab.id)
    }
  }

  function newTab(url?: string) {
    if (!activeSpaceId) return
    const tab: Tab = { id: nanoid(), spaceId: activeSpaceId, url: url ? normalizeUrl(url) : 'https://www.google.com', title: 'New Tab' }
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }

  function closeTab(tabId: string) {
    const t = tabs.find(x => x.id === tabId)
    if (!t) return

    setTabs(prev => prev.filter(x => x.id !== tabId))

    // if closing active tab, pick a neighbor within same space
    if (activeTabId === tabId) {
      const siblings = tabs.filter(x => x.spaceId === t.spaceId)
      const idx = siblings.findIndex(x => x.id === tabId)
      const next = siblings[idx + 1] ?? siblings[idx - 1]
      if (next) setActiveTabId(next.id)
      else newTab()
    }

    // clean ref
    delete webviewsRef.current[tabId]
  }

  function navigate(tabId: string, raw: string) {
    const url = normalizeUrl(raw)
    setTabs(prev => prev.map(t => (t.id === tabId ? { ...t, url } : t)))

    const wv = webviewsRef.current[tabId]
    if (wv) wv.loadURL(url)
  }

  function addApp() {
    if (!activeSpace) return
    const url = prompt('App URL (e.g., https://mail.google.com)')
    if (!url) return
    const name = prompt('App name') || new URL(normalizeUrl(url)).hostname
    const pin: AppPin = { id: nanoid(6), name, url: normalizeUrl(url) }
    setSpaces(prev => prev.map(s => (s.id === activeSpace.id ? { ...s, apps: [...s.apps, pin] } : s)))
  }

  function openApp(pin: AppPin) {
    // Apps open as a tab, but mark as pinnedAppId to keep title synced
    const tab: Tab = { id: nanoid(), spaceId: activeSpaceId, url: pin.url, title: pin.name, pinnedAppId: pin.id }
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }

  function attachWebviewEvents(tabId: string, el: any) {
    webviewsRef.current[tabId] = el

    const updateTitle = () => {
      setTabs(prev =>
        prev.map(t =>
          t.id === tabId
            ? {
                ...t,
                title: el.getTitle() || t.title,
                url: el.getURL() || t.url
              }
            : t
        )
      )
    }

    const updateFavicon = (_e: any, favicons: string[]) => {
      const favicon = favicons?.[0]
      if (!favicon) return
      setTabs(prev => prev.map(t => (t.id === tabId ? { ...t, favicon } : t)))
    }

    el.addEventListener('page-title-updated', updateTitle as any)
    el.addEventListener('did-navigate', updateTitle as any)
    el.addEventListener('did-navigate-in-page', updateTitle as any)
    el.addEventListener('page-favicon-updated', updateFavicon as any)

    // Clean up on destroy
    el.addEventListener('destroyed', () => {
      delete webviewsRef.current[tabId]
    })
  }

  if (!isLoaded) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <div className="card" style={{ padding: 24, width: 420 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Eris</div>
          <div style={{ marginTop: 8, color: 'var(--muted)' }}>Starting…</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* Rail */}
      <div
        style={{
          width: 72,
          padding: 10,
          borderRight: '1px solid var(--stroke)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div className="card" style={{ padding: 12, borderRadius: 18 }}>
          <div style={{ fontWeight: 800, letterSpacing: 0.4 }}>ERIS</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Solvionyx</div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', paddingRight: 2 }}>
          {spaces.map(s => {
            const active = s.id === activeSpaceId
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSpaceId(s.id)
                  const t = tabs.find(x => x.spaceId === s.id)
                  if (t) setActiveTabId(t.id)
                }}
                title={s.name}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 18,
                  border: active ? '1px solid rgba(73,167,255,0.6)' : '1px solid var(--stroke)',
                  background: active ? 'rgba(73,167,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: 10
                }}
              >
                <div style={{ fontSize: 20 }}>{s.emoji ?? '🪐'}</div>
              </button>
            )
          })}
        </div>

        <button
          onClick={createSpace}
          title="New Space"
          style={{
            width: '100%',
            height: 44,
            borderRadius: 16,
            border: '1px dashed var(--stroke)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--muted)',
            cursor: 'pointer'
          }}
        >
          +
        </button>
      </div>

      {/* Sidebar */}
      <div style={{ width: 310, borderRight: '1px solid var(--stroke)', display: 'flex', flexDirection: 'column' }}>
        {/* Space header */}
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 18 }}>{activeSpace?.emoji ?? '🪐'}</div>
          <input
            value={activeSpace?.name ?? ''}
            onChange={e => {
              const v = e.target.value
              setSpaces(prev => prev.map(s => (s.id === activeSpaceId ? { ...s, name: v } : s)))
            }}
            style={{
              flex: 1,
              border: '1px solid var(--stroke)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 14,
              padding: '10px 12px',
              color: 'var(--text)'
            }}
          />
          <button
            onClick={() => removeSpace(activeSpaceId)}
            title="Remove Space"
            style={{
              borderRadius: 14,
              border: '1px solid var(--stroke)',
              background: 'rgba(255,77,77,0.08)',
              color: 'var(--danger)',
              padding: '10px 12px',
              cursor: spaces.length <= 1 ? 'not-allowed' : 'pointer',
              opacity: spaces.length <= 1 ? 0.5 : 1
            }}
            disabled={spaces.length <= 1}
          >
            ✕
          </button>
        </div>

        {/* Omnibox */}
        <div style={{ padding: '0 14px 12px', display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              const wv = activeTab ? webviewsRef.current[activeTab.id] : null
              wv?.goBack()
            }}
            title="Back"
            style={iconBtn}
          >
            ←
          </button>
          <button
            onClick={() => {
              const wv = activeTab ? webviewsRef.current[activeTab.id] : null
              wv?.goForward()
            }}
            title="Forward"
            style={iconBtn}
          >
            →
          </button>
          <button
            onClick={() => {
              const wv = activeTab ? webviewsRef.current[activeTab.id] : null
              wv?.reload()
            }}
            title="Reload"
            style={iconBtn}
          >
            ↻
          </button>

          <form
            onSubmit={e => {
              e.preventDefault()
              if (!activeTab) return
              navigate(activeTab.id, omnibox)
            }}
            style={{ flex: 1 }}
          >
            <input
              value={omnibox}
              onChange={e => setOmnibox(e.target.value)}
              placeholder="Search or enter URL"
              style={{
                width: '100%',
                border: '1px solid var(--stroke)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                padding: '10px 12px',
                color: 'var(--text)'
              }}
            />
          </form>

          <button onClick={() => newTab()} title="New Tab" style={{ ...iconBtn, width: 44 }}>
            +
          </button>
        </div>

        {/* Apps */}
        <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 700, color: 'var(--muted)' }}>Apps</div>
          <div style={{ flex: 1 }} />
          <button onClick={addApp} style={{ ...miniBtn }}>
            Add
          </button>
        </div>

        <div style={{ padding: '0 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {activeSpace?.apps?.length ? (
            activeSpace.apps.map(a => (
              <button key={a.id} onClick={() => openApp(a)} style={pillBtn} title={a.url}>
                {a.name}
              </button>
            ))
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 2px' }}>Pin your web apps here.</div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 700, color: 'var(--muted)' }}>Tabs</div>
          <div style={{ flex: 1 }} />
          <div className="kbd">Ctrl+L</div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 10px 14px' }}>
          {spaceTabs.map(t => {
            const active = t.id === activeTabId
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 10px',
                  borderRadius: 14,
                  margin: '0 4px 8px',
                  border: active ? '1px solid rgba(73,167,255,0.55)' : '1px solid var(--stroke)',
                  background: active ? 'rgba(73,167,255,0.12)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTabId(t.id)}
              >
                <div style={{ width: 18, height: 18, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.25)' }}>
                  {t.favicon ? <img src={t.favicon} style={{ width: '100%', height: '100%' }} /> : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title ?? 'Tab'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.url}
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    closeTab(t.id)
                  }}
                  title="Close"
                  style={{
                    border: '1px solid var(--stroke)',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 12,
                    width: 34,
                    height: 34,
                    color: 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: 14, borderTop: '1px solid var(--stroke)', display: 'flex', gap: 10 }}>
          <button
            style={{ ...miniBtn, flex: 1 }}
            onClick={async () => {
              const next = prompt('Theme: system | dark | light', 'system') as any
              if (!next) return
              const v = ['system', 'dark', 'light'].includes(next) ? next : 'system'
              await window.eris.setTheme(v)
            }}
          >
            Theme
          </button>
          <button
            style={{ ...miniBtn, flex: 1 }}
            onClick={() => {
              // quick “clean” for current space
              window.eris.clearPartition(`persist:space-${activeSpaceId}`).catch(() => {})
            }}
          >
            Clear Space
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {tabs.map(t => {
          const visible = t.id === activeTabId
          const partition = `persist:space-${t.spaceId}`
          return (
            <webview
              key={t.id}
              ref={el => {
                if (el) attachWebviewEvents(t.id, el)
              }}
              partition={partition}
              src={t.url}
              style={{
                position: 'absolute',
                inset: 0,
                border: 'none',
                display: visible ? 'flex' : 'none',
                background: 'var(--bg)'
              }}
              allowpopups="true"
            />
          )
        })}
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 14,
  border: '1px solid var(--stroke)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text)',
  cursor: 'pointer'
}

const miniBtn: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid var(--stroke)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text)',
  padding: '8px 10px',
  cursor: 'pointer'
}

const pillBtn: React.CSSProperties = {
  borderRadius: 999,
  border: '1px solid var(--stroke)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text)',
  padding: '8px 12px',
  cursor: 'pointer',
  maxWidth: '100%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}
