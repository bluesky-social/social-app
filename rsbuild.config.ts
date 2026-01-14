import {createRequire} from 'node:module'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {defineConfig} from '@rsbuild/core'
import {pluginBabel} from '@rsbuild/plugin-babel'
import {pluginReact} from '@rsbuild/plugin-react'
// @ts-expect-error - webpack plugins, types may not match exactly
import {sentryWebpackPlugin} from '@sentry/webpack-plugin'

const {version} = require('./package.json')

const require_ = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const nodeModules = join(__dirname, 'node_modules')

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(?:js|jsx|ts|tsx)$/,
      // Exclude already-compiled packages that don't need babel transformation
      exclude: [
        /node_modules\/@atproto/,
        /node_modules\/tlds/,
        /node_modules\/@braintree/,
      ],
      babelLoaderOptions: {
        presets: [['babel-preset-expo', {lazyImports: true}]],
        plugins: [
          'macros',
          ['babel-plugin-react-compiler', {target: '19'}],
          [
            'module:react-native-dotenv',
            {
              envName: 'APP_ENV',
              moduleName: '@env',
              path: '.env',
              allowUndefined: true,
            },
          ],
          [
            'module-resolver',
            {alias: {'#': './src', crypto: './src/platform/crypto.ts'}},
          ],
          'react-native-reanimated/plugin',
        ],
      },
    }),
  ],

  source: {
    entry: {index: './index.web.js'},
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      // Expo public env vars - these are accessed via process.env.EXPO_PUBLIC_*
      'process.env.EXPO_PUBLIC_ENV': JSON.stringify(
        process.env.EXPO_PUBLIC_ENV,
      ),
      'process.env.EXPO_PUBLIC_RELEASE_VERSION': JSON.stringify(
        process.env.EXPO_PUBLIC_RELEASE_VERSION,
      ),
      'process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER': JSON.stringify(
        process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER,
      ),
      'process.env.EXPO_PUBLIC_BUNDLE_DATE': JSON.stringify(
        process.env.EXPO_PUBLIC_BUNDLE_DATE,
      ),
      'process.env.EXPO_PUBLIC_LOG_LEVEL': JSON.stringify(
        process.env.EXPO_PUBLIC_LOG_LEVEL,
      ),
      'process.env.EXPO_PUBLIC_LOG_DEBUG': JSON.stringify(
        process.env.EXPO_PUBLIC_LOG_DEBUG,
      ),
      'process.env.EXPO_PUBLIC_BLUESKY_PROXY_DID': JSON.stringify(
        process.env.EXPO_PUBLIC_BLUESKY_PROXY_DID,
      ),
      'process.env.EXPO_PUBLIC_CHAT_PROXY_DID': JSON.stringify(
        process.env.EXPO_PUBLIC_CHAT_PROXY_DID,
      ),
      'process.env.EXPO_PUBLIC_SENTRY_DSN': JSON.stringify(
        process.env.EXPO_PUBLIC_SENTRY_DSN,
      ),
      'process.env.EXPO_PUBLIC_BITDRIFT_API_KEY': JSON.stringify(
        process.env.EXPO_PUBLIC_BITDRIFT_API_KEY,
      ),
      'process.env.EXPO_PUBLIC_GCP_PROJECT_ID': JSON.stringify(
        process.env.EXPO_PUBLIC_GCP_PROJECT_ID,
      ),
      // Other env vars used in the app
      'process.env.BAPP_CONFIG_DEV_URL': JSON.stringify(
        process.env.BAPP_CONFIG_DEV_URL,
      ),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.JEST_WORKER_ID': JSON.stringify(process.env.JEST_WORKER_ID),
      // expo-constants uses this for web manifest
      'process.env.APP_MANIFEST': JSON.stringify({}),
      // expo uses these for platform detection
      'process.env.EXPO_OS': JSON.stringify('web'),
      'process.env.EXPO_BASE_URL': JSON.stringify(''),
    },
  },

  resolve: {
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.js',
      '.tsx',
      '.ts',
      '.js',
      '.json',
    ],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-webview': 'react-native-web-webview',
      'react-native-gesture-handler': false,
      // Use source to allow .web.tsx resolution (patched with web fallback)
      'react-native-uitextview': join(
        nodeModules,
        'react-native-uitextview/src/index',
      ),
      // Force ESM version (same as webpack.config.js)
      'unicode-segmenter/grapheme': require_
        .resolve('unicode-segmenter/grapheme')
        .replace(/\.cjs$/, '.js'),
      // multiformats package exports resolution (same as metro.config.js)
      // Use $ suffix for exact match and direct file paths
      'multiformats/hashes/hasher$': join(
        nodeModules,
        'multiformats/esm/src/hashes/hasher.js',
      ),
      'multiformats/cid$': join(nodeModules, 'multiformats/esm/src/cid.js'),
      // @ipld/dag-cbor only exports '.' in package.json, use direct file path
      '@ipld/dag-cbor$': join(nodeModules, '@ipld/dag-cbor/src/index.js'),
    },
  },

  output: {
    distPath: {
      root: 'web-build',
      js: 'static/js',
      css: 'static/css',
      image: 'static/media',
      font: 'static/media',
      svg: 'static/media',
      media: 'static/media',
    },
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
    },
    assetPrefix: process.env.NODE_ENV === 'production' ? 'auto' : '/',
    manifest: true,
    sourceMap: {
      js:
        process.env.GENERATE_SOURCEMAP === 'false'
          ? false
          : process.env.NODE_ENV === 'production'
            ? 'source-map'
            : 'cheap-module-source-map',
      css: true,
    },
  },

  html: {
    template: './web/index.html',
    templateParameters: {WEB_TITLE: 'Bluesky'},
    favicon: './assets/favicon.png',
  },

  server: {port: 19006},

  performance: {
    // Enable with BUNDLE_ANALYZE=true rsbuild build
    // Or BUNDLE_ANALYZE=server to open in browser
    bundleAnalyze: process.env.BUNDLE_ANALYZE
      ? {
          analyzerMode:
            process.env.BUNDLE_ANALYZE === 'server' ? 'server' : 'static',
          openAnalyzer: process.env.BUNDLE_ANALYZE === 'server',
          generateStatsFile: true,
          statsFilename: '../stats.json',
        }
      : undefined,
  },

  tools: {
    rspack: (config, {rspack}) => {
      // Wrap chunks in IIFE for proper CommonJS scope (fixes "exports is not defined")
      config.output = config.output || {}
      config.output.iife = true

      // Disable async vendor chunk splitting - fixes "exports is not defined"
      // error with CommonJS modules like @atproto/api
      config.optimization = config.optimization || {}
      config.optimization.splitChunks = {
        chunks: 'async',
        cacheGroups: {
          // Disable default vendor chunk splitting
          defaultVendors: false,
          default: false,
        },
      }

      // Module replacements for packages that don't work with rspack's module resolution
      config.plugins = config.plugins || []

      // multiformats/hashes/hasher - redirect to ESM source file
      config.plugins.push(
        new rspack.NormalModuleReplacementPlugin(
          /^multiformats\/hashes\/hasher$/,
          join(nodeModules, 'multiformats/esm/src/hashes/hasher.js'),
        ),
      )
      // multiformats/cid - redirect to ESM source file
      config.plugins.push(
        new rspack.NormalModuleReplacementPlugin(
          /^multiformats\/cid$/,
          join(nodeModules, 'multiformats/esm/src/cid.js'),
        ),
      )
      // @ipld/dag-cbor - redirect to src
      config.plugins.push(
        new rspack.NormalModuleReplacementPlugin(
          /^@ipld\/dag-cbor$/,
          join(nodeModules, '@ipld/dag-cbor/src/index.js'),
        ),
      )

      // Force CommonJS modules to be parsed correctly
      config.module = config.module || {}
      config.module.parser = config.module.parser || {}
      config.module.parser.javascript = config.module.parser.javascript || {}
      config.module.parser.javascript.commonjsMagicComments = true

      config.module.rules = config.module.rules || []

      // postMock.html for react-native-web-webview
      config.module.rules.push({
        test: /postMock\.html$/,
        type: 'asset/resource',
        generator: {filename: '[name][ext]'},
      })

      // Sentry (optional)
      if (process.env.SENTRY_AUTH_TOKEN) {
        config.plugins = config.plugins || []
        config.plugins.push(
          sentryWebpackPlugin({
            org: 'blueskyweb',
            project: 'app',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: {
              name: process.env.SENTRY_RELEASE || version,
              dist: process.env.SENTRY_DIST,
            },
          }),
        )
      }

      return config
    },
  },
})
