import {NotImplementedError} from '../NotImplemented'
import {type InstagramStoryOptions} from './types'

/** Native only. */
export function isAvailable(): Promise<boolean> {
  return Promise.resolve(false)
}

/** Native only. */
export function share(options: InstagramStoryOptions): Promise<void> {
  return Promise.reject(new NotImplementedError({options}))
}

export type {InstagramStoryOptions}
