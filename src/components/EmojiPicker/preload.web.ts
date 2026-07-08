import {useCallback} from 'react'

/**
 * Only load the emoji picker data once per page load.
 */
let loadRequested = false

/**
 * Preloads emoji-mart data so the picker renders instantly when opened.
 *
 * Returns a function that can be called manually to trigger preloading (e.g.
 * on hover). When `immediate` is `true`, preloading starts on mount.
 *
 * Data is only fetched once per page load — subsequent calls are no-ops.
 *
 * @see {@link https://github.com/missive/emoji-mart/blob/16978d04a766eec6455e2e8bb21cd8dc0b3c7436/README.md?plain=1#L194 | emoji-mart preloading docs}
 */
export function useWebPreloadEmoji({immediate}: {immediate?: boolean} = {}) {
  const preload = useCallback(async () => {
    if (loadRequested) return
    loadRequested = true
    try {
      const [{init}, {default: data}] = await Promise.all([
        import(/* webpackChunkName: "emoji-mart" */ 'emoji-mart'),
        import(/* webpackChunkName: "emoji-mart-data" */ '@emoji-mart/data'),
      ])
      init({data})
    } catch (e) {}
  }, [])
  if (immediate) preload()
  return preload
}
