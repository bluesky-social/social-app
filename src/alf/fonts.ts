import {useFonts as defaultUseFonts} from 'expo-font'

import {isNative, isWeb} from '#/platform/detection'
import {Device, device} from '#/storage'

const FAMILIES = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Liberation Sans", Helvetica, Arial, sans-serif`

const factor = 0.0625 // 1 - (15/16)
const fontScaleMultipliers: Record<Device['fontScale'], number> = {
  '-2': 1 - factor * 3,
  '-1': 1 - factor * 2,
  '0': 1 - factor * 1, // default
  '1': 1,
  '2': 1 + factor * 1,
}

export function computeFontScaleMultiplier(scale: Device['fontScale']) {
  return fontScaleMultipliers[scale]
}

export function getFontScale() {
  return device.get(['fontScale']) ?? '0'
}

export function setFontScale(fontScale: Device['fontScale']) {
  device.set(['fontScale'], fontScale)
}

export function getFontFamily() {
  return device.get(['fontFamily']) || 'theme'
}

export function setFontFamily(fontFamily: Device['fontFamily']) {
  device.set(['fontFamily'], fontFamily)
}

/*
 * Unused fonts are commented out, but the files are there if we need them.
 */
export function useFonts() {
  /**
   * For native, the `expo-font` config plugin embeds the fonts in the
   * application binary. But `expo-font` isn't supported on web, so we fall
   * back to async loading here.
   */
  if (isNative) return [true, null]
  return defaultUseFonts({
    // 'Inter-Thin': require('../../assets/fonts/inter/Inter-Thin.otf'),
    // 'Inter-ThinItalic': require('../../assets/fonts/inter/Inter-ThinItalic.otf'),
    // 'Inter-ExtraLight': require('../../assets/fonts/inter/Inter-ExtraLight.otf'),
    // 'Inter-ExtraLightItalic': require('../../assets/fonts/inter/Inter-ExtraLightItalic.otf'),
    // 'Inter-Light': require('../../assets/fonts/inter/Inter-Light.otf'),
    // 'Inter-LightItalic': require('../../assets/fonts/inter/Inter-LightItalic.otf'),
    'Inter-Regular': require('../../assets/fonts/inter/Inter-Regular.otf'),
    'Inter-Italic': require('../../assets/fonts/inter/Inter-Italic.otf'),
    'Inter-Medium': require('../../assets/fonts/inter/Inter-Medium.otf'),
    'Inter-MediumItalic': require('../../assets/fonts/inter/Inter-MediumItalic.otf'),
    'Inter-SemiBold': require('../../assets/fonts/inter/Inter-SemiBold.otf'),
    'Inter-SemiBoldItalic': require('../../assets/fonts/inter/Inter-SemiBoldItalic.otf'),
    'Inter-Bold': require('../../assets/fonts/inter/Inter-Bold.otf'),
    'Inter-BoldItalic': require('../../assets/fonts/inter/Inter-BoldItalic.otf'),
    'Inter-ExtraBold': require('../../assets/fonts/inter/Inter-ExtraBold.otf'),
    'Inter-ExtraBoldItalic': require('../../assets/fonts/inter/Inter-ExtraBoldItalic.otf'),
    'Inter-Black': require('../../assets/fonts/inter/Inter-Black.otf'),
    'Inter-BlackItalic': require('../../assets/fonts/inter/Inter-BlackItalic.otf'),
  })
}

/*
 * Unused fonts are commented out, but the files are there if we need them.
 */
export function applyFonts(
  style: Record<string, any>,
  fontFamily: 'system' | 'theme',
) {
  if (fontFamily === 'theme') {
    style.fontFamily =
      {
        // '100': 'Inter-Thin',
        // '200': 'Inter-ExtraLight',
        // '300': 'Inter-Light',
        '100': 'Inter-Regular',
        '200': 'Inter-Regular',
        '300': 'Inter-Regular',
        '400': 'Inter-Regular',
        '500': 'Inter-Medium',
        '600': 'Inter-SemiBold',
        '700': 'Inter-Bold',
        '800': 'Inter-ExtraBold',
        '900': 'Inter-Black',
      }[style.fontWeight as string] || 'Inter-Regular'

    if (style.fontStyle === 'italic') {
      if (style.fontFamily === 'Inter-Regular') {
        style.fontFamily = 'Inter-Italic'
      } else {
        style.fontFamily += 'Italic'
      }
    }

    // fallback families only supported on web
    if (isWeb) {
      style.fontFamily += `, ${FAMILIES}`
    }
  } else {
    // fallback families only supported on web
    if (isWeb) {
      style.fontFamily = style.fontFamily || FAMILIES
    }
  }

  /**
   * Disable contextual ligatures
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant}
   */
  style.fontVariant = ['no-contextual']
}
