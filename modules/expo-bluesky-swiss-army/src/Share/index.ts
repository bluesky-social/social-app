import {NotImplementedError} from '../NotImplemented'
import {type NativeShareResult} from './types'

export const isAvailable = false

/**
 * Android only. iOS gets the chosen app from React Native's Share.
 */
export function shareText(text: string): Promise<NativeShareResult> {
  throw new NotImplementedError({text})
}

/**
 * Android only. iOS checks URL schemes with `Linking.canOpenURL` instead.
 */
export function getInstalledPackages(_packages: string[]): string[] | null {
  return null
}

/**
 * Android only. iOS has no way to send text to one specific app.
 */
export function canShareTextToPackage(): boolean {
  return false
}

/**
 * Android only.
 */
export function shareTextToPackage(
  text: string,
  packageName: string,
): Promise<void> {
  throw new NotImplementedError({text, packageName})
}
