import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/kids-domino/',
  plugins: [react()],
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
})
