import {device, useStorage} from '#/storage'

export function useDevMode() {
  const [devMode = false, setDevMode] = useStorage(device, ['devMode'])

  return [devMode, setDevMode] as const
}

let cachedIsDevMode: boolean | undefined
/**
 * Does not update when toggling dev mode on or off. This util simply retrieves
 * the value and caches in memory indefinitely. So after an update, you'll need
 * to reload the app so it can pull a fresh value from storage.
 */
export function isDevMode() {
  if (__DEV__) return true
  if (cachedIsDevMode === undefined) {
    cachedIsDevMode = device.get(['devMode']) ?? false
  }
  return cachedIsDevMode
}
