import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    globalSetup: ['./tests/global-teardown.ts'],
    include: ['tests/**/*.test.ts', 'modules/**/__tests__/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'design', 'tests/integration/import.test.ts'], // Skip import tests for now
    testTimeout: 60000, // Increased timeout for integration tests
    hookTimeout: 60000,
    // Run tests sequentially to reduce rate limiting
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
