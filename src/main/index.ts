import { app, BrowserWindow, ipcMain, nativeTheme, session, shell } from 'electron'
import { join } from 'path'
import Store from 'electron-store'

// Electron store schema for predictable upgrades
const store = new Store({
  name: 'eris',
  defaults: {
    ui: {
      theme: 'system' as 'system' | 'dark' | 'light'
    },
    spaces: [] as any[]
  }
})

let mainWindow: BrowserWindow | null = null

function getRendererUrl(): string {
  // electron-vite sets VITE_DEV_SERVER_URL in dev
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) return devUrl
  return `file://${join(__dirname, '../renderer/index.html')}`
}

function applyTheme(theme: 'system' | 'dark' | 'light') {
  if (theme === 'system') {
    nativeTheme.themeSource = 'system'
  } else {
    nativeTheme.themeSource = theme
  }
}

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
      webviewTag: true
    }
  })

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  await mainWindow.loadURL(getRendererUrl())

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(async () => {
  applyTheme(store.get('ui.theme') as any)
  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// -------- IPC API --------

ipcMain.handle('eris:getState', async () => {
  return {
    ui: store.get('ui'),
    spaces: store.get('spaces')
  }
})

ipcMain.handle('eris:setTheme', async (_e, theme: 'system' | 'dark' | 'light') => {
  store.set('ui.theme', theme)
  applyTheme(theme)
  return store.get('ui')
})

ipcMain.handle('eris:saveSpaces', async (_e, spaces: any[]) => {
  store.set('spaces', spaces)
  return true
})

ipcMain.handle('eris:clearPartition', async (_e, partition: string) => {
  // partition expected like 'persist:space-xxxxx'
  const s = session.fromPartition(partition)
  await s.clearStorageData()
  await s.clearCache()
  return true
})
