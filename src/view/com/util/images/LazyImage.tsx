import {Image, type ImageProps} from 'expo-image'

export type LazyImageProps = ImageProps & {
  onLoad?: (e: {source: {width: number; height: number}}) => void
}

/**
 * Native implementation - just uses expo-image directly.
 * The web version adds loading="lazy" for browser-native lazy loading.
 */
export function LazyImage(props: LazyImageProps) {
  return <Image accessibilityIgnoresInvertColors {...props} />
}
