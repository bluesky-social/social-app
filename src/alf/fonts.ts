import {type FontVariant, type TextStyle} from 'react-native'

import {IS_ANDROID, IS_WEB} from '#/env'
import {type Device, device} from '#/storage'

const WEB_FONT_FAMILIES = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`

/**
 * Monospace family for rendered code (code blocks, inline code, fenced blocks).
 * A full cross-platform stack on web; a single system family on native, since
 * RN `fontFamily` does not accept CSS-style fallback lists. `applyFonts`
 * preserves this verbatim (see the guard there) so the Inter UI font does not
 * clobber it and leave code in a proportional typeface.
 */
export const MONOSPACE_FONT_FAMILY = IS_WEB
  ? 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", "Roboto Mono", monospace'
  : IS_ANDROID
    ? 'monospace'
    : 'Menlo'

const factor = 0.0625 // 1 - (15/16)
const fontScaleMultipliers: Record<Device['fontScale'], number> = {
  '-2': 1 - factor * 1, // unused
  '-1': 1 - factor * 1,
  '0': 1, // default
  '1': 1 + factor * 1,
  '2': 1 + factor * 1, // unused
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
  // Preserve an explicitly requested monospace family (code blocks set this).
  // The `theme` branch below would otherwise overwrite fontFamily with the
  // Inter UI font, leaving code rendered in a proportional typeface.
  if (style.fontFamily === MONOSPACE_FONT_FAMILY) return

  if (fontFamily === 'theme') {
    if (IS_ANDROID) {
      style.fontFamily =
        {
          400: 'Inter-Regular',
          500: 'Inter-Medium',
          600: 'Inter-SemiBold',
          700: 'Inter-Bold',
          800: 'Inter-Bold',
          900: 'Inter-Bold',
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

    if (IS_WEB) {
      // fallback families only supported on web
      style.fontFamily += `, ${WEB_FONT_FAMILIES}`
    }

    /**
     * Disable contextual alternates and emoji overrides in Inter
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant}
     */
    if (IS_WEB) {
      style.fontVariant = (style.fontVariant || []).concat(
        'no-contextual',
        'unicode' as FontVariant, // web supports 'unicode' as a valid value for fontVariant
      )
    } else {
      style.fontVariant = (style.fontVariant || []).concat('no-contextual')
    }
  } else {
    // fallback families only supported on web
    if (IS_WEB) {
      style.fontFamily = style.fontFamily || WEB_FONT_FAMILIES
    }

    /**
     * Overridden to previous spacing for the `system` font option.
     * https://github.com/bluesky-social/social-app/commit/2419096e2409008b7d71fd6b8f8d0dd5b016e267
     */
    style.letterSpacing = 0.25
  }
}

/**
 * Here only for bundling purposes, not actually used.
 */
export {DO_NOT_USE} from '#/alf/util/unusedUseFonts'
