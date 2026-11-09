import {requireOptionalNativeModule} from 'expo'

import {type NativeShareResult} from './types'

/*
 * Optional so JS shipped over the air to a binary built before this module
 * existed can fall back to React Native's Share. The methods added later are
 * optional for the same reason.
 */
const NativeModule = requireOptionalNativeModule<{
  shareText(text: string): Promise<NativeShareResult>
  getInstalledPackages?(packages: string[]): Promise<string[]>
  shareTextToPackage?(text: string, packageName: string): Promise<void>
}>('ExpoBlueskyShare')

export const isAvailable = !!NativeModule

/**
 * Opens the system share sheet and resolves once the user picks an app or
 * returns without picking one.
 */
export function shareText(text: string): Promise<NativeShareResult> {
  if (!NativeModule) {
    throw new Error('ExpoBlueskyShare is not available')
  }
  return NativeModule.shareText(text)
}

/**
 * Returns the given packages that are installed. Packages must also be
 * declared in the manifest's `<queries>`, or they always report as missing.
 * Returns `null` on binaries built without this method.
 */
export async function getInstalledPackages(
  packages: string[],
): Promise<string[] | null> {
  if (!NativeModule?.getInstalledPackages) return null
  return await NativeModule.getInstalledPackages(packages)
}

/**
 * Sends text straight to one app's share screen, skipping the chooser.
 * Rejects if the app isn't installed or can't receive text.
 */
export function shareTextToPackage(
  text: string,
  packageName: string,
): Promise<void> {
  if (!NativeModule?.shareTextToPackage) {
    throw new Error('ExpoBlueskyShare.shareTextToPackage is not available')
  }
  return NativeModule.shareTextToPackage(text, packageName)
}
