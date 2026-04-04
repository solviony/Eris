// ─── Core domain types ────────────────────────────────────────────────────────

export type ThemeMode = 'system' | 'dark' | 'light'
export type ProxyProtocol = 'socks5' | 'socks4' | 'http'
export type VpnScope = 'space' | 'all'

export interface ProxyConfig {
  protocol: ProxyProtocol
  host: string
  port: number
}

export interface VpnServer {
  id: string
  name: string
  description?: string
  proxy: ProxyConfig
  builtin: boolean
}

export interface VpnState {
  enabled: boolean
  connecting: boolean
  selectedServerId: string | null
  scope: VpnScope
  customServers: VpnServer[]
  currentIp: string | null
}

export interface AppPin {
  id: string
  name: string
  url: string
}

export interface Space {
  id: string
  name: string
  emoji: string
  color: string
  apps: AppPin[]
}

export interface Tab {
  id: string
  spaceId: string
  url: string
  title: string
  favicon?: string
  loading: boolean
  pinnedAppId?: string
}

// ─── Built-in VPN servers ─────────────────────────────────────────────────────

export const BUILTIN_SERVERS: VpnServer[] = [
  {
    id: 'warp',
    name: 'Cloudflare WARP',
    description: 'Fast, private DNS (local daemon)',
    proxy: { protocol: 'socks5', host: '127.0.0.1', port: 40000 },
    builtin: true,
  },
  {
    id: 'tor',
    name: 'Tor',
    description: 'Anonymous onion routing',
    proxy: { protocol: 'socks5', host: '127.0.0.1', port: 9050 },
    builtin: true,
  },
  {
    id: 'privoxy',
    name: 'Privoxy',
    description: 'HTTP privacy proxy',
    proxy: { protocol: 'http', host: '127.0.0.1', port: 8118 },
    builtin: true,
  },
  {
    id: 'squid',
    name: 'Squid',
    description: 'HTTP/HTTPS caching proxy',
    proxy: { protocol: 'http', host: '127.0.0.1', port: 3128 },
    builtin: true,
  },
]

export const SPACE_COLORS = [
  '#4d91ff', // blue
  '#9b6bff', // purple
  '#00c9a7', // teal
  '#ff8c42', // orange
  '#ff6b9d', // pink
  '#4caf82', // green
  '#ffd166', // yellow
  '#ef476f', // red
]

export const SPACE_EMOJIS = ['💼', '🌙', '🚀', '🎨', '⚡', '🌿', '🔥', '💡', '🛡️', '🌊']

// ─── Electron bridge types (window.eris) ──────────────────────────────────────

export interface ErisAPI {
  getState: () => Promise<{ ui: { theme: ThemeMode }; spaces: Space[]; vpn: { customServers: VpnServer[] } }>
  setTheme: (theme: ThemeMode) => Promise<void>
  saveSpaces: (spaces: Space[]) => Promise<void>
  clearPartition: (partition: string) => Promise<void>
  saveVpnCustomServers: (servers: VpnServer[]) => Promise<void>
  setProxy: (partition: string, config: ProxyConfig | null) => Promise<void>
  setAllProxy: (partitions: string[], config: ProxyConfig | null) => Promise<void>
}

export type UpdateStatus =
  | { status: 'checking' }
  | { status: 'available'; info?: unknown }
  | { status: 'not-available'; info?: unknown }
  | { status: 'progress'; progress?: { percent: number } }
  | { status: 'downloaded'; info?: unknown }
  | { status: 'error'; message: string }

export interface ErisUpdaterAPI {
  onStatus: (cb: (payload: UpdateStatus) => void) => () => void
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  quitAndInstall: () => void
}

declare global {
  interface Window {
    eris: ErisAPI
    erisUpdater: ErisUpdaterAPI
  }
}

// Teach TypeScript about <webview> for React 18 JSX transform
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        partition?: string
        allowpopups?: string
        nodeintegration?: string
        webpreferences?: string
        ref?: React.Ref<HTMLElement>
      }
    }
  }
}
