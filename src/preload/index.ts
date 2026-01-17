import { contextBridge, ipcRenderer } from "electron";

/* -----------------------------
   App state bridge (existing)
-------------------------------- */

export type ErisState = {
  ui: {
    theme: ThemeMode;
  };
  spaces: any[];
};

contextBridge.exposeInMainWorld("eris", {
  getState: (): Promise<ErisState> =>
    ipcRenderer.invoke("eris:getState"),

  setTheme: (theme: ThemeMode) =>
    ipcRenderer.invoke("eris:setTheme", theme),

  saveSpaces: (spaces: any[]) =>
    ipcRenderer.invoke("eris:saveSpaces", spaces),

  clearPartition: (partition: string) =>
    ipcRenderer.invoke("eris:clearPartition", partition),
});

/* -----------------------------
   Updater bridge (Phase 5A)
-------------------------------- */

type UpdateStatus =
  | { status: "checking" }
  | { status: "available"; info?: unknown }
  | { status: "not-available"; info?: unknown }
  | { status: "progress"; progress?: unknown }
  | { status: "downloaded"; info?: unknown }
  | { status: "error"; message: string };

const updaterApi = {
  onStatus(cb: (payload: UpdateStatus) => void) {
    const channel = "updater:status";
    const handler = (
      _: Electron.IpcRendererEvent,
      payload: UpdateStatus
    ) => cb(payload);

    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  checkForUpdates() {
    return ipcRenderer.invoke("updater:check");
  },

  downloadUpdate() {
    return ipcRenderer.invoke("updater:download");
  },

  quitAndInstall() {
    return ipcRenderer.invoke("updater:quitAndInstall");
  },
};

contextBridge.exposeInMainWorld("erisUpdater", updaterApi);
