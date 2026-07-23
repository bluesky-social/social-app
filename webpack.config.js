const path = require('path')

const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const {withAlias} = require('@expo/webpack-config/addons')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const {sentryWebpackPlugin} = require('@sentry/webpack-plugin')
const {version} = require('./package.json')

const GENERATE_STATS = process.env.EXPO_PUBLIC_GENERATE_STATS === '1'
const OPEN_ANALYZER = process.env.EXPO_PUBLIC_OPEN_ANALYZER === '1'

const reactNativeWebWebviewConfiguration = {
  test: /postMock.html$/,
  use: {
    loader: 'file-loader',
    options: {
      name: '[name].[ext]',
    },
  },
}

// Walk a rule tree and wrap source-map-loader's filterSourceMappingUrl to
// drop sourcemap references matching the given path pattern. Mutates in place.
function patchSourceMapFilter(rules, pathPattern) {
  if (!rules) return
  for (const rule of rules) {
    if (!rule || typeof rule !== 'object') continue
    if (rule.oneOf) patchSourceMapFilter(rule.oneOf, pathPattern)
    if (rule.rules) patchSourceMapFilter(rule.rules, pathPattern)
    const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : []
    for (const use of uses) {
      if (!use?.loader?.includes('source-map-loader')) continue
      const prev = use.options?.filterSourceMappingUrl
      use.options = {
        ...use.options,
        filterSourceMappingUrl(url, resourcePath) {
          if (pathPattern.test(resourcePath)) return 'remove'
          return prev ? prev(url, resourcePath) : true
        },
      }
    }
  }
}

module.exports = async function (env, argv) {
  env.babel = {
    dangerouslyAddModulePathsToTranspile: ['@bsky.app/expo', '@atproto/api'],
  }
  let config = await createExpoWebpackConfigAsync(env, argv)
  /*
   * Expo only registers its own internal config as a cache build dependency,
   * so changes to this file (e.g. aliases) don't invalidate the persistent
   * filesystem cache and stale module resolutions get reused. Register this
   * file so edits here always bust the cache.
   */
  if (config.cache?.buildDependencies) {
    config.cache.buildDependencies.config = [
      ...(config.cache.buildDependencies.config || []),
      __filename,
    ]
  }
  config = withAlias(config, {
    'react-native$': 'react-native-web',
    /*
     * Codegen specs import this via a deep `react-native/*` path, which skips
     * the exact-match alias above and pulls RN core into the web bundle. RN
     * core's platform-extension modules have no `.web` variant, so they
     * resolve to themselves and blow up with a TDZ error on startup.
     */
    'react-native/Libraries/Utilities/codegenNativeComponent$': path.join(
      __dirname,
      'src/lib/web-shims/codegenNativeComponent.js',
    ),
    'react-native-webview': 'react-native-web-webview',
    'react-native-gesture-handler': false, // RNGH should not be used on web, so let's cause a build error if it sneaks in
    '@sentry-internal/replay': false, // not used, ~300kb of dead weight
    /*
     * react-native-svg's fetchData util imports the ~55KB `buffer` polyfill,
     * but is only needed by SvgUri/SvgXml remote loading, which we don't use.
     * Stubbing it out makes fetchText undefined, so it throws if ever called.
     * The alias key must be an absolute path because the package imports it
     * via a relative path internally.
     */
    [path.join(
      __dirname,
      'node_modules/react-native-svg/lib/module/utils/fetchData',
    )]: false,
  })

  // react-native-uuid ships sourceMappingURL comments but no .map files.
  patchSourceMapFilter(config.module.rules, /react-native-uuid/)
  config.module.rules = [
    ...(config.module.rules || []),
    reactNativeWebWebviewConfiguration,
  ]
  if (env.mode === 'development') {
    config.plugins.push(new ReactRefreshWebpackPlugin())
    // Reap zombie HMR WebSocket connections that linger after refresh.
    // Without this, dead sockets exhaust the browser's per-origin connection
    // pool and the dev server stops responding.
    config.devServer.onListening = devServer => {
      devServer.server.on('connection', socket => {
        socket.setTimeout(10000)
        socket.on('timeout', () => socket.destroy())
      })
    }
  } else {
    // Support static CDN for chunks
    config.output.publicPath = 'auto'
  }

  if (GENERATE_STATS || OPEN_ANALYZER) {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        openAnalyzer: OPEN_ANALYZER,
        generateStatsFile: true,
        statsFilename: '../stats.json',
        analyzerMode: OPEN_ANALYZER ? 'server' : 'json',
        defaultSizes: 'parsed',
      }),
    )
  }
  if (process.env.SENTRY_AUTH_TOKEN) {
    config.plugins.push(
      sentryWebpackPlugin({
        org: 'blueskyweb',
        project: 'app',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: {
          // fallback needed for Render.com deployments
          name: process.env.SENTRY_RELEASE || version,
          dist: process.env.SENTRY_DIST,
        },
      }),
    )
  }
  return config
}
