import {Platform} from 'react-native'
import {getLocales} from 'expo-localization'
import {dedupArray} from 'lib/functions'

/**
 * Attempt to ascertain if the agent is a touchscreen device.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
 */
function hasTouchscreen() {
  if ('maxTouchPoints' in navigator) {
    return navigator.maxTouchPoints > 0
  } else if ('msMaxTouchPoints' in navigator) {
    // @ts-ignore navigator should exist
    return navigator.msMaxTouchPoints > 0
  } else {
    const mQ = matchMedia?.('(pointer:coarse)')
    if (mQ?.media === '(pointer:coarse)') {
      return !!mQ.matches
    } else if ('orientation' in window) {
      return true // deprecated, but good fallback
    } else {
      // Only as a last resort, fall back to user agent sniffing
      // @ts-ignore navigator should exist
      const UA = navigator.userAgent
      return (
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
      )
    }
  }
}

export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isNative = isIOS || isAndroid
export const isWeb = !isNative
export const isMobileWebMediaQuery = 'only screen and (max-width: 1230px)'
export const isMobileWeb =
  isWeb &&
  // @ts-ignore we know window exists -prf
  global.window.matchMedia(isMobileWebMediaQuery)?.matches &&
  hasTouchscreen()
export const isDesktopWeb = isWeb && !isMobileWeb

export const deviceLocales = dedupArray(
  getLocales?.().map?.(locale => locale.languageCode),
)
