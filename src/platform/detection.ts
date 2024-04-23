import {Platform} from 'react-native'
import {getLocales} from 'expo-localization'

import {dedupArray} from 'lib/functions'

export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isNative = isIOS || isAndroid
export const devicePlatform = isIOS ? 'ios' : isAndroid ? 'android' : 'web'
export const isWeb = !isNative
export const isMobileWebMediaQuery = 'only screen and (max-width: 1300px)'
export const isMobileWeb =
  isWeb &&
  // @ts-ignore we know window exists -prf
  global.window.matchMedia(isMobileWebMediaQuery)?.matches

export const deviceLocales = dedupArray(
  getLocales?.()
    .map?.(locale => locale.languageCode)
    .filter(code => typeof code === 'string'),
) as string[]

export const prefersReducedMotion =
  isWeb &&
  // @ts-ignore we know window exists -prf
  !global.window.matchMedia('(prefers-reduced-motion: no-preference)')?.matches
