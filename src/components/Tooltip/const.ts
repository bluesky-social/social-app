import {atoms as a, select, type Theme} from '#/alf'

/**
 * Visual variant for the tooltip surface. `default` is a neutral floating card;
 * `primary` is a subtle blue surface matching the `primary_subtle` button.
 */
export type TooltipColor = 'default' | 'primary'

export const BUBBLE_MAX_WIDTH = 240
export const ARROW_SIZE = 12
export const ARROW_HALF_SIZE = ARROW_SIZE / 2
export const MIN_EDGE_SPACE = a.px_lg.paddingLeft

/**
 * Resolves the surface (background/arrow fill) and text colors for a tooltip
 * variant. Kept here so the native and web implementations stay in sync.
 */
export function getTooltipStyle(t: Theme, color: TooltipColor) {
  if (color === 'primary') {
    return {
      surface: t.palette.primary_50,
      text: t.palette.primary_600,
      border: {
        color: t.atoms.border_contrast_low.borderColor,
        width: 1,
      },
    }
  }
  return {
    surface: select(t.name, {
      light: t.atoms.bg.backgroundColor,
      dark: t.atoms.bg_contrast_100.backgroundColor,
      dim: t.atoms.bg_contrast_100.backgroundColor,
    }),
    text: t.atoms.text.color,
    border: {
      color: undefined,
      width: 0,
    },
  }
}
