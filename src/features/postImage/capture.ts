import {PixelRatio, Platform, type View} from 'react-native'
import {captureRef, releaseCapture} from 'react-native-view-shot'

/**
 * Renders a view to a PNG in the app's cache and returns its `file://` URI.
 * `width` and `height` are in pixels, so a small preview can export at full
 * size.
 */
export async function captureView(
  view: React.RefObject<React.ComponentRef<typeof View> | null>,
  {width, height}: {width: number; height: number},
): Promise<string> {
  // iOS takes the size in points and renders at the screen's scale
  const scale = Platform.OS === 'ios' ? PixelRatio.get() : 1
  const uri = await captureRef(view, {
    format: 'png',
    result: 'tmpfile',
    width: width / scale,
    height: height / scale,
  })
  return uri.startsWith('file://') ? uri : `file://${uri}`
}

/**
 * Deletes an image made by `captureView`. Android doesn't clear the app's
 * cache by itself, and each one is a full-size PNG. Not for images handed to
 * another app, which may still be reading them.
 */
export function releaseCapturedView(uri: string) {
  // iOS only deletes a plain path inside its temp folder, not a file:// URI
  releaseCapture(uri.replace(/^file:\/\//, ''))
}
