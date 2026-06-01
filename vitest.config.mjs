import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
    environment: 'node',
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      reporter: ['text', 'json-summary'],
      include: [
        'app/api/auth/**/*.ts',
        'lib/auth/cognito.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('.', '.'),
    },
  },
})
