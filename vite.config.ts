import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Le chemin de base sera réglé pour GitHub Pages en phase 4 (variable VITE_BASE).
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react()],
  test: { environment: 'node' },
})
