const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const { withAlias } = require('@expo/webpack-config/addons')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { codecovWebpackPlugin } = require('@codecov/webpack-plugin')

const CODECOV_ANALYZER = process.env.EXPO_PUBLIC_CODECOV_ANALYZER === '1'
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
  config.module.rules = [
    ...(config.module.rules || []),
    reactNativeWebWebviewConfiguration,
  ]
  if (env.mode === 'development') {
    config.plugins.push(new ReactRefreshWebpackPlugin())
  }

  config.mode = 'development'
  config.optimization = {
    ...config.optimization,
    minimize: false,
    usedExports: false,
  }

  debugger


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

  if (CODECOV_ANALYZER) {
    config.plugins.push(
      codecovWebpackPlugin({
        enableBundleAnalysis:
          process.env.EXPO_PUBLIC_CODECOV_TOKEN !== undefined,
        bundleName: 'social-app',
        uploadToken: process.env.EXPO_PUBLIC_CODECOV_TOKEN,
      }),
    )
  }
  return config
}
