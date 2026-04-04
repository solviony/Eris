import React, { useState } from 'react'
import type { AppPin, Space, Tab } from '../types'
import { normalizeUrl } from '../hooks/useBrowser'
import { SPACE_COLORS, SPACE_EMOJIS } from '../types'

interface Props {
  space: Space | null
  spaceTabs: Tab[]
  activeTabId: string
  canDelete: boolean
  onUpdateSpace: (id: string, patch: Partial<Space>) => void
  onDeleteSpace: (id: string) => void
  onAddApp: (spaceId: string, pin: Omit<AppPin, 'id'>) => void
  onRemoveApp: (spaceId: string, appId: string) => void
  onOpenApp: (pin: AppPin) => void
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
  onClearSpace: (spaceId: string) => void
}

export function Sidebar({
  space, spaceTabs, activeTabId, canDelete,
  onUpdateSpace, onDeleteSpace,
  onAddApp, onRemoveApp, onOpenApp,
  onSelectTab, onCloseTab, onNewTab,
  onClearSpace,
}: Props) {
  const [addingApp, setAddingApp] = useState(false)
  const [appUrl, setAppUrl] = useState('')
  const [appName, setAppName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [showSpaceOptions, setShowSpaceOptions] = useState(false)

  if (!space) return null

  const handleAddApp = () => {
    if (!appUrl.trim()) return
    const url = normalizeUrl(appUrl)
    const name = appName.trim() || new URL(url).hostname
    onAddApp(space.id, { name, url })
    setAppUrl('')
    setAppName('')
    setAddingApp(false)
  }

  return (
    <aside style={styles.sidebar}>
      {/* ─── Space header ──────────────────────────────────────────── */}
      <div style={styles.spaceHeader}>
        <button
          style={styles.emojiBtn}
          title="Change emoji"
          onClick={() => setShowSpaceOptions((v) => !v)}
        >
          {space.emoji}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <input
              autoFocus
              value={space.name}
              onChange={(e) => onUpdateSpace(space.id, { name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              style={styles.nameInput}
            />
          ) : (
            <div
              style={styles.spaceName}
              onDoubleClick={() => setEditingName(true)}
              title="Double-click to rename"
            >
              {space.name}
            </div>
          )}
        </div>
        {canDelete && (
          <button
            style={styles.deleteBtn}
            title="Delete space"
            onClick={() => onDeleteSpace(space.id)}
          >
            <Ico d="M3 6h8M5 6V4a1 1 0 011-1h2a1 1 0 011 1v2m2 0v7a1 1 0 01-1 1H4a1 1 0 01-1-1V6" />
          </button>
        )}
      </div>

      {/* Emoji + color picker */}
      {showSpaceOptions && (
        <div style={styles.spaceOptions}>
          <div style={styles.optionsRow}>
            {SPACE_EMOJIS.map((em) => (
              <button
                key={em}
                style={{
                  ...styles.emojiOption,
                  background: space.emoji === em ? 'var(--accent-dim)' : undefined,
                }}
                onClick={() => { onUpdateSpace(space.id, { emoji: em }); setShowSpaceOptions(false) }}
              >
                {em}
              </button>
            ))}
          </div>
          <div style={styles.optionsRow}>
            {SPACE_COLORS.map((c) => (
              <button
                key={c}
                style={{
                  ...styles.colorSwatch,
                  background: c,
                  boxShadow: space.color === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : undefined,
                }}
                onClick={() => { onUpdateSpace(space.id, { color: c }); setShowSpaceOptions(false) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Apps ──────────────────────────────────────────────────── */}
      <Section
        label="Apps"
        action={<Chip onClick={() => setAddingApp((v) => !v)}>{addingApp ? '✕' : '+ Add'}</Chip>}
      >
        {addingApp && (
          <div style={styles.addAppForm}>
            <input
              autoFocus
              placeholder="https://example.com"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddApp()}
              style={styles.formInput}
            />
            <input
              placeholder="Name (optional)"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddApp()}
              style={styles.formInput}
            />
            <button style={styles.formSubmit} onClick={handleAddApp}>
              Add App
            </button>
          </div>
        )}
        {space.apps.length > 0 ? (
          <div style={styles.appGrid}>
            {space.apps.map((a) => (
              <AppTile
                key={a.id}
                app={a}
                onOpen={() => onOpenApp(a)}
                onRemove={() => onRemoveApp(space.id, a.id)}
              />
            ))}
          </div>
        ) : !addingApp ? (
          <div style={styles.empty}>Pin your web apps here</div>
        ) : null}
      </Section>

      {/* ─── Tabs ──────────────────────────────────────────────────── */}
      <Section
        label="Tabs"
        action={
          <button style={styles.iconAction} onClick={onNewTab} title="New tab (⌘T)">
            <Ico d="M7 1v12M1 7h12" />
          </button>
        }
        flex
      >
        <div style={styles.tabList}>
          {spaceTabs.map((t) => {
            const active = t.id === activeTabId
            return (
              <div
                key={t.id}
                style={{
                  ...styles.tabRow,
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  borderColor: active ? 'var(--accent-border)' : 'transparent',
                }}
                onClick={() => onSelectTab(t.id)}
              >
                {t.favicon ? (
                  <img src={t.favicon} style={styles.favicon} alt="" />
                ) : (
                  <div style={styles.faviconFallback} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}>
                    {t.title || 'New Tab'}
                  </div>
                  {t.loading && <div style={styles.loadingBar} />}
                </div>
                <button
                  style={styles.closeTab}
                  onClick={(e) => { e.stopPropagation(); onCloseTab(t.id) }}
                  title="Close tab (⌘W)"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <div style={styles.footer}>
        <button
          style={styles.footerBtn}
          onClick={() => onClearSpace(space.id)}
          title="Clear storage for this Space"
        >
          <Ico d="M4 4h6l-1-1H5L4 4zm-1 1v8a1 1 0 001 1h6a1 1 0 001-1V5H3z" />
          Clear
        </button>
      </div>
    </aside>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, action, children, flex }: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
  flex?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: flex ? 1 : undefined, minHeight: 0 }}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionLabel}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function Chip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button style={styles.chip} onClick={onClick}>
      {children}
    </button>
  )
}

function AppTile({ app, onOpen, onRemove }: { app: AppPin; onOpen: () => void; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...styles.appTile, background: hovered ? 'var(--surface2)' : 'var(--surface)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button style={styles.appTileMain} onClick={onOpen} title={app.url}>
        <div style={styles.appIcon}>{app.name[0]?.toUpperCase()}</div>
        <div className="truncate" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          {app.name}
        </div>
      </button>
      {hovered && (
        <button style={styles.appRemove} onClick={onRemove} title="Remove">
          ✕
        </button>
      )}
    </div>
  )
}

function Ico({ d }: { d: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-w)',
    minWidth: 'var(--sidebar-w)',
    background: 'var(--surface)',
    borderRight: '1px solid var(--stroke)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  spaceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 12px',
    height: 'var(--titlebar-h)',
    borderBottom: '1px solid var(--stroke)',
    flexShrink: 0,
    WebkitAppRegion: 'drag' as any,
  },
  emojiBtn: {
    fontSize: 18,
    lineHeight: 1,
    border: 'none',
    background: 'none',
    padding: '4px 6px',
    borderRadius: 8,
    cursor: 'pointer',
    WebkitAppRegion: 'no-drag' as any,
  },
  spaceName: {
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--text)',
    cursor: 'default',
    WebkitAppRegion: 'no-drag' as any,
  },
  nameInput: {
    width: '100%',
    border: '1px solid var(--accent-border)',
    background: 'var(--surface2)',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: 14,
    fontWeight: 600,
    WebkitAppRegion: 'no-drag' as any,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid var(--stroke)',
    color: 'var(--danger)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
    WebkitAppRegion: 'no-drag' as any,
  },
  spaceOptions: {
    padding: '10px 12px',
    borderBottom: '1px solid var(--stroke)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flexShrink: 0,
  },
  optionsRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  emojiOption: {
    width: 30,
    height: 30,
    borderRadius: 8,
    fontSize: 16,
    border: '1px solid var(--stroke)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px 6px',
    flexShrink: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--subtle)',
  },
  chip: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid var(--stroke2)',
    color: 'var(--muted)',
    background: 'transparent',
    cursor: 'pointer',
  },
  iconAction: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: '1px solid var(--stroke)',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAppForm: {
    padding: '0 12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  formInput: {
    border: '1px solid var(--stroke2)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    background: 'var(--surface2)',
    width: '100%',
  },
  formSubmit: {
    border: '1px solid var(--accent-border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  appGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    padding: '0 12px 10px',
  },
  appTile: {
    borderRadius: 10,
    border: '1px solid var(--stroke)',
    padding: 6,
    position: 'relative',
    transition: 'background 120ms',
  },
  appTileMain: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
  },
  appRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'var(--danger)',
    color: '#fff',
    fontSize: 8,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  empty: {
    fontSize: 12,
    color: 'var(--subtle)',
    padding: '6px 14px 12px',
  },
  tabList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  tabRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 8px',
    borderRadius: 10,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'background 120ms, border-color 120ms',
    flexShrink: 0,
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    flexShrink: 0,
    objectFit: 'contain',
  },
  faviconFallback: {
    width: 14,
    height: 14,
    borderRadius: 3,
    background: 'var(--surface2)',
    flexShrink: 0,
  },
  loadingBar: {
    height: 2,
    borderRadius: 1,
    background: 'linear-gradient(90deg, var(--accent), var(--teal))',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s infinite',
    marginTop: 2,
  },
  closeTab: {
    width: 20,
    height: 20,
    borderRadius: 6,
    border: '1px solid var(--stroke)',
    background: 'transparent',
    color: 'var(--muted)',
    fontSize: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
  },
  footer: {
    padding: '8px 12px',
    borderTop: '1px solid var(--stroke)',
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
  footerBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid var(--stroke)',
    fontSize: 12,
    color: 'var(--muted)',
    cursor: 'pointer',
  },
}
