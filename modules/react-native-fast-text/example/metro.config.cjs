/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const {getDefaultConfig} = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
const root = path.resolve(__dirname, '../../..')
config.watchFolders = [root]
config.resolver.assetExts.push('woff2')
config.resolver.nodeModulesPaths = [path.join(root, 'node_modules')]
/** @type {Record<string, string>} */
const fixtures = {
  '#/storage': 'storage.ts',
  '#/env': 'environment.ts',
  '#/logger': 'logger.ts',
  '#/lib/constants': 'constants.ts',
  '#/components/Layout': 'constants.ts',
}
/** @type {import('metro-resolver').CustomResolver} */
const resolveRequest = (context, name, platform) => {
  if (fixtures[name]) {
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'fixtures', fixtures[name]),
    }
  }
  if (name.startsWith('#/')) name = path.join(root, 'src', name.slice(2))
  return context.resolveRequest(context, name, platform)
}
config.resolver.resolveRequest = resolveRequest
module.exports = config
