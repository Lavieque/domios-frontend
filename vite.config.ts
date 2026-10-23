/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    // Os testes nunca falam com uma Api real: o fetch é sempre substituído.
    env: { VITE_API_BASE_URL: 'http://api.test/api/v1' },
  },
})
