import {NotImplementedError} from '../NotImplemented'

export function getIsReducedMotionEnabled(): boolean {
  throw new NotImplementedError()
}

export function setAudioMixWithOthers(mixWithOthers: boolean): void {
  throw new NotImplementedError({mixWithOthers})
}
