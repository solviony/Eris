import React, { useRef } from 'react'

interface Props {
  omnibox: string
  loading: boolean
  vpnEnabled: boolean
  vpnConnecting: boolean
  onOmniboxChange: (v: string) => void
  onNavigate: (v: string) => void
  onBack: () => void
  onForward: () => void
  onReload: () => void
  onToggleVpn: () => void
}

export function Navbar({
  omnibox, loading, vpnEnabled, vpnConnecting,
  onOmniboxChange, onNavigate,
  onBack, onForward, onReload, onToggleVpn,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div style={styles.navbar}>
      {/* Nav controls */}
      <div style={styles.navGroup}>
        <NavBtn onClick={onBack} title="Back (⌘[)">
          <Arrow dir="left" />
        </NavBtn>
        <NavBtn onClick={onForward} title="Forward (⌘])">
          <Arrow dir="right" />
        </NavBtn>
        <NavBtn onClick={onReload} title="Reload (⌘R)" spin={loading}>
          <ReloadIco />
        </NavBtn>
      </div>

      {/* Omnibox */}
      <div style={styles.omniboxWrap}>
        <input
          id="omnibox"
          ref={inputRef}
          type="text"
          value={omnibox}
          placeholder="Search or enter URL…"
          onChange={(e) => onOmniboxChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onNavigate(omnibox)
              inputRef.current?.blur()
            }
            if (e.key === 'Escape') inputRef.current?.blur()
          }}
          style={styles.omnibox}
          className="monospace"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        {loading && <div style={styles.loadingAccent} />}
      </div>

      {/* VPN pill */}
      <button
        onClick={onToggleVpn}
        title="VPN Panel"
        style={{
          ...styles.vpnPill,
          background: vpnEnabled
            ? 'var(--teal-dim)'
            : vpnConnecting
            ? 'rgba(255,200,0,0.1)'
            : 'var(--surface)',
          borderColor: vpnEnabled
            ? 'var(--teal-border)'
            : vpnConnecting
            ? 'rgba(255,200,0,0.35)'
            : 'var(--stroke2)',
          color: vpnEnabled ? 'var(--teal)' : vpnConnecting ? '#ffc800' : 'var(--muted)',
        }}
      >
        <ShieldIco connected={vpnEnabled} connecting={vpnConnecting} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>
          {vpnConnecting ? 'Connecting' : vpnEnabled ? 'VPN ON' : 'VPN'}
        </span>
      </button>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBtn({ onClick, title, spin, children }: {
  onClick: () => void
  title?: string
  spin?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: '1px solid var(--stroke)',
        background: 'transparent',
        color: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 120ms, color 120ms',
        animation: spin ? 'spin 0.8s linear infinite' : undefined,
      }}
    >
      {children}
    </button>
  )
}

function Arrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      {dir === 'left'
        ? <path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M4 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      }
    </svg>
  )
}

function ReloadIco() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 3v3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShieldIco({ connected, connecting }: { connected: boolean; connecting: boolean }) {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
      <path
        d="M5.5 1L1 3v3.5c0 2.5 2 4.5 4.5 5 2.5-.5 4.5-2.5 4.5-5V3L5.5 1z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill={connected ? 'currentColor' : connecting ? 'currentColor' : 'none'}
        opacity={connected ? 0.3 : connecting ? 0.2 : 1}
      />
      {connected && (
        <path d="M3.5 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    height: 'var(--navbar-h)',
    borderBottom: '1px solid var(--stroke)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 12px',
    flexShrink: 0,
    background: 'var(--surface)',
  },
  navGroup: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
  },
  omniboxWrap: {
    flex: 1,
    position: 'relative',
    minWidth: 0,
  },
  omnibox: {
    width: '100%',
    height: 32,
    borderRadius: 9,
    border: '1px solid var(--stroke2)',
    background: 'var(--surface2)',
    padding: '0 12px',
    fontSize: 12.5,
    color: 'var(--text)',
    transition: 'border-color 150ms, box-shadow 150ms',
    outline: 'none',
  },
  loadingAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    background: 'linear-gradient(90deg, var(--accent), var(--teal))',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s infinite',
  },
  vpnPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '0 10px',
    height: 30,
    borderRadius: 8,
    border: '1px solid',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 200ms, border-color 200ms, color 200ms',
  },
}
