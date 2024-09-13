import {device} from '#/storage'

export function set(fontScale: number) {
  device.set(['fontScale'], fontScale)
}

export function get() {
  const fontScale = device.get(['fontScale']) || 1
  return fontScale
}
