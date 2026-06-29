import {fileURLToPath} from 'node:url'

import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [
    react({
      babel: {
        /*
         * Only what tests actually need. We deliberately omit react-compiler,
         * reanimated/plugin, and react-native-dotenv - those matter for render
         * semantics and native/build output, none of which our tests exercise.
         */
        plugins: [
          '@lingui/babel-plugin-lingui-macro',
          '@babel/plugin-transform-class-static-block',
        ],
      },
    }),
  ],
  resolve: {
    alias: [
      /*
       * Mirror the babel module-resolver aliases (also in tsconfig.json).
       */
      {find: /^#\/(.*)$/, replacement: r('./src/$1')},
      {find: /^crypto$/, replacement: r('./src/platform/crypto.ts')},

      /*
       * Former Jest moduleNameMapper entries. Vite's ESM resolution may make
       * some of these unnecessary, but they're harmless and proven, so keep
       * them for now and prune opportunistically.
       */
      {
        find: /^multiformats$/,
        replacement: r('./node_modules/multiformats/dist/src/index.js'),
      },
      {
        find: /^multiformats\/cid$/,
        replacement: r('./node_modules/multiformats/dist/src/cid.js'),
      },
      {
        find: /^multiformats\/bases\/base32$/,
        replacement: r('./node_modules/multiformats/dist/src/bases/base32.js'),
      },
      {
        find: /^multiformats\/hashes\/digest$/,
        replacement: r('./node_modules/multiformats/dist/src/hashes/digest.js'),
      },
      {
        find: /^multiformats\/hashes\/sha2$/,
        replacement: r('./node_modules/multiformats/dist/src/hashes/sha2.js'),
      },
      {
        find: /^uint8arrays\/from-string$/,
        replacement: r('./node_modules/uint8arrays/dist/src/from-string.js'),
      },
      {
        find: /^uint8arrays\/to-string$/,
        replacement: r('./node_modules/uint8arrays/dist/src/to-string.js'),
      },
      {
        find: /^unicode-segmenter\/grapheme$/,
        replacement: r('./node_modules/unicode-segmenter/grapheme.cjs'),
      },
      {
        find: /^await-lock$/,
        replacement: r('./node_modules/await-lock/build/AwaitLock.js'),
      },
    ],
  },
  define: {__DEV__: 'true'},
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest/vitestSetup.ts'],
    /*
     * Only the app's own tests, which live under __tests__/ and src/. The
     * sibling packages (bskyembed, bskyogcard, dev-env, bskylink) have their
     * own runners and must not be swept up.
     */
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      // Stale duplicate test trees live here - must not be picked up.
      '.claude/worktrees/**',
      '__e2e__/**',
      '**/__mocks__/**',
    ],
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: {junit: './junit.xml'},
  },
})
