import {NotImplementedError} from '../NotImplemented'
import {AudioCategory} from './types'

export function getIsReducedMotionEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function setAudioMixWithOthers(mixWithOthers: boolean): void {
  throw new NotImplementedError({mixWithOthers})
}

export function setAudioCategory(audioCategory: AudioCategory): void {
  throw new NotImplementedError({audioCategory})
}
