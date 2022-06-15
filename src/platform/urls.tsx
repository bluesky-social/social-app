import {isIOS, isAndroid} from './detection'

export function makeAppUrl(path = '') {
  if (isIOS) {
    return `pubsqapp://${path}`
  } else if (isAndroid) {
    return `pubsq://app${path}`
  } else {
    // @ts-ignore window exists -prf
    return `${window.location.origin}${path}`
  }
}
