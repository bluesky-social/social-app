import {Platform} from 'react-native'

export function web(value: any) {
  return Platform.select({
    web: value,
  })
}

export function ios(value: any) {
  return Platform.select({
    ios: value,
  })
}

export function android(value: any) {
  return Platform.select({
    android: value,
  })
}

export function native(value: any) {
  return Platform.select({
    native: value,
  })
}
