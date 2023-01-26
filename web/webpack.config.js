const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackEnv = process.env.NODE_ENV || 'development'

const appDirectory = path.resolve(__dirname, '../')

// NOTE: node modules that ship as typescript must be listed here
const uncompiled_deps = [
  '@bam.tech/react-native-image-resizer',
  'react-native-fs',
  'rn-fetch-blob',
  'react-native-root-toast',
  'react-native-root-siblings',
  'react-native-linear-gradient',
]

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'src'),
    ...uncompiled_deps.map(dep =>
      path.resolve(appDirectory, `node_modules/${dep}`),
    ),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: ['module:metro-react-native-babel-preset'],
      plugins: ['react-native-web'],
    },
  },
}

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
      esModule: false,
    },
  },
}

module.exports = {
  mode: webpackEnv,

  entry: [
    // NOTE: load any web API polyfills needed here
    path.resolve(appDirectory, 'index.web.js'),
  ],

  output: {
    filename: 'bundle.web.js',
    path: path.resolve(appDirectory, 'dist'),
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, './public/index.html'),
    }),
  ],

  module: {
    rules: [babelLoaderConfiguration, imageLoaderConfiguration],
  },

  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-linear-gradient': 'react-native-web-linear-gradient',
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.tsx',
      '.ts',
      '.web.jsx',
      '.web.js',
      '.jsx',
      '.js',
    ],
  },
}
