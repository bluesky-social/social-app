import {NotImplementedError} from '../NotImplemented'
import {type NativeShareResult} from './types'

export const isAvailable = false

/**
 * Android only. iOS gets the chosen app from React Native's Share.
 */
export function shareText(text: string): Promise<NativeShareResult> {
  throw new NotImplementedError({text})
}
