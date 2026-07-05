import {device, useStorage} from '#/storage'

export function useImageLayoutNudged() {
  const [imageLayoutNudged = false, setImageLayoutNudged] = useStorage(device, [
    'imageLayoutNudged',
  ])

  return [imageLayoutNudged, setImageLayoutNudged] as const
}
