import {Linking} from 'react-native'

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
