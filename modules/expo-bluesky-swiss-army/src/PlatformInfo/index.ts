import {NotImplementedError} from '../NotImplemented'
import {type AudioCategory} from './types'

export function getIsReducedMotionEnabled(): boolean {
  throw new NotImplementedError()
}

/**
 * Tells Android that the first screen's content is on screen, which ends time
 * to full display in startup benchmarks and Play's startup vitals. Only the
 * first call per process does anything.
 * @platform android
 */
export function reportFullyDrawn(): void {
  throw new NotImplementedError()
}

/**
 * Set whether the app's audio should mix with other apps' audio. Will also resume background music playback when `false`
 * if it was previously playing.
 * @param mixWithOthers
 * @see https://developer.apple.com/documentation/avfaudio/avaudiosession/setactiveoptions/1616603-notifyothersondeactivation
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
