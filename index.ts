import { app, BrowserWindow, ipcMain, nativeTheme, session, shell } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProxyConfig {
  protocol: 'socks5' | 'socks4' | 'http'
  host: string
  port: number
}

interface StoreSchema {
  ui: { theme: 'system' | 'dark' | 'light' }
  spaces: unknown[]
  vpn: { customServers: unknown[] }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const store = new Store<StoreSchema>({
  name: 'eris',
  defaults: {
    ui: { theme: 'system' },
    spaces: [],
    vpn: { customServers: [] },
  },
})

let mainWindow: BrowserWindow | null = null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyTheme(theme: 'system' | 'dark' | 'light') {
  nativeTheme.themeSource = theme === 'system' ? 'system' : theme
}

async function applyProxy(partition: string, config: ProxyConfig | null) {
  const s = session.fromPartition(partition)
  if (!config) {
    await s.setProxy({ mode: 'direct' })
    return
  }
  const { protocol, host, port } = config
  await s.setProxy({ proxyRules: `${protocol}://${host}:${port}` })
}

function push(payload: unknown) {
  mainWindow?.webContents.send('updater:status', payload)
}

// ─── Window ───────────────────────────────────────────────────────────────────

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 620,
    title: 'Eris',
    backgroundColor: '#07080f',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // required for webviewTag IPC
      webviewTag: true,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  applyTheme(store.get('ui.theme'))
  await createWindow()

  if (!process.env.VITE_DEV_SERVER_URL) {
    autoUpdater.checkForUpdates()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC: Window controls ─────────────────────────────────────────────────────

ipcMain.handle('win:minimize', () => mainWindow?.minimize())
ipcMain.handle('win:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.handle('win:close', () => mainWindow?.close())

// ─── IPC: App state ───────────────────────────────────────────────────────────

ipcMain.handle('eris:getState', () => ({
  ui: store.get('ui'),
  spaces: store.get('spaces'),
  vpn: store.get('vpn'),
}))

ipcMain.handle('eris:setTheme', (_e, theme: 'system' | 'dark' | 'light') => {
  store.set('ui.theme', theme)
  applyTheme(theme)
})

ipcMain.handle('eris:saveSpaces', (_e, spaces: unknown[]) => {
  store.set('spaces', spaces)
})

ipcMain.handle('eris:clearPartition', async (_e, partition: string) => {
  const s = session.fromPartition(partition)
  await s.clearStorageData()
  await s.clearCache()
})

ipcMain.handle('eris:saveVpnCustomServers', (_e, servers: unknown[]) => {
  store.set('vpn.customServers', servers)
})

// ─── IPC: VPN proxy ───────────────────────────────────────────────────────────

ipcMain.handle('eris:setProxy', async (_e, partition: string, config: ProxyConfig | null) => {
  await applyProxy(partition, config)
})

ipcMain.handle('eris:setAllProxy', async (_e, partitions: string[], config: ProxyConfig | null) => {
  await Promise.all(partitions.map((p) => applyProxy(p, config)))
})

// ─── Auto updater ─────────────────────────────────────────────────────────────

autoUpdater.autoDownload = false
autoUpdater.on('checking-for-update', () => push({ status: 'checking' }))
autoUpdater.on('update-available', (info) => push({ status: 'available', info }))
autoUpdater.on('update-not-available', (info) => push({ status: 'not-available', info }))
autoUpdater.on('download-progress', (progress) => push({ status: 'progress', progress }))
autoUpdater.on('update-downloaded', (info) => push({ status: 'downloaded', info }))
autoUpdater.on('error', (err) => push({ status: 'error', message: err.message }))

ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates())
ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
ipcMain.handle('updater:quitAndInstall', () => autoUpdater.quitAndInstall())
