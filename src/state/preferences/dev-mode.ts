import {device, useStorage} from '#/storage'

export function useDevModeEnabled() {
  const [devModeEnabled = false, setDevModeEnabled] = useStorage(device, [
    'devMode',
  ])

  return [devModeEnabled, setDevModeEnabled] as const
}
