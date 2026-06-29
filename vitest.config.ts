import {fileURLToPath} from 'node:url'

import babel from 'vite-plugin-babel'
import {defineConfig} from 'vitest/config'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [
    /*
     * esbuild handles TS/JSX transpilation; babel runs only for the lingui
     * macro, which must be expanded in every .ts/.tsx file that uses it (not
     * just JSX files). We deliberately omit react-compiler, reanimated/plugin,
     * and react-native-dotenv - those matter for render semantics and
     * native/build output, none of which our tests exercise.
     */
    babel({
      include: /\.[jt]sx?$/,
      exclude: /node_modules/,
      babelConfig: {
        babelrc: false,
        configFile: false,
        /*
         * The plugin runs with enforce: 'pre', so babel receives raw
         * TypeScript before esbuild strips types - it needs the TS preset to
         * parse it. preset-typescript auto-enables JSX for .tsx filenames.
         */
        /*
         * Default onlyRemoveTypeImports: false so babel elides imports whose
         * specifiers are all types (e.g. `import {type X} from '...'`).
         * Otherwise such imports survive as side-effect imports and drag whole
         * runtime module graphs (and their native deps) into tests.
         */
        presets: ['@babel/preset-typescript'],
        plugins: [
          '@lingui/babel-plugin-lingui-macro',
          '@babel/plugin-transform-class-static-block',
        ],
      },
    }),
  ],
  resolve: {
    /*
     * Mirror Metro's platform-specific resolution so Component.native.ts /
     * Component.ios.ts win over Component.ts (matching the jest-expo/ios
     * preset, which resolves ios then native). Without this, files like
     * PlatformInfo/index.ts (which throws NotImplementedError) load instead of
     * index.native.ts (which uses the stubbed requireNativeModule).
     */
    extensions: [
      '.ios.ts',
      '.ios.tsx',
      '.ios.js',
      '.ios.jsx',
      '.native.ts',
      '.native.tsx',
      '.native.js',
      '.native.jsx',
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ],
    alias: [
      /*
       * Mirror the babel module-resolver aliases (also in tsconfig.json).
       */
      {find: /^#\/(.*)$/, replacement: r('./src/$1')},
      {find: /^crypto$/, replacement: r('./src/platform/crypto.ts')},

      /*
       * react-native's real entry is Flow-typed and boots a native runtime.
       * Redirect it (and deep Libraries/* subpaths some packages import) to a
       * small stub. Aliasing at resolution time is more robust than a
       * setup-file vi.mock, which doesn't reach imports from externalized CJS
       * deps like @bsky.app/react-native-mmkv.
       */
      {find: /^react-native$/, replacement: r('./vitest/react-native-stub.ts')},
      {
        find: /^react-native\/.*$/,
        replacement: r('./vitest/react-native-stub.ts'),
      },

      /*
       * Native MMKV module - binds to a native lib and imports react-native.
       * Stubbed so transitive importers (#/storage) load. Tests that exercise
       * storage logic still vi.mock this with their own in-memory impl, which
       * takes precedence over the alias.
       */
      {
        find: /^@bsky\.app\/react-native-mmkv$/,
        replacement: r('./vitest/mmkv-stub.ts'),
      },

      /*
       * @sentry/react-native is CJS and requires react-native internally.
       * Stubbed so modules that pull it in via #/logger load. logger.test.ts
       * still vi.mocks it directly to assert on calls.
       */
      {
        find: /^@sentry\/react-native$/,
        replacement: r('./vitest/sentry-stub.ts'),
      },

      /*
       * expo-application pulls in the `expo` package's native winter runtime,
       * which does bare CJS requires that don't resolve under Vitest.
       */
      {
        find: /^expo-application$/,
        replacement: r('./vitest/expo-application-stub.ts'),
      },

      /*
       * The bare `expo` package's entry runs the winter runtime side-effect on
       * import (bare CJS requires that don't resolve under node). Stub it to
       * the named exports test-reachable code uses.
       */
      {find: /^expo$/, replacement: r('./vitest/expo-stub.ts')},

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
  /*
   * Match jest's effective environment: under jest __DEV__ was true but
   * JEST_WORKER_ID was set, so dev-only branches guarded by
   * `__DEV__ && !process.env.JEST_WORKER_ID` took the production path. Setting
   * __DEV__ to false reproduces that for the equivalent branches in Vitest.
   */
  define: {__DEV__: 'false'},
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
