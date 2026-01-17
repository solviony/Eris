import { useEffect, useState } from 'react'
import {
  subscribeUpdates,
  downloadUpdate,
  installUpdate,
} from '@/stores/updateStore'

export default function UpdateBanner() {
  const [state, setState] = useState<any>({ status: 'idle' })

  useEffect(() => subscribeUpdates(setState), [])

  if (state.status === 'idle' || state.status === 'not-available') {
    return null
  }

  return (
    <div style={styles.container}>
      {state.status === 'checking' && <span>Checking for updates…</span>}

      {state.status === 'available' && (
        <>
          <span>Update available</span>
          <button onClick={downloadUpdate}>Download</button>
        </>
      )}

      {state.status === 'progress' && (
        <span>Downloading… {Math.round(state.percent ?? 0)}%</span>
      )}

      {state.status === 'downloaded' && (
        <>
          <span>Update ready</span>
          <button onClick={installUpdate}>Restart & Install</button>
        </>
      )}

      {state.status === 'error' && (
        <span>Error: {state.message}</span>
      )}
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed' as const,
    bottom: 16,
    right: 16,
    background: '#0b1220',
    border: '1px solid #1f2a44',
    padding: '12px 16px',
    borderRadius: 8,
    color: '#fff',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    zIndex: 1000,
  },
}
