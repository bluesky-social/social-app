const fs = require('fs')
const path = require('path')
const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const {withAlias} = require('@expo/webpack-config/addons')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')

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

  if (process.env.ATPROTO_ROOT) {
    const atprotoRoot = path.resolve(process.cwd(), process.env.ATPROTO_ROOT)
    const atprotoPackages = path.join(atprotoRoot, 'packages')

    config = withAlias(
      config,
      Object.fromEntries(
        fs
          .readdirSync(atprotoPackages)
          .map(pkgName => [pkgName, path.join(atprotoPackages, pkgName)])
          .filter(([_, pkgPath]) =>
            fs.existsSync(path.join(pkgPath, 'package.json')),
          )
          .map(([pkgName, pkgPath]) => [`@atproto/${pkgName}`, pkgPath]),
      ),
    )
  }

  config.module.rules = [
    ...(config.module.rules || []),
    reactNativeWebWebviewConfiguration,
  ]
  if (env.mode === 'development') {
    config.plugins.push(new ReactRefreshWebpackPlugin())
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
  return config
}
