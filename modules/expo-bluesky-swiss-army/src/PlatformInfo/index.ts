import {NotImplementedError} from '../NotImplemented'
import {AudioCategory} from './types'

export function getIsReducedMotionEnabled(): boolean {
  throw new NotImplementedError()
}

/**
 * Set whether the app's audio should mix with other apps' audio.
 * @param mixWithOthers
 */
export function setAudioMixWithOthers(mixWithOthers: boolean): void {
  throw new NotImplementedError({mixWithOthers})
}

/**
 * Set the audio category for the app.
 * @param audioCategory
 * @platform ios
 */
export function setAudioCategory(audioCategory: AudioCategory): void {
  throw new NotImplementedError({audioCategory})
}
