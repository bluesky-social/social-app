import {requireOptionalNativeModule} from 'expo-modules-core'

/** Older binaries must keep their browser fallback when this ships over the air. */
const NativeModule = requireOptionalNativeModule<{
  tryOpen(url: string): Promise<boolean>
}>('ExpoBlueskyAppLink')

/** Opens a web URL only if the OS can hand it directly to a non-browser app. */
export async function tryOpen(url: string): Promise<boolean> {
  return NativeModule?.tryOpen(url) ?? false
}
