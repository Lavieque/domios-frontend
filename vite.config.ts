/// <reference types="vitest/config" />
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// As fotos da demo (public/demo) só vão no build da demo, não no de produção.
function dropDemoAssets(mode: string): Plugin {
  let outDir = 'dist'
  return {
    name: 'drop-demo-assets',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      if (mode !== 'demo') rmSync(resolve(outDir, 'demo'), { recursive: true, force: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), dropDemoAssets(mode)],
  server: {
    port: 5173,
  },
  test: {
    // Os testes nunca falam com uma Api real: o fetch é sempre substituído.
    env: { VITE_API_BASE_URL: 'http://api.test/api/v1' },
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ é do Playwright (npm run e2e), não do Vitest.
    include: ['{src,site,admin}/**/*.test.{ts,tsx}'],
    // npm run coverage: o relatório HTML fica em coverage/.
    coverage: {
      provider: 'v8',
      include: ['{src,site,admin}/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', 'src/test/**', 'src/i18n/{pt,en}/**', '**/*.d.ts'],
      reporter: ['text-summary', 'html'],
    },
  },
}))
