import {fileURLToPath} from 'node:url'

import {lingui} from '@lingui/vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [lingui()],
  define: {
    __DEV__: 'true',
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      crypto: fileURLToPath(new URL('./src/platform/crypto.ts', import.meta.url)),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./vitest/setup.ts'],
    include: [
      '__tests__/**/*.test.{ts,tsx,js,jsx}',
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
      'eslint/**/*.test.{js,ts}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/__mocks__/**',
      '__e2e__/**',
      'bskylink/**',
      'bskyembed/**',
    ],
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      exclude: [
        'node_modules/**',
        'src/platform/**',
        'src/third-party/**',
        'src/view/com/util/**',
        'src/state/lib/**',
        '__tests__/test-utils.js',
      ],
    },
    server: {
      deps: {
        inline: [
          /^react-native($|\/)/,
          /^@react-native($|\/)/,
          /^expo($|-|\/)/,
          /^@expo($|\/)/,
          /^@react-navigation($|\/)/,
          /^react-native-svg($|\/)/,
          /^nanoid($|\/)/,
          /^@sentry($|\/)/,
          /^sentry-expo($|\/)/,
          /^bcp-47-match($|\/)/,
        ],
      },
    },
  },
})
