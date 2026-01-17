export {};

declare global {
  interface Window {
    erisUpdater?: {
      onStatus: (cb: (payload: any) => void) => () => void;
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<any>;
      quitAndInstall: () => Promise<any>;
    };
  }
}
