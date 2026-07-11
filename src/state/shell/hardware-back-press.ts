type HardwareBackPressFallback = () => boolean

let fallback: HardwareBackPressFallback | undefined

/**
 * Registers the fallback handler for the Android hardware back press. The
 * shell's back handler runs it only after any active overlays (lightbox,
 * dialogs, composer, drawer) have been given the chance to close, so the
 * fallback never steals the press from them. Return true from the fallback to
 * consume the press, false to allow the system default behavior.
 *
 * Returns a function that unregisters the fallback (if it is still the
 * registered one).
 */
export function setHardwareBackPressFallback(
  fn: HardwareBackPressFallback,
): () => void {
  fallback = fn
  return () => {
    if (fallback === fn) {
      fallback = undefined
    }
  }
}

/**
 * Runs the registered fallback, returning true if it consumed the back press.
 */
export function runHardwareBackPressFallback(): boolean {
  return fallback?.() ?? false
}
