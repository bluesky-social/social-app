import {processColor} from 'react-native'
import {requireNativeModule} from 'expo-modules-core'

import {type ClipImageOptions} from './types'

const NativeModule = requireNativeModule<{
  clipImageAsync(
    url: string,
    size: number,
    cornerRadius: number,
    scale: number,
    borderColor: ReturnType<typeof processColor> | null,
    borderWidth: number,
  ): Promise<string>
}>('ExpoBlueskyClippedImage')

export function clipImageAsync({
  url,
  size,
  cornerRadius,
  scale,
  borderColor,
  borderWidth = 0,
}: ClipImageOptions): Promise<string> {
  return NativeModule.clipImageAsync(
    url,
    size,
    cornerRadius,
    scale,
    borderColor ? processColor(borderColor) : null,
    borderWidth,
  )
}
