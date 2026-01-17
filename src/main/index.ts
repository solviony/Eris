import {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  session,
  shell,
} from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

// --------------------
// Store
// --------------------

const store = new Store({
  name: 'eris',
  defaults: {
    ui: {
      theme: 'system' as 'system' | 'dark' | 'light',
    },
    spaces: [] as any[],
  },
})

let mainWindow: BrowserWindow | null = null

// --------------------
// Helpers
// --------------------

function getRendererUrl(): string {
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) return devUrl
  return `file://${join(__dirname, '../renderer/index.html')}`
}

function applyTheme(theme: 'system' | 'dark' | 'light') {
  nativeTheme.themeSource = theme === 'system' ? 'system' : theme
}

function sendUpdaterStatus(payload: any) {
  if (mainWindow) {
    mainWindow.webContents.send('updater:status', payload)
  }
}

// --------------------
// Window
// --------------------

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 820,
    minWidth: 980,
    minHeight: 620,
    title: 'Eris',
    backgroundColor: '#0b1220',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 14 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  await mainWindow.loadURL(getRendererUrl())

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

// --------------------
// App lifecycle
// --------------------

app.whenReady().then(async () => {
  applyTheme(store.get('ui.theme') as any)
  await createWindow()

  // Auto check on launch (production only)
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

// --------------------
// Auto Updater
// --------------------

autoUpdater.autoDownload = false

autoUpdater.on('checking-for-update', () => {
  sendUpdaterStatus({ status: 'checking' })
})

autoUpdater.on('update-available', (info) => {
  sendUpdaterStatus({ status: 'available', info })
})

autoUpdater.on('update-not-available', (info) => {
  sendUpdaterStatus({ status: 'not-available', info })
})

autoUpdater.on('download-progress', (progress) => {
  sendUpdaterStatus({ status: 'progress', progress })
})

autoUpdater.on('update-downloaded', (info) => {
  sendUpdaterStatus({ status: 'downloaded', info })
})

autoUpdater.on('error', (error) => {
  sendUpdaterStatus({ status: 'error', message: error.message })
})

// --------------------
// IPC — App State
// --------------------

ipcMain.handle('eris:getState', async () => ({
  ui: store.get('ui'),
  spaces: store.get('spaces'),
}))

ipcMain.handle(
  'eris:setTheme',
  async (_e, theme: 'system' | 'dark' | 'light') => {
    store.set('ui.theme', theme)
    applyTheme(theme)
    return store.get('ui')
  }
)

ipcMain.handle('eris:saveSpaces', async (_e, spaces: any[]) => {
  store.set('spaces', spaces)
  return true
})

ipcMain.handle('eris:clearPartition', async (_e, partition: string) => {
  const s = session.fromPartition(partition)
  await s.clearStorageData()
  await s.clearCache()
  return true
})

// --------------------
// IPC — Updater
// --------------------

ipcMain.handle('updater:check', () => {
  autoUpdater.checkForUpdates()
})

ipcMain.handle('updater:download', () => {
  autoUpdater.downloadUpdate()
})

ipcMain.handle('updater:quitAndInstall', () => {
  autoUpdater.quitAndInstall()
})
