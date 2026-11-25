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
export function getInstalledPackages(
  _packages: string[],
): Promise<string[] | null> {
  return Promise.resolve(null)
}

/**
 * Android only. iOS can't send text straight to another app's share screen,
 * so on iOS those apps use a share link or copy-and-open instead.
 */
export function shareTextToPackage(
  text: string,
  packageName: string,
): Promise<void> {
  throw new NotImplementedError({text, packageName})
}
