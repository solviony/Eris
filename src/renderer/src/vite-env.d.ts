/// <reference types="vite/client" />

declare global {
  interface Window {
    eris: {
      getState: () => Promise<{ ui: { theme: 'system' | 'dark' | 'light' }; spaces: any[] }>
      setTheme: (theme: 'system' | 'dark' | 'light') => Promise<{ theme: 'system' | 'dark' | 'light' }>
      saveSpaces: (spaces: any[]) => Promise<boolean>
      clearPartition: (partition: string) => Promise<boolean>
    }
  }
}

export {}
