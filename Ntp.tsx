import React, { useEffect, useState } from 'react'

const QUICK_LINKS = [
  { name: 'Solviony', url: 'https://solviony.com', icon: '⚡' },
  { name: 'GitHub',   url: 'https://github.com',   icon: '🐙' },
  { name: 'Notion',   url: 'https://notion.so',    icon: '📄' },
  { name: 'Figma',    url: 'https://figma.com',    icon: '🎨' },
  { name: 'Linear',   url: 'https://linear.app',   icon: '📐' },
  { name: 'Vercel',   url: 'https://vercel.com',   icon: '▲' },
]

interface Props {
  onNavigate: (url: string) => void
}

export function Ntp({ onNavigate }: Props) {
  const [time, setTime] = useState(() => formatTime())
  const [search, setSearch] = useState('')

  useEffect(() => {
    const t = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleSearch = () => {
    if (!search.trim()) return
    const q = search.trim()
    const url = q.includes('.') && !q.includes(' ') ? `https://${q}` : `https://duckduckgo.com/?q=${encodeURIComponent(q)}`
    onNavigate(url)
    setSearch('')
  }

  return (
    <div style={styles.root}>
      {/* Background glow */}
      <div style={styles.glow} />

      <div style={styles.content}>
        {/* Time */}
        <div style={styles.time}>{time}</div>

        {/* Brand */}
        <div style={styles.brand}>ERIS</div>
        <div style={styles.byline}>Solvionyx Browser</div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search DuckDuckGo or enter URL…"
            style={styles.searchInput}
            spellCheck={false}
          />
          <button onClick={handleSearch} style={styles.searchBtn}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Quick links */}
        <div style={styles.links}>
          {QUICK_LINKS.map((l) => (
            <button key={l.url} style={styles.link} onClick={() => onNavigate(l.url)} title={l.url}>
              <span style={styles.linkIcon}>{l.icon}</span>
              <span style={styles.linkName}>{l.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(77,145,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
    position: 'relative',
    zIndex: 1,
    animation: 'fadeIn 400ms var(--ease)',
  },
  time: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--muted)',
    letterSpacing: '0.1em',
    marginBottom: 20,
  },
  brand: {
    fontFamily: 'var(--font-brand)',
    fontWeight: 800,
    fontSize: 64,
    letterSpacing: '-2px',
    color: 'var(--text)',
    lineHeight: 1,
    background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.55) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  byline: {
    fontSize: 12,
    color: 'var(--subtle)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 40,
  },
  searchWrap: {
    position: 'relative',
    width: 520,
  },
  searchInput: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    border: '1px solid var(--stroke2)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    padding: '0 48px 0 18px',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 150ms, box-shadow 150ms',
    fontFamily: 'var(--font-ui)',
  },
  searchBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 30,
    height: 30,
    borderRadius: 9,
    border: '1px solid var(--stroke)',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  links: {
    display: 'flex',
    gap: 10,
    marginTop: 28,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 520,
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '14px 16px',
    borderRadius: 14,
    border: '1px solid var(--stroke)',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    minWidth: 72,
    transition: 'background 150ms, border-color 150ms',
  },
  linkIcon: {
    fontSize: 20,
    lineHeight: 1,
  },
  linkName: {
    fontSize: 11,
    color: 'var(--muted)',
    fontWeight: 500,
  },
}
