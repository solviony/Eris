import { contextBridge, ipcRenderer } from 'electron'

// ─── App state API ────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('eris', {
  getState: () => ipcRenderer.invoke('eris:getState'),
  setTheme: (theme: string) => ipcRenderer.invoke('eris:setTheme', theme),
  saveSpaces: (spaces: unknown[]) => ipcRenderer.invoke('eris:saveSpaces', spaces),
  clearPartition: (partition: string) => ipcRenderer.invoke('eris:clearPartition', partition),
  saveVpnCustomServers: (servers: unknown[]) => ipcRenderer.invoke('eris:saveVpnCustomServers', servers),
  setProxy: (partition: string, config: unknown) => ipcRenderer.invoke('eris:setProxy', partition, config),
  setAllProxy: (partitions: string[], config: unknown) => ipcRenderer.invoke('eris:setAllProxy', partitions, config),
})

// ─── Updater API ──────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('erisUpdater', {
  onStatus(cb: (payload: unknown) => void) {
    const handler = (_: Electron.IpcRendererEvent, payload: unknown) => cb(payload)
    ipcRenderer.on('updater:status', handler)
    return () => ipcRenderer.removeListener('updater:status', handler)
  },
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  quitAndInstall: () => ipcRenderer.invoke('updater:quitAndInstall'),
})
