import {NotImplementedError} from '../NotImplemented'

export function getIsReducedMotionEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function setAudioMixWithOthers(mixWithOthers: boolean): void {
  throw new NotImplementedError({mixWithOthers})
}
