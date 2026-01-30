import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: true,
    https: false,
    allowedHosts: [
      'subbronchial-alisia-unreprobatively.ngrok-free.dev',
      'localhost',
      '127.0.0.1'
    ]
  }
})
