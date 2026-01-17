import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    entry: 'src/main/index.ts',
    vite: {
      build: {
        outDir: 'out/main',
        sourcemap: true,
        rollupOptions: {
          external: [
            'electron',
            'electron-updater',
            'electron-store',
          ],
        },
      },
    },
  },

  preload: {
    entry: 'src/preload/index.ts',
    vite: {
      build: {
        outDir: 'out/preload',
        sourcemap: true,
      },
    },
  },

  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    build: {
      outDir: 'out/renderer',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
      },
    },
  },
})
