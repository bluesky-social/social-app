// Learn more https://docs.expo.io/guides/customizing-metro
const {resolve} = require('node:path')
const {getDefaultConfig} = require('expo/metro-config')

const projectRoot = __dirname
const atprotoRoot = resolve(projectRoot, '../atproto')

const cfg = getDefaultConfig(projectRoot)

const atprotoPackagesDirs = [
  'packages/api',
  'packages/aws',
  'packages/bsky',
  'packages/bsync',
  'packages/common',
  'packages/common-web',
  'packages/crypto',
  'packages/dev-env',
  'packages/dev-infra',
  'packages/did',
  'packages/identity',
  'packages/lex-cli',
  'packages/lexicon',
  'packages/ozone',
  'packages/pds',
  'packages/repo',
  'packages/syntax',
  'packages/xrpc',
  'packages/xrpc-server',
  'packages/oauth/jwk',
  'packages/oauth/jwk-jose',
  'packages/oauth/jwk-webcrypto',
  'packages/oauth/oauth-client',
  'packages/oauth/oauth-client-browser',
  'packages/oauth/oauth-client-node',
  'packages/oauth/oauth-provider',
  'packages/oauth/oauth-types',
  'packages/internal/did-resolver',
  'packages/internal/fetch',
  'packages/internal/fetch-node',
  'packages/internal/handle-resolver',
  'packages/internal/handle-resolver-node',
  'packages/internal/identity-resolver',
  'packages/internal/pipe',
  'packages/internal/rollup-plugin-bundle-manifest',
  'packages/internal/simple-store',
  'packages/internal/simple-store-memory',
]

cfg.resolver.extraNodeModules = Object.fromEntries(
  atprotoPackagesDirs.map(dir => {
    const namespace = dir.includes('internal') ? '@atproto-labs' : '@atproto'
    const name = dir.split('/').pop()
    return [`${namespace}/${name}`, resolve(atprotoRoot, dir)]
  }),
)

cfg.watchFolders = [
  projectRoot,
  atprotoRoot,
  ...Object.values(cfg.resolver.extraNodeModules),
]

cfg.resolver.nodeModulesPaths = [
  resolve(projectRoot, 'node_modules'),
  resolve(atprotoRoot, 'node_modules'),
]

cfg.resolver.sourceExts = process.env.RN_SRC_EXT
  ? process.env.RN_SRC_EXT.split(',').concat(cfg.resolver.sourceExts)
  : cfg.resolver.sourceExts

cfg.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
    nonInlinedRequires: [
      // We can remove this option and rely on the default after
      // https://github.com/facebook/metro/pull/1126 is released.
      'React',
      'react',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
      'react-native',
    ],
  },
})

module.exports = cfg
