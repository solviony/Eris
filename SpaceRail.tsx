import React from 'react'
import type { Space } from '../types'

interface Props {
  spaces: Space[]
  activeSpaceId: string
  onSelect: (id: string) => void
  onCreate: () => void
}

export function SpaceRail({ spaces, activeSpaceId, onSelect, onCreate }: Props) {
  return (
    <aside style={styles.rail}>
      {/* Brand mark */}
      <div style={styles.brand}>
        <span style={styles.brandLetter}>E</span>
      </div>

      <div style={styles.divider} />

      {/* Space buttons */}
      <div style={styles.spaces}>
        {spaces.map((s, i) => {
          const active = s.id === activeSpaceId
          return (
            <button
              key={s.id}
              title={s.name}
              onClick={() => onSelect(s.id)}
              style={{
                ...styles.spaceBtn,
                background: active ? `${s.color}18` : 'transparent',
                borderColor: active ? `${s.color}55` : 'transparent',
              }}
            >
              {/* Active indicator */}
              {active && (
                <span
                  style={{
                    ...styles.activeBar,
                    background: s.color,
                  }}
                />
              )}
              <span style={styles.emoji}>{s.emoji}</span>
              {/* Kbd hint: Cmd+1..9 */}
              {i < 9 && (
                <span style={styles.hint}>{i + 1}</span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Add space */}
      <button
        title="New Space (⌘9+)"
        onClick={onCreate}
        style={styles.addBtn}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </aside>
  )
}

const styles: Record<string, React.CSSProperties> = {
  rail: {
    width: 'var(--rail-w)',
    minWidth: 'var(--rail-w)',
    background: 'var(--rail)',
    borderRight: '1px solid var(--stroke)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 12,
    paddingTop: 0,
    gap: 0,
    zIndex: 10,
  },
  brand: {
    width: 60,
    height: 'var(--titlebar-h)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    WebkitAppRegion: 'drag' as any,
  },
  brandLetter: {
    fontFamily: 'var(--font-brand)',
    fontWeight: 800,
    fontSize: 20,
    color: 'var(--accent)',
    letterSpacing: '-0.5px',
  },
  divider: {
    width: 28,
    height: 1,
    background: 'var(--stroke)',
    marginBottom: 10,
    flexShrink: 0,
  },
  spaces: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '0 8px',
    overflowY: 'auto',
  },
  spaceBtn: {
    position: 'relative',
    width: '100%',
    height: 44,
    borderRadius: 12,
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 150ms, border-color 150ms',
    flexShrink: 0,
  },
  activeBar: {
    position: 'absolute',
    left: -9,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 3,
    height: 20,
    borderRadius: 99,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 1,
  },
  hint: {
    position: 'absolute',
    bottom: 3,
    right: 5,
    fontSize: 9,
    color: 'var(--subtle)',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: '1px dashed var(--stroke2)',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 150ms, color 150ms, border-color 150ms',
    marginTop: 6,
  },
}
