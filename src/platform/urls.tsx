import {GestureResponderEvent, Linking} from 'react-native'

import {isNative, isWeb} from './detection'

export async function getInitialURL(): Promise<string | undefined> {
  if (isNative) {
    const url = await Linking.getInitialURL()
    if (url) {
      return url
    }
    return undefined
  } else {
    // @ts-ignore window exists -prf
    if (window.location.pathname !== '/') {
      return window.location.pathname
    }
    return undefined
  }
}

export function clearHash() {
  if (isWeb) {
    // @ts-ignore window exists -prf
    window.location.hash = ''
  }
}

export function shouldClickOpenNewTab(e: GestureResponderEvent) {
  /**
   * A `GestureResponderEvent`, but cast to `any` to avoid using a bunch
   * of @ts-ignore below.
   */
  const event = e as any
  const isMiddleClick = isWeb && event.button === 1
  const isMetaKey =
    isWeb && (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
  return isMetaKey || isMiddleClick
}
