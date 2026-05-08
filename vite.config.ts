import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: true,
    https: true,
    proxy: {
      // Match '/api/*' only — using a regex so '/api-keys' (a frontend
      // route, not a backend prefix) doesn't get accidentally forwarded
      // to the .NET backend. The original '/api' string match was a
      // prefix match that swallowed any path starting with those chars.
      '^/api/.*': {
        target: 'https://localhost:5267',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
