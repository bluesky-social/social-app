// Learn more https://docs.expo.io/guides/customizing-metro
import {withNanoIcons} from 'react-native-nano-icons/metro'
import {getBundleModeMetroConfig} from 'react-native-worklets/bundleMode/index.js'
import {type CacheStore} from '@expo/metro/metro-cache'
import {type CustomResolver} from '@expo/metro/metro-resolver'
import {getDefaultConfig} from '@expo/metro-config'
import {existsSync} from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {getSentryExpoConfig} from '@sentry/react-native/metro.js'

const WORKLET_FILE_PREFIX = 'react-native-worklets/.worklets/'
const workletsDir = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve(
      'react-native-worklets/package.json',
    ),
  ),
  '.worklets',
)

/**
 * In bundle mode the worklets Babel plugin writes each worklet to
 * `node_modules/react-native-worklets/.worklets/<hash>.js` as a side effect
 * of transforming the file that defines it. Metro's cache key is the
 * project-relative path plus the file's contents, so a cache hit skips that
 * side effect. When the cache was filled by another worktree (they all share
 * `$TMPDIR/metro-cache`) or before a reinstall wiped `.worklets`, the hit
 * imports a file that doesn't exist and the bundle fails with ENOENT. Treat
 * such hits as misses so the file gets transformed, and its worklets written,
 * again.
 */
function withWorkletFileCheck<
  T extends {dependencies: readonly {name: string}[]},
>(stores: readonly CacheStore<T>[]): CacheStore<T>[] {
  return stores.map(store => ({
    name: store.name,
    async get(key) {
      const result = await store.get(key)
      if (
        result?.dependencies.some(
          dep =>
            dep.name.startsWith(WORKLET_FILE_PREFIX) &&
            !existsSync(
              path.join(
                workletsDir,
                dep.name.slice(WORKLET_FILE_PREFIX.length),
              ),
            ),
        )
      ) {
        return null
      }
      return result
    },
    set: (key, value) => store.set(key, value),
    clear: () => store.clear(),
  }))
}

let config = getSentryExpoConfig(import.meta.dirname, {
  // TODO: confirm this doesn't break anything when we switch to metro web
  includeWebReplay: false,
  includeWebFeedback: false,
  annotateReactComponents: {
    textComponentNames: ['Text', 'ButtonText'],
  },
  getDefaultConfig: (projectRoot, options) => {
    const config = getDefaultConfig(projectRoot, options)

    if (typeof process.env.RN_SRC_EXT === 'string') {
      // inject `.e2e.ts` and `.e2e.tsx` into the sourceExts when running tests)
      config.resolver.sourceExts.unshift(...process.env.RN_SRC_EXT.split(','))
    }

    config.resolver.assetExts = [...config.resolver.assetExts, 'woff2']

    if (config.resolver.resolveRequest) {
      throw Error('Update this override because it is conflicting now.')
    }

    if (process.env.BSKY_PROFILE) {
      // @ts-expect-error readonly property
      config.cacheVersion += ':PROFILE'
    }

    const resolver: CustomResolver = (context, moduleName, platform) => {
      if (
        platform === 'web' &&
        /^react-native-gesture-handler(\/|$)/.test(moduleName)
      ) {
        throw new Error(
          `react-native-gesture-handler must not be imported on web (requested from ${context.originModulePath})`,
        )
      }
      /*
       * react-native-webview has no web implementation (its fallback renders
       * "does not support this platform"), so swap in react-native-web-webview
       * to keep external media embeds working. Mirrors the old webpack alias.
       */
      if (platform === 'web' && moduleName === 'react-native-webview') {
        return context.resolveRequest(
          context,
          'react-native-web-webview',
          platform,
        )
      }
      if (
        process.env.BSKY_PROFILE &&
        moduleName.endsWith('ReactNativeRenderer-prod')
      ) {
        return context.resolveRequest(
          context,
          moduleName.replace('-prod', '-profiling'),
          platform,
        )
      }
      return context.resolveRequest(context, moduleName, platform)
    }

    // @ts-expect-error readonly property
    config.resolver.resolveRequest = resolver

    config.transformer.getTransformOptions = () =>
      Promise.resolve({
        transform: {
          experimentalImportSupport: true,
          inlineRequires: true as false, // ??? typescript why?
        },
      })

    return config as unknown as Record<string, unknown>
  },
})

config = getBundleModeMetroConfig(config)

if (!Array.isArray(config.cacheStores)) {
  throw Error('Update the worklets cache check: cacheStores is not an array.')
}
// @ts-expect-error readonly property
config.cacheStores = withWorkletFileCheck(config.cacheStores)

/*
 * The icon fonts are baked into the native binary, so a dev client built from
 * an older commit lacks the glyphs the current glyphmaps point at, and those
 * icons render blank. In development this serves the current fonts from the
 * dev server, and nano-icons registers them at runtime when the binary's font
 * doesn't match. When an SVG changes, it also rebuilds that font and its
 * glyphmap in `assets/nano-icons/`, like `pnpm icons:generate` would. It does
 * nothing in production, where the fonts must ship in the binary.
 */
config = withNanoIcons(config)

export default config
