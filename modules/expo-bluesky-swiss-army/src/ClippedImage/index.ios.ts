import {requireNativeModule} from 'expo-modules-core'

import {type ClipImageOptions} from './types'

const NativeModule = requireNativeModule<{
  clipImageAsync(
    url: string,
    size: number,
    cornerRadius: number,
    scale: number,
  ): Promise<string>
}>('ExpoBlueskyClippedImage')

export function clipImageAsync({
  url,
  size,
  cornerRadius,
  scale,
}: ClipImageOptions): Promise<string> {
  return NativeModule.clipImageAsync(url, size, cornerRadius, scale)
}
