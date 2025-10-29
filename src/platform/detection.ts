import {Platform} from 'react-native'
import {isLiquidGlassAvailable} from 'expo-glass-effect'

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

export const isLiquid = isIOS && isLiquidGlassAvailable()
