type MediaBunnyModule = typeof import('mediabunny')

let promise: Promise<MediaBunnyModule> | undefined

/**
 * Lazily loads mediabunny into its own webpack chunk and caches the resulting
 * promise so the module is fetched at most once. If the import fails (e.g. a
 * transient chunk-load error), the cached promise is reset so a later call can
 * retry the load.
 */
export function loadMediaBunny(): Promise<MediaBunnyModule> {
  promise ??= import(/* webpackChunkName: "mediabunny" */ 'mediabunny').catch(
    e => {
      // reset so a later attempt can retry after a transient chunk-load failure
      promise = undefined
      throw e
    },
  )
  return promise
}
