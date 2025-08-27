const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const {withAlias} = require('@expo/webpack-config/addons')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const {sentryWebpackPlugin} = require('@sentry/webpack-plugin')
const {version} = require('./package.json')
const path = require('path')

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

module.exports = async function (env, argv) {
  let config = await createExpoWebpackConfigAsync(env, argv)
  config = withAlias(config, {
    'react-native$': 'react-native-web',
    'react-native-webview': 'react-native-web-webview',
  })
  // Remove source-map-loader (causing noisy missing TS source warnings in some RN deps)
  function pruneSourceMapLoader(rules) {
    if (!Array.isArray(rules)) return
    for (let i = rules.length - 1; i >= 0; i--) {
      const r = rules[i]
      if (r && r.loader && /source-map-loader/.test(r.loader)) {
        rules.splice(i, 1)
        continue
      }
      if (r && Array.isArray(r.use)) {
        r.use = r.use.filter(u => !(u.loader && /source-map-loader/.test(u.loader)))
      }
      if (r && r.oneOf) pruneSourceMapLoader(r.oneOf)
      if (r && r.rules) pruneSourceMapLoader(r.rules)
    }
  }
  pruneSourceMapLoader(config.module.rules)

  // Ignore the specific missing source map warnings from react-native-root-siblings
  const ignoreRe = /react-native-root-siblings\/src\/.*\.tsx/i
  config.ignoreWarnings = (config.ignoreWarnings || []).concat(warn => {
    if (typeof warn === 'string') return false
    const msg = warn.message || ''
    return msg.includes('Failed to parse source map') && ignoreRe.test(msg)
  })

  config.module.rules = [
    ...(config.module.rules || []),
    reactNativeWebWebviewConfiguration,
  ]
  if (env.mode === 'development') {
    config.plugins.push(new ReactRefreshWebpackPlugin())
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
        org: 'ganderweb',
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
