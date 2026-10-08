import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
    'playwright-report-production/**',
    'production-e2e-reports/**',
    'test-results/**',
  ]),
  {
    files: [
      'components/company-report-page.tsx',
      'components/job-listings-client.tsx',
      'components/public-jobs-board.tsx',
      'components/steps/user-registration-*.tsx',
      'hooks/use-area-options.ts',
    ],
    rules: { 'react-hooks/set-state-in-effect': 'off', 'react-hooks/immutability': 'off' },
  },
])
