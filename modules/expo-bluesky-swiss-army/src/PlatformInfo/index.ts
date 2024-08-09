import {NotImplementedError} from '../NotImplemented'
import {AudioCategory} from './types'

export function getIsReducedMotionEnabled(): boolean {
  throw new NotImplementedError()
}

/**
 * Set whether the app's audio should mix with other apps' audio. Will also resume background music playback when `false`
 * if it was previously playing.
 * @param mixWithOthers
 */
export function setAudioActive(active: boolean): void {
  throw new NotImplementedError({active})
}

/**
 * Set the audio category for the app.
 * @param audioCategory
 * @platform ios
 */
export function setAudioCategory(audioCategory: AudioCategory): void {
  throw new NotImplementedError({audioCategory})
}
