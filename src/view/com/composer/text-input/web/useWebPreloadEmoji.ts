import React from 'react'
import {init} from 'emoji-mart'

/**
 * Only load the emoji picker data once per page load.
 */
let loadRequested = false

/**
 * Preload the emoji picker data to prevent flash.
 * {@link https://github.com/missive/emoji-mart/blob/16978d04a766eec6455e2e8bb21cd8dc0b3c7436/README.md?plain=1#L194}
 */
export function useWebPreloadEmoji({immediate}: {immediate?: boolean} = {}) {
  const preload = React.useCallback(async () => {
    if (loadRequested) return
    loadRequested = true
    try {
      const data = (await import('./EmojiPickerData.json')).default
      init({data})
    } catch (e) {}
  }, [])
  if (immediate) preload()
  return preload
}
