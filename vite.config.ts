import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/kids-bingo/',
  plugins: [react()],
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
})
