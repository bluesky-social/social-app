import {Platform} from 'react-native'

export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isNative = isIOS || isAndroid
export const isWeb = !isNative
export const isMobileWebMediaQuery = 'only screen and (max-width: 1300px)'
export const isMobileWeb =
  isWeb &&
  // @ts-ignore we know window exists -prf
  global.window.matchMedia(isMobileWebMediaQuery)?.matches
export const isIPhoneWeb = isWeb && /iPhone/.test(navigator.userAgent)

// ideally we'd use isLiquidGlassAvailable() from expo-glass-effect but checking iOS version is good enough for now
// for some reason Platform.OS === 'ios' AND Platform.Version is undefined in our CI unit tests -sfn
const iOSMajorVersion =
  Platform.OS === 'ios' && typeof Platform.Version === 'string'
    ? parseInt(Platform.Version.split('.')[0], 10)
    : 0
export const isLiquid = iOSMajorVersion >= 26
