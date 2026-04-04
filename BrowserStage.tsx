import React from 'react'
import type { Tab } from '../types'
import { Ntp } from './Ntp'

interface Props {
  tabs: Tab[]
  activeTabId: string
  onAttach: (tabId: string, el: HTMLElement | null) => void
  onNavigate: (url: string) => void
}

export function BrowserStage({ tabs, activeTabId, onAttach, onNavigate }: Props) {
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const showNtp = activeTab?.url === 'about:newtab'

  return (
    <div style={styles.stage}>
      {/* Webviews - all mounted, only active visible */}
      {tabs
        .filter((t) => t.url !== 'about:newtab')
        .map((t) => {
          const visible = t.id === activeTabId && !showNtp
          const part = `persist:space-${t.spaceId}`
          return (
            <webview
              key={t.id}
              ref={(el) => onAttach(t.id, el)}
              src={t.url}
              partition={part}
              allowpopups="true"
              style={{
                ...styles.webview,
                display: visible ? 'flex' : 'none',
              }}
            />
          )
        })}

      {/* New Tab Page */}
      {showNtp && <Ntp onNavigate={onNavigate} />}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  stage: {
    flex: 1,
    position: 'relative',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  webview: {
    position: 'absolute',
    inset: 0,
    border: 'none',
    width: '100%',
    height: '100%',
  },
}
