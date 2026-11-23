import {requireNativeModule} from 'expo-modules-core'

export type CompressedImage = {
  /** `file://` URI of the JPEG, in the app's cache directory. */
  uri: string
  width: number
  height: number
  /** File size in bytes. */
  size: number
  /** JPEG quality it was encoded at, from 25 to 100. */
  quality: number
}

const NativeModule = requireNativeModule<{
  compressAsync(
    uri: string,
    options: {maxDimension: number; maxBytes: number},
  ): Promise<CompressedImage>
}>('ExpoBlueskyImageCompressor')

/**
 * Re-encodes an image as a JPEG no larger than `maxDimension` on its long side
 * and `maxBytes` in size, at close to the highest quality that fits. Decodes
 * the image once and tries each quality in memory. See the README for details.
 *
 * Accepts `file://` URIs, absolute paths and base64 `data:` URIs, plus
 * `content://` URIs on Android.
 */
export function compressImage(
  uri: string,
  options: {maxDimension: number; maxBytes: number},
): Promise<CompressedImage> {
  return NativeModule.compressAsync(uri, options)
}
