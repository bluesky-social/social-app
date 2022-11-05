import {Linking} from 'react-native'
import {isIOS, isAndroid, isNative, isWeb} from './detection'

export function makeAppUrl(path = '') {
  if (isIOS) {
    return `bskyapp://${path}`
  } else if (isAndroid) {
    return `bsky://app${path}`
  } else {
    // @ts-ignore window exists -prf
    return `${window.location.origin}${path}`
  }
}

export function extractHashFragment(url: string): string {
  return url.split('#')[1] || ''
}

export async function getInitialURL(): Promise<string> {
  if (isNative) {
    const url = await Linking.getInitialURL()
    if (url) {
      return url
    }
    return makeAppUrl()
  } else {
    // @ts-ignore window exists -prf
    return window.location.toString()
  }
}

export function clearHash() {
  if (isWeb) {
    // @ts-ignore window exists -prf
    window.location.hash = ''
  }
}
