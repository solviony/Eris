import React from 'react'
import { useBrowser } from './hooks/useBrowser'
import { SpaceRail } from './components/SpaceRail'
import { Sidebar } from './components/Sidebar'
import { Navbar } from './components/Navbar'
import { BrowserStage } from './components/BrowserStage'
import { VpnPanel } from './components/VpnPanel'
import { UpdateBanner } from './components/UpdateBanner'

export default function App() {
  const b = useBrowser()

  if (!b.ready) {
    return (
      <div style={splash.root}>
        <div style={splash.wordmark}>ERIS</div>
        <div style={splash.sub}>Solvionyx</div>
        <div style={splash.bar} />
      </div>
    )
  }

  return (
    <div style={layout.root}>
      {/* ── Space Rail ─────────────────────────────────────── */}
      <SpaceRail
        spaces={b.spaces}
        activeSpaceId={b.activeSpaceId}
        onSelect={b.selectSpace}
        onCreate={b.createSpace}
      />

      {/* ── Sidebar + Main ─────────────────────────────────── */}
      <div style={layout.center}>
        {/* Sidebar */}
        <Sidebar
          space={b.activeSpace}
          spaceTabs={b.spaceTabs}
          activeTabId={b.activeTabId}
          canDelete={b.spaces.length > 1}
          onUpdateSpace={b.updateSpace}
          onDeleteSpace={b.deleteSpace}
          onAddApp={b.addApp}
          onRemoveApp={b.removeApp}
          onOpenApp={b.openApp}
          onSelectTab={b.selectTab}
          onCloseTab={b.closeTab}
          onNewTab={b.newTab}
          onClearSpace={(id) => window.eris.clearPartition(`persist:space-${id}`).catch(() => {})}
        />

        {/* Main column */}
        <div style={layout.main}>
          {/* Navbar */}
          <Navbar
            omnibox={b.omnibox}
            loading={b.activeTab?.loading ?? false}
            vpnEnabled={b.vpnEnabled}
            vpnConnecting={b.vpnConnecting}
            onOmniboxChange={b.setOmnibox}
            onNavigate={b.navigate}
            onBack={b.goBack}
            onForward={b.goForward}
            onReload={b.reload}
            onToggleVpn={b.toggleVpnPanel}
          />

          {/* Browser stage */}
          <BrowserStage
            tabs={b.tabs}
            activeTabId={b.activeTabId}
            onAttach={b.attachWebview}
            onNavigate={b.navigate}
          />
        </div>
      </div>

      {/* ── VPN Panel ──────────────────────────────────────── */}
      <VpnPanel
        open={b.vpnPanelOpen}
        enabled={b.vpnEnabled}
        connecting={b.vpnConnecting}
        serverId={b.vpnServerId}
        scope={b.vpnScope}
        servers={b.allServers}
        currentIp={b.vpnIp}
        onClose={() => b.setVpnPanelOpen(false)}
        onConnect={b.vpnConnect}
        onDisconnect={b.vpnDisconnect}
        onSelectServer={b.setVpnServerId}
        onSetScope={b.setVpnScope}
        onCheckIp={b.checkIp}
        onAddCustomServer={b.addCustomServer}
        onRemoveCustomServer={b.removeCustomServer}
      />

      {/* ── Update banner ──────────────────────────────────── */}
      <UpdateBanner />
    </div>
  )
}

// ─── Layout styles ────────────────────────────────────────────────────────────

const layout: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  center: {
    flex: 1,
    display: 'flex',
    minWidth: 0,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  },
}

// ─── Splash screen styles ─────────────────────────────────────────────────────

const splash: Record<string, React.CSSProperties> = {
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--bg)',
    WebkitAppRegion: 'drag' as any,
  },
  wordmark: {
    fontFamily: 'var(--font-brand)',
    fontWeight: 800,
    fontSize: 36,
    letterSpacing: '-1px',
    color: 'var(--accent)',
  },
  sub: {
    fontSize: 12,
    color: 'var(--subtle)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  bar: {
    marginTop: 24,
    width: 48,
    height: 2,
    borderRadius: 1,
    background: 'linear-gradient(90deg, var(--accent), var(--teal))',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s infinite',
  },
}
