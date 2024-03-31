import {isAndroid, isIOS, isNative, isWeb} from 'platform/detection'

export function web(value: any) {
  if (isWeb) {
    return value
  }
}

export function ios(value: any) {
  if (isIOS) {
    return value
  }
}

export function android(value: any) {
  if (isAndroid) {
    return value
  }
}

export function native(value: any) {
  if (isNative) {
    return value
  }
}
