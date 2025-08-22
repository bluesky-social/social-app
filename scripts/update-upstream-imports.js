#!/usr/bin/env node
/**
 * Script to rewrite all @atproto/@atproto-labs imports to @gander-social-atproto/@gander-atproto-nest (or vice versa)
 * and update package.json dependencies to the closest or latest available version from the target upstream.
 * Version strategy is controlled by UPSTREAM_VERSION_STRATEGY=closest|latest (default: closest)
 * based on BUILD_UPSTREAM_SOURCE in .env or lib/constants.ts
 */
const fs = require('fs')
const path = require('path')
const {execSync} = require('child_process')
const semver = require('semver')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const SRC_FOLDERS = [
  'src',
  'gndrembed',
  'gndrlink',
  'gndrogcard',
  'gndrweb',
  'modules',
]
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const EXCLUDE_DIRS = [
  'node_modules',
  'build',
  'dist',
  '__tests__',
  '__e2e__',
  '__mocks__',
  'android',
  'ios',
  'web-build',
]

function getEnvUpstreamSource() {
  // Try .env first
  const envPath = path.join(PROJECT_ROOT, '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const match = envContent.match(/^BUILD_UPSTREAM_SOURCE=(.*)$/m)
    if (match) return match[1].trim()
  }
  // Fallback: try lib/constants.ts
  const constantsPath = path.join(PROJECT_ROOT, 'src/lib/constants.ts')
  if (fs.existsSync(constantsPath)) {
    const constantsContent = fs.readFileSync(constantsPath, 'utf8')
    const match = constantsContent.match(
      /export const BUILD_UPSTREAM_SOURCE = ['"](bluesky|gander)['"]/,
    )
    if (match) return match[1]
  }
  // Default
  return 'bluesky'
}

function getVersionStrategy() {
  return process.env.UPSTREAM_VERSION_STRATEGY || 'closest'
}

function getUpstreamMap(upstream) {
  if (upstream === 'gander') {
    return {
      // @atproto -> @gander-social-atproto
      '@atproto/': '@gander-social-atproto/',
      '@atproto/api': '@gander-social-atproto/api',
      '@atproto/common': '@gander-social-atproto/common',
      '@atproto/common-web': '@gander-social-atproto/common-web',
      '@atproto/crypto': '@gander-social-atproto/crypto',
      '@atproto/syntax': '@gander-social-atproto/syntax',
      '@atproto/core': '@gander-social-atproto/core',
      '@atproto/did-resolver': '@gander-social-atproto/did-resolver',
      '@atproto/lexicon': '@gander-social-atproto/lexicon',
      '@atproto/lex-cli': '@gander-social-atproto/lex-cli',
      '@atproto/identity': '@gander-social-atproto/identity',
      '@atproto/did': '@gander-social-atproto/did',
      '@atproto/pds': '@gander-social-atproto/pds',
      '@atproto/plc': '@gander-social-atproto/plc',
      '@atproto/repo': '@gander-social-atproto/repo',
      '@atproto/aws': '@gander-social-atproto/aws',
      '@atproto/server': '@gander-social-atproto/server',
      '@atproto/bsync': '@gander-social-atproto/bsync',
      '@atproto/ozone': '@gander-social-atproto/ozone',
      '@atproto/sync': '@gander-social-atproto/sync',
      '@atproto/bsky': '@gander-social-atproto/gndr',
      '@atproto/xrpc': '@gander-social-atproto/xrpc',
      '@atproto/jwk': '@gander-social-atproto/jwk',
      '@atproto/jwk-jose': '@gander-social-atproto/jwk-jose',
      '@atproto/jwk-webcrypto': '@gander-social-atproto/jwk-webcrypto',
      '@atproto/oauth-client': '@gander-social-atproto/oauth-client',
      '@atproto/oauth-client-browser': '@gander-social-atproto/oauth-client-browser',
      '@atproto/oauth-client-browser-example': '@gander-social-atproto/oauth-client-browser-example',
      '@atproto/oauth-client-node': '@gander-social-atproto/oauth-client-node',
      '@atproto/oauth-provider': '@gander-social-atproto/oauth-provider',
      '@atproto/oauth-provider-api': '@gander-social-atproto/oauth-provider-api',
      '@atproto/oauth-provider-frontend': '@gander-social-atproto/oauth-provider-frontend',
      '@atproto/oauth-types': '@gander-social-atproto/oauth-types',
      '@atproto/xrpc-server': '@gander-social-atproto/xrpc-server',
      '@atproto/dev-env': '@gander-social-atproto/dev-env',
      // @atproto-labs -> @gander-atproto-nest
      '@atproto-labs/': '@gander-atproto-nest/',
      '@atproto-labs/xrpc-utils': '@gander-atproto-nest/xrpc-utils',
      '@atproto-labs/simple-store': '@gander-atproto-nest/simple-store',
      '@atproto-labs/simple-store-memory': '@gander-atproto-nest/simple-store-memory',
      '@atproto-labs/rollup-plugin-bundle-manifest': '@gander-atproto-nest/rollup-plugin-bundle-manifest',
      '@atproto-labs/pipe': '@gander-atproto-nest/pipe',
      '@atproto-labs/handle-resolver': '@gander-atproto-nest/handle-resolver',
      '@atproto-labs/fetch': '@gander-atproto-nest/fetch',
      '@atproto-labs/fetch-node': '@gander-atproto-nest/fetch-node',
      '@atproto-labs/handle-resolver-node': '@gander-atproto-nest/handle-resolver-node',
      '@atproto-labs/did-resolver': '@gander-atproto-nest/did-resolver',
      '@atproto-labs/identity-resolver': '@gander-atproto-nest/identity-resolver',
    }
  } else {
    return {
      // Reverse mapping: @gander-social-atproto -> @atproto
      '@gander-social-atproto/': '@atproto/',
      '@gander-social-atproto/api': '@atproto/api',
      '@gander-social-atproto/common': '@atproto/common',
      '@gander-social-atproto/common-web': '@atproto/common-web',
      '@gander-social-atproto/crypto': '@atproto/crypto',
      '@gander-social-atproto/syntax': '@atproto/syntax',
      '@gander-social-atproto/core': '@atproto/core',
      '@gander-social-atproto/did-resolver': '@atproto/did-resolver',
      '@gander-social-atproto/lexicon': '@atproto/lexicon',
      '@gander-social-atproto/lex-cli': '@atproto/lex-cli',
      '@gander-social-atproto/identity': '@atproto/identity',
      '@gander-social-atproto/did': '@atproto/did',
      '@gander-social-atproto/pds': '@atproto/pds',
      '@gander-social-atproto/plc': '@atproto/plc',
      '@gander-social-atproto/repo': '@atproto/repo',
      '@gander-social-atproto/aws': '@atproto/aws',
      '@gander-social-atproto/server': '@atproto/server',
      '@gander-social-atproto/bsync': '@atproto/bsync',
      '@gander-social-atproto/ozone': '@atproto/ozone',
      '@gander-social-atproto/sync': '@atproto/sync',
      '@gander-social-atproto/gndr': '@atproto/bsky',
      '@gander-social-atproto/xrpc': '@atproto/xrpc',
      '@gander-social-atproto/jwk': '@atproto/jwk',
      '@gander-social-atproto/jwk-jose': '@atproto/jwk-jose',
      '@gander-social-atproto/jwk-webcrypto': '@atproto/jwk-webcrypto',
      '@gander-social-atproto/oauth-client': '@atproto/oauth-client',
      '@gander-social-atproto/oauth-client-browser': '@atproto/oauth-client-browser',
      '@gander-social-atproto/oauth-client-browser-example': '@atproto/oauth-client-browser-example',
      '@gander-social-atproto/oauth-client-node': '@atproto/oauth-client-node',
      '@gander-social-atproto/oauth-provider': '@atproto/oauth-provider',
      '@gander-social-atproto/oauth-provider-api': '@atproto/oauth-provider-api',
      '@gander-social-atproto/oauth-provider-frontend': '@atproto/oauth-provider-frontend',
      '@gander-social-atproto/oauth-types': '@atproto/oauth-types',
      '@gander-social-atproto/xrpc-server': '@atproto/xrpc-server',
      '@gander-social-atproto/dev-env': '@atproto/dev-env',
      // Reverse mapping: @gander-atproto-nest -> @atproto-labs
      '@gander-atproto-nest/': '@atproto-labs/',
      '@gander-atproto-nest/xrpc-utils': '@atproto-labs/xrpc-utils',
      '@gander-atproto-nest/simple-store': '@atproto-labs/simple-store',
      '@gander-atproto-nest/simple-store-memory': '@atproto-labs/simple-store-memory',
      '@gander-atproto-nest/rollup-plugin-bundle-manifest': '@atproto-labs/rollup-plugin-bundle-manifest',
      '@gander-atproto-nest/pipe': '@atproto-labs/pipe',
      '@gander-atproto-nest/handle-resolver': '@atproto-labs/handle-resolver',
      '@gander-atproto-nest/fetch': '@atproto-labs/fetch',
      '@gander-atproto-nest/fetch-node': '@atproto-labs/fetch-node',
      '@gander-atproto-nest/handle-resolver-node': '@atproto-labs/handle-resolver-node',
      '@gander-atproto-nest/did-resolver': '@atproto-labs/did-resolver',
      '@gander-atproto-nest/identity-resolver': '@atproto-labs/identity-resolver',
    }
  }
}

function shouldProcessFile(filePath) {
  const excluded = EXCLUDE_DIRS.some(dir => filePath.split(path.sep).includes(dir));
  if (excluded) {
    // Uncomment for debugging:
    // console.log('Excluded:', filePath);
  }
  return (
    FILE_EXTENSIONS.some(ext => filePath.endsWith(ext)) &&
    !excluded
  );
}

function processFile(filePath, upstreamMap) {
  console.log('Processing:', filePath); // Log every file being processed
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false
  for (const [from, to] of Object.entries(upstreamMap)) {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from, 'g'), to)
      changed = true
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`Updated imports in: ${filePath}`)
  }
}

function walkDir(dir, upstreamMap) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry)) walkDir(fullPath, upstreamMap)
    } else if (shouldProcessFile(fullPath)) {
      processFile(fullPath, upstreamMap)
    }
  }
}

function getAvailableVersions(pkg) {
  try {
    const result = execSync(`npm view ${pkg} versions --json`, {
      encoding: 'utf8',
    })
    return JSON.parse(result)
  } catch (e) {
    return []
  }
}

function findClosestVersion(currentVersion, availableVersions) {
  if (!semver.valid(currentVersion))
    return availableVersions[availableVersions.length - 1]
  let closest = availableVersions[0]
  let minDiff = Infinity
  for (const v of availableVersions) {
    if (!semver.valid(v)) continue
    const diff = Math.abs(
      semver.diff(currentVersion, v) === null
        ? 0
        : semver.compare(currentVersion, v),
    )
    if (diff < minDiff) {
      minDiff = diff
      closest = v
    }
  }
  return closest
}

function updatePackageJson(upstream, versionStrategy) {
  const pkgPath = path.join(PROJECT_ROOT, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  let changed = false
  const depFields = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]
  const upstreamMap = getUpstreamMap(upstream)
  for (const field of depFields) {
    if (!pkg[field]) continue
    for (const dep of Object.keys(pkg[field])) {
      for (const [from, to] of Object.entries(upstreamMap)) {
        if (dep.startsWith(from)) {
          const newDep = dep.replace(from, to)
          const currentVersion = pkg[field][dep]
          const availableVersions = getAvailableVersions(newDep)
          let selectedVersion = availableVersions[availableVersions.length - 1] // default to latest
          if (versionStrategy === 'closest' && semver.valid(currentVersion)) {
            selectedVersion = findClosestVersion(
              currentVersion,
              availableVersions,
            )
          }
          pkg[field][newDep] = selectedVersion
          delete pkg[field][dep]
          changed = true
          console.log(
            `Updated dependency: ${dep}@${currentVersion} -> ${newDep}@${selectedVersion}`,
          )
        }
      }
    }
  }
  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    console.log('package.json dependencies updated for upstream:', upstream)
  }
}

function main() {
  const upstream = getEnvUpstreamSource()
  const versionStrategy = getVersionStrategy()
  const upstreamMap = getUpstreamMap(upstream)
  console.log(
    `Switching upstream imports to: ${upstream} (version strategy: ${versionStrategy})`,
  )
  for (const folder of SRC_FOLDERS) {
    const absFolder = path.join(PROJECT_ROOT, folder)
    if (fs.existsSync(absFolder)) walkDir(absFolder, upstreamMap)
  }
  updatePackageJson(upstream, versionStrategy)
  console.log('Upstream import update complete.')
}

main()
