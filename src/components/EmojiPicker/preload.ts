/**
 * Native no-op. Emoji data preloading is only needed on web where the picker
 * uses `emoji-mart`.
 */
export function useWebPreloadEmoji({}: {immediate?: boolean} = {}) {
  return () => Promise.resolve()
}
