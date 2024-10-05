import {useFonts} from 'expo-font'

import {isWeb} from '#/platform/detection'
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
export function applyFonts(
  style: Record<string, any>,
  fontFamily: 'system' | 'theme',
) {
  if (fontFamily === 'theme') {
    style.fontFamily = 'InterVariable'

    if (style.fontStyle === 'italic') {
      style.fontFamily += 'Italic'
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

/*
 * IMPORTANT: This is unused. Expo statically extracts these fonts.
 *
 * All used fonts MUST be configured here. Unused fonts can be commented out.
 *
 * This is used for both web fonts and native fonts.
 */
export function DO_NOT_USE() {
  return useFonts({
    InterVariable: require('../../assets/fonts/inter/InterVariable.ttf'),
    'InterVariable-Italic': require('../../assets/fonts/inter/InterVariable-Italic.ttf'),
  })
}
