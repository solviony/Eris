import { contextBridge, ipcRenderer } from 'electron'

export type ThemeMode = 'system' | 'dark' | 'light'

export type ErisState = {
  ui: { theme: ThemeMode }
  spaces: any[]
}

contextBridge.exposeInMainWorld('eris', {
  getState: (): Promise<ErisState> => ipcRenderer.invoke('eris:getState'),
  setTheme: (theme: ThemeMode) => ipcRenderer.invoke('eris:setTheme', theme),
  saveSpaces: (spaces: any[]) => ipcRenderer.invoke('eris:saveSpaces', spaces),
  clearPartition: (partition: string) => ipcRenderer.invoke('eris:clearPartition', partition)
})
