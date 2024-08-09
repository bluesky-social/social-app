import {NotImplementedError} from '../NotImplemented'
import {AudioCategory} from './types'

export function getIsReducedMotionEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function setAudioActive(active: boolean): void {
  throw new NotImplementedError({active})
}

export function setAudioCategory(audioCategory: AudioCategory): void {
  throw new NotImplementedError({audioCategory})
}
