import React, { useEffect, useState } from 'react'
import type { UpdateStatus } from '../types'

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const unsub = window.erisUpdater.onStatus((s) => {
      setStatus(s as UpdateStatus)
      setDismissed(false)
    })
    return unsub
  }, [])

  if (dismissed || !status) return null
  if (status.status === 'not-available' || status.status === 'checking') return null

  const msg =
    status.status === 'available'
      ? 'Update available'
      : status.status === 'progress'
      ? `Downloading… ${Math.round((status.progress?.percent ?? 0))}%`
      : status.status === 'downloaded'
      ? 'Update ready to install'
      : status.status === 'error'
      ? `Update error: ${status.message}`
      : null

  if (!msg) return null

  return (
    <div style={styles.banner}>
      <span style={styles.dot} />
      <span style={styles.msg}>{msg}</span>
      <div style={styles.actions}>
        {status.status === 'available' && (
          <button style={styles.actionBtn} onClick={() => window.erisUpdater.downloadUpdate()}>
            Download
          </button>
        )}
        {status.status === 'downloaded' && (
          <button style={styles.actionBtn} onClick={() => window.erisUpdater.quitAndInstall()}>
            Restart &amp; Install
          </button>
        )}
      </div>
      <button style={styles.dismiss} onClick={() => setDismissed(true)}>✕</button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'var(--surface2)',
    border: '1px solid var(--stroke2)',
    boxShadow: 'var(--shadow)',
    maxWidth: 360,
    animation: 'fadeIn 300ms var(--ease)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--accent)',
    flexShrink: 0,
  },
  msg: {
    flex: 1,
    fontSize: 13,
    color: 'var(--text)',
  },
  actions: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid var(--accent-border)',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  dismiss: {
    fontSize: 10,
    color: 'var(--muted)',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '0 4px',
    flexShrink: 0,
  },
}
