import {device, useStorage} from '#/storage'

export function useDemoMode() {
  const [demoMode = false, setDemoMode] = useStorage(device, ['demoMode'])

  return [demoMode, setDemoMode] as const
}
