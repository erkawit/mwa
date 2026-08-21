import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // Inlines all JS & CSS directly into HTML so it runs 100% offline under file:/// protocol without CORS issues
  ],
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 5173,
    open: true,
  }
})
