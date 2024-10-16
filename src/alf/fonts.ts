import {TextStyle} from 'react-native'
import {useFonts} from 'expo-font'

import {isAndroid,isWeb} from '#/platform/detection'
import {Device, device} from '#/storage'

const WEB_FONT_FAMILIES = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`

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
export function applyFonts(style: TextStyle, fontFamily: 'system' | 'theme') {
  if (fontFamily === 'theme') {
    if (isAndroid) {
      style.fontFamily =
        {
          400: 'Inter-Regular',
          500: 'Inter-Regular',
          600: 'Inter-SemiBold',
          700: 'Inter-SemiBold',
          800: 'Inter-ExtraBold',
          900: 'Inter-ExtraBold',
        }[String(style.fontWeight || '400')] || 'Inter-Regular'

      if (style.fontStyle === 'italic') {
        if (style.fontFamily === 'Inter-Regular') {
          style.fontFamily = 'Inter-Italic'
        } else {
          style.fontFamily += 'Italic'
        }
      }

      /*
       * These are not supported on Android and actually break the styling.
       */
      delete style.fontWeight
      delete style.fontStyle
    } else {
      style.fontFamily = 'InterVariable'

      if (style.fontStyle === 'italic') {
        style.fontFamily += 'Italic'
      }
    }

    if (isWeb) {
      // fallback families only supported on web
      style.fontFamily += `, ${WEB_FONT_FAMILIES}`
    }

    /**
     * Disable contextual alternates in Inter
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant}
     */
    style.fontVariant = (style.fontVariant || []).concat('no-contextual')
  } else {
    // fallback families only supported on web
    if (isWeb) {
      style.fontFamily = style.fontFamily || WEB_FONT_FAMILIES
    }

    /**
     * Overridden to previous spacing for the `system` font option.
     * https://github.com/bluesky-social/social-app/commit/2419096e2409008b7d71fd6b8f8d0dd5b016e267
     */
    style.letterSpacing = 0.25
  }
}

/*
 * IMPORTANT: This is unused. Expo statically extracts these fonts.
 *
 * All used fonts MUST be configured here. Unused fonts can be commented out.
 *
 * This is used for both web fonts and native fonts.
 */
export function DO_NOT_USE() {
  return useFonts(
    isAndroid
      ? {
          'Inter-Regular': require('../../assets/fonts/inter/Inter-Regular.otf'),
          'Inter-Italic': require('../../assets/fonts/inter/Inter-Italic.otf'),
          'Inter-Bold': require('../../assets/fonts/inter/Inter-SemiBold.otf'),
          'Inter-BoldItalic': require('../../assets/fonts/inter/Inter-SemiBoldItalic.otf'),
          'Inter-Black': require('../../assets/fonts/inter/Inter-ExtraBold.otf'),
          'Inter-BlackItalic': require('../../assets/fonts/inter/Inter-ExtraBoldItalic.otf'),
        }
      : {
          InterVariable: require('../../assets/fonts/inter/InterVariable.ttf'),
          'InterVariable-Italic': require('../../assets/fonts/inter/InterVariable-Italic.ttf'),
        },
  )
}
