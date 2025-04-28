import {device, useStorage} from '#/storage'

export function useDevMode() {
  const [devMode = false, setDevMode] = useStorage(device, ['devMode'])

  return [devMode, setDevMode] as const
}
