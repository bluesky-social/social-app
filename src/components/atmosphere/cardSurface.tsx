import {createContext, useContext} from 'react'

import {useTheme} from '#/alf'
import {hexToRgb, rgbToHex} from '#/alf/util/colorGeneration'

/**
 * How Atmosphere cards are framed: `outline` is a border on the page's color;
 * `filled` is a light gray fill with no border; `inverse` is the page's color
 * with no border, for cards set on a `filled` band.
 */
export type CardSurface = 'outline' | 'filled' | 'inverse'

const Context = createContext<CardSurface>('outline')
Context.displayName = 'AtmosphereCardSurfaceContext'

/** Sets how the Atmosphere cards inside are framed. */
export const CardSurfaceProvider = Context.Provider

/**
 * The frame for an Atmosphere card under the nearest `CardSurfaceProvider`:
 * the style to apply, and the color behind its content (for avatar rings).
 * Pass `interacted` for hover and focus states.
 */
export function useCardSurface({interacted = false} = {}) {
  const t = useTheme()
  const surface = useContext(Context)
  const isLight = t.name === 'light'

  /** The usual divider color, for wherever there's no fill to match. */
  const lineColor = t.atoms.border_contrast_low.borderColor
  /** Lines between feed items: heavier inside a filled or inverse surface. */
  const dividerWidth = surface === 'outline' ? 1 : 2

  if (surface === 'inverse') {
    const shown = interacted
      ? t.atoms.bg_contrast_25.backgroundColor
      : t.atoms.bg.backgroundColor
    return {
      fill: shown,
      divider: lineColor,
      dividerWidth,
      style: [{borderWidth: 0}, {backgroundColor: shown}],
    }
  }

  if (surface === 'filled') {
    /*
     * Light mode sits halfway between gray-25 and gray-50. Dark and dim go
     * halfway between the page and their lightest gray, since a stronger step
     * reads as a hover state there. Mixed as opaque colors so avatar rings can
     * match.
     */
    const fill = isLight
      ? (mix(t.palette.contrast_25, t.palette.contrast_50) ??
        t.palette.contrast_50)
      : (mix(
          t.atoms.bg.backgroundColor,
          t.atoms.bg_contrast_25.backgroundColor,
        ) ?? t.atoms.bg_contrast_25.backgroundColor)
    const hoverFill = isLight
      ? t.palette.contrast_100
      : t.atoms.bg_contrast_25.backgroundColor
    const shown = interacted ? hoverFill : fill
    return {
      fill: shown,
      /** Lines between feed items, in the cards' fill. */
      divider: fill,
      dividerWidth,
      style: [{borderWidth: 0}, {backgroundColor: shown}],
    }
  }

  return {
    fill: interacted
      ? t.atoms.bg_contrast_25.backgroundColor
      : t.atoms.bg.backgroundColor,
    divider: lineColor,
    dividerWidth,
    style: [
      {borderWidth: 1},
      interacted
        ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_high]
        : [t.atoms.border_contrast_low],
    ],
  }
}

/**
 * The fill for pill buttons on Atmosphere cards, like recommend and share. In
 * light mode it's between gray-50 and gray-100, so the pills stand out
 * clearly from the cards.
 */
export function useCardPillColor() {
  const t = useTheme()
  return t.name === 'light'
    ? (mix(t.palette.contrast_50, t.palette.contrast_100) ??
        t.palette.contrast_100)
    : t.atoms.bg_contrast_50.backgroundColor
}

/** The color halfway between two hex colors, or undefined if either isn't. */
function mix(a: string, b: string) {
  const from = hexToRgb(a)
  const to = hexToRgb(b)
  if (!from || !to) return undefined
  return rgbToHex(
    Math.round((from.r + to.r) / 2),
    Math.round((from.g + to.g) / 2),
    Math.round((from.b + to.b) / 2),
  )
}
