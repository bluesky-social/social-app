import {type View} from 'react-native'

/** Native only. Sharing a post as an image isn't offered on web. */
export function captureView(
  _view: React.RefObject<React.ComponentRef<typeof View> | null>,
  _size: {width: number; height: number},
): Promise<string> {
  return Promise.reject(new Error('captureView is native only'))
}

/** Native only. */
export function releaseCapturedView(_uri: string) {}
