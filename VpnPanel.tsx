import React, { useState } from 'react'
import type { ProxyProtocol, VpnScope, VpnServer } from '../types'

interface Props {
  open: boolean
  enabled: boolean
  connecting: boolean
  serverId: string | null
  scope: VpnScope
  servers: VpnServer[]
  currentIp: string | null
  onClose: () => void
  onConnect: () => void
  onDisconnect: () => void
  onSelectServer: (id: string) => void
  onSetScope: (s: VpnScope) => void
  onCheckIp: () => void
  onAddCustomServer: (s: Omit<VpnServer, 'id' | 'builtin'>) => void
  onRemoveCustomServer: (id: string) => void
}

export function VpnPanel({
  open, enabled, connecting, serverId, scope, servers, currentIp,
  onClose, onConnect, onDisconnect, onSelectServer, onSetScope,
  onCheckIp, onAddCustomServer, onRemoveCustomServer,
}: Props) {
  const [customHost, setCustomHost] = useState('')
  const [customPort, setCustomPort] = useState('')
  const [customName, setCustomName] = useState('')
  const [customProto, setCustomProto] = useState<ProxyProtocol>('socks5')
  const [addingCustom, setAddingCustom] = useState(false)

  const handleAddCustom = () => {
    if (!customHost.trim() || !customPort.trim()) return
    onAddCustomServer({
      name: customName.trim() || `${customHost}:${customPort}`,
      proxy: { protocol: customProto, host: customHost.trim(), port: parseInt(customPort) },
    })
    setCustomHost('')
    setCustomPort('')
    setCustomName('')
    setAddingCustom(false)
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          style={styles.backdrop}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        style={{
          ...styles.panel,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: open ? 'var(--shadow-lg)' : 'none',
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Shield connected={enabled} connecting={connecting} />
            <span style={styles.headerTitle}>VPN</span>
            {enabled && <span style={styles.badge}>Active</span>}
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Status hero */}
        <div style={{
          ...styles.hero,
          background: enabled
            ? 'linear-gradient(135deg, rgba(0,201,167,0.12), rgba(0,201,167,0.04))'
            : 'var(--surface2)',
          borderColor: enabled ? 'var(--teal-border)' : 'var(--stroke)',
        }}>
          <div style={{ ...styles.shieldBig, color: enabled ? 'var(--teal)' : connecting ? '#ffc800' : 'var(--muted)' }}>
            <LargeShield />
            {(enabled || connecting) && <div style={styles.pulse} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: enabled ? 'var(--teal)' : connecting ? '#ffc800' : 'var(--text)' }}>
              {connecting ? 'Connecting…' : enabled ? 'Protected' : 'Not Protected'}
            </div>
            {currentIp && (
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {currentIp}
              </div>
            )}
          </div>
          {enabled && (
            <button style={styles.checkIpBtn} onClick={onCheckIp}>
              Check IP
            </button>
          )}
        </div>

        {/* Servers */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Server</div>
          <div style={styles.serverList}>
            {servers.map((s) => (
              <button
                key={s.id}
                style={{
                  ...styles.serverRow,
                  background: serverId === s.id ? 'var(--accent-dim)' : 'transparent',
                  borderColor: serverId === s.id ? 'var(--accent-border)' : 'var(--stroke)',
                }}
                onClick={() => onSelectServer(s.id)}
              >
                <div style={styles.serverDot(serverId === s.id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.name}</div>
                  {s.description && (
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.description}</div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--subtle)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                    {s.proxy.protocol}://{s.proxy.host}:{s.proxy.port}
                  </div>
                </div>
                {!s.builtin && (
                  <button
                    style={styles.removeServer}
                    onClick={(e) => { e.stopPropagation(); onRemoveCustomServer(s.id) }}
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </button>
            ))}
          </div>

          {/* Add custom */}
          {addingCustom ? (
            <div style={styles.customForm}>
              <Row>
                <input style={styles.input} placeholder="Name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
              </Row>
              <Row>
                <select
                  style={{ ...styles.input, width: 90, flexShrink: 0 }}
                  value={customProto}
                  onChange={(e) => setCustomProto(e.target.value as ProxyProtocol)}
                >
                  <option value="socks5">SOCKS5</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="http">HTTP</option>
                </select>
                <input style={styles.input} placeholder="Host" value={customHost} onChange={(e) => setCustomHost(e.target.value)} />
                <input style={{ ...styles.input, width: 64, flexShrink: 0 }} placeholder="Port" value={customPort} onChange={(e) => setCustomPort(e.target.value)} />
              </Row>
              <Row>
                <button style={styles.addBtn} onClick={handleAddCustom}>Add Server</button>
                <button style={styles.cancelBtn} onClick={() => setAddingCustom(false)}>Cancel</button>
              </Row>
            </div>
          ) : (
            <button style={styles.addCustom} onClick={() => setAddingCustom(true)}>
              + Add custom server
            </button>
          )}
        </div>

        {/* Scope */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Apply to</div>
          <div style={styles.scopeRow}>
            {(['space', 'all'] as VpnScope[]).map((s) => (
              <button
                key={s}
                style={{
                  ...styles.scopeBtn,
                  background: scope === s ? 'var(--accent-dim)' : 'transparent',
                  borderColor: scope === s ? 'var(--accent-border)' : 'var(--stroke)',
                  color: scope === s ? 'var(--accent)' : 'var(--muted)',
                }}
                onClick={() => onSetScope(s)}
              >
                {s === 'space' ? 'This Space' : 'All Spaces'}
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div style={styles.action}>
          {enabled ? (
            <button style={styles.disconnectBtn} onClick={onDisconnect}>
              Disconnect
            </button>
          ) : (
            <button
              style={{
                ...styles.connectBtn,
                opacity: connecting || !serverId ? 0.7 : 1,
              }}
              onClick={onConnect}
              disabled={connecting || !serverId}
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 6 }}>{children}</div>
}

function Shield({ connected, connecting }: { connected: boolean; connecting: boolean }) {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
      <path
        d="M8 1L1 4v5c0 4 3 7.5 7 8.5 4-1 7-4.5 7-8.5V4L8 1z"
        stroke={connected ? 'var(--teal)' : connecting ? '#ffc800' : 'var(--muted)'}
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill={connected ? 'rgba(0,201,167,0.2)' : 'none'}
      />
      {connected && (
        <path d="M5 9l2 2 4-4" stroke="var(--teal)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

function LargeShield() {
  return (
    <svg width="42" height="48" viewBox="0 0 42 48" fill="none">
      <path
        d="M21 2L2 9v13c0 11 8 20.5 19 22.5C32 42.5 40 33 40 22V9L21 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M21 2L2 9v13c0 11 8 20.5 19 22.5C32 42.5 40 33 40 22V9L21 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, any> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    background: 'var(--surface)',
    borderLeft: '1px solid var(--stroke2)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'transform 280ms cubic-bezier(0.2, 0, 0, 1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: 'var(--titlebar-h)',
    borderBottom: '1px solid var(--stroke)',
    flexShrink: 0,
    WebkitAppRegion: 'drag',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    WebkitAppRegion: 'no-drag',
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 14,
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.05em',
    padding: '2px 7px',
    borderRadius: 99,
    background: 'var(--teal-dim)',
    color: 'var(--teal)',
    border: '1px solid var(--teal-border)',
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    border: '1px solid var(--stroke)',
    background: 'transparent',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    WebkitAppRegion: 'no-drag',
  },
  hero: {
    margin: 14,
    padding: '16px 14px',
    borderRadius: 14,
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexShrink: 0,
    transition: 'background 300ms, border-color 300ms',
  },
  shieldBig: {
    position: 'relative',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    inset: -8,
    borderRadius: '50%',
    border: '1.5px solid currentColor',
    opacity: 0,
    animation: 'pulse-ring 1.8s ease-out infinite',
  },
  checkIpBtn: {
    marginLeft: 'auto',
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid var(--teal-border)',
    background: 'var(--teal-dim)',
    color: 'var(--teal)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  section: {
    padding: '0 14px 14px',
    flexShrink: 0,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--subtle)',
    marginBottom: 8,
  },
  serverList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 220,
    overflowY: 'auto',
    marginBottom: 8,
  },
  serverRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 120ms, border-color 120ms',
    flexShrink: 0,
  },
  serverDot: (active: boolean) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: active ? 'var(--accent)' : 'var(--stroke2)',
    flexShrink: 0,
    marginTop: 4,
    transition: 'background 120ms',
  }),
  removeServer: {
    fontSize: 9,
    color: 'var(--danger)',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  addCustom: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px dashed var(--stroke2)',
    background: 'transparent',
    color: 'var(--muted)',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'center',
  },
  customForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '8px 0 0',
  },
  input: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--stroke2)',
    background: 'var(--surface2)',
    padding: '0 10px',
    fontSize: 12,
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
    minWidth: 0,
  },
  addBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--accent-border)',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    height: 34,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid var(--stroke)',
    background: 'transparent',
    color: 'var(--muted)',
    fontSize: 12,
    cursor: 'pointer',
  },
  scopeRow: {
    display: 'flex',
    gap: 6,
  },
  scopeBtn: {
    flex: 1,
    padding: '8px',
    borderRadius: 9,
    border: '1px solid',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 120ms, border-color 120ms, color 120ms',
  },
  action: {
    marginTop: 'auto',
    padding: 14,
    borderTop: '1px solid var(--stroke)',
    flexShrink: 0,
  },
  connectBtn: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    border: '1px solid var(--accent-border)',
    background: 'linear-gradient(135deg, var(--accent), #3070e0)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'opacity 150ms',
  },
  disconnectBtn: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    border: '1px solid rgba(255,77,106,0.3)',
    background: 'var(--danger-dim)',
    color: 'var(--danger)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
}
