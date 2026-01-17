import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    entry: 'src/main/index.ts',
    vite: {
      build: {
        outDir: 'dist/main',
        sourcemap: true
      }
    }
  },
  preload: {
    input: {
      index: resolve(__dirname, 'src/preload/index.ts')
    },
    vite: {
      build: {
        outDir: 'dist/preload',
        sourcemap: true
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()],
    build: {
      outDir: resolve(__dirname, 'dist/renderer'),
      emptyOutDir: true
    }
  }
})
