import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '.cert/localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '.cert/localhost+2.pem')),
    },
    host: true,
  },
})
