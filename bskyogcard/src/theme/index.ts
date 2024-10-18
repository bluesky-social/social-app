import {colors} from './colors.js'
import * as tokens from './tokens.js'

export {atoms} from './atoms.js'
export * as tokens from './tokens.js'

const fontFamily = 'Inter'

export const theme = {
  palette: colors,
  atoms: {
    text: {
      color: colors.black,
      fontFamily,
    },
    text_contrast_low: {
      color: colors.contrast_500,
      fontFamily,
    },
    text_contrast_medium: {
      color: colors.contrast_700,
      fontFamily,
    },
    text_contrast_high: {
      color: colors.contrast_900,
      fontFamily,
    },
    text_inverted: {
      color: colors.white,
      fontFamily,
    },
    bg: {
      backgroundColor: colors.white,
    },
    bg_contrast_25: {
      backgroundColor: colors.contrast_25,
    },
    bg_contrast_50: {
      backgroundColor: colors.contrast_50,
    },
    bg_contrast_100: {
      backgroundColor: colors.contrast_100,
    },
    bg_contrast_200: {
      backgroundColor: colors.contrast_200,
    },
    bg_contrast_300: {
      backgroundColor: colors.contrast_300,
    },
    bg_contrast_400: {
      backgroundColor: colors.contrast_400,
    },
    bg_contrast_500: {
      backgroundColor: colors.contrast_500,
    },
    bg_contrast_600: {
      backgroundColor: colors.contrast_600,
    },
    bg_contrast_700: {
      backgroundColor: colors.contrast_700,
    },
    bg_contrast_800: {
      backgroundColor: colors.contrast_800,
    },
    bg_contrast_900: {
      backgroundColor: colors.contrast_900,
    },
    bg_contrast_950: {
      backgroundColor: colors.contrast_950,
    },
    bg_contrast_975: {
      backgroundColor: colors.contrast_975,
    },
    bg_primary_500: {
      backgroundColor: colors.primary_500,
    },
    border_contrast_low: {
      borderColor: colors.contrast_100,
    },
    border_contrast_medium: {
      borderColor: colors.contrast_200,
    },
    border_contrast_high: {
      borderColor: colors.contrast_300,
    },
  },
}

export function style(styleObjects: Record<string, any>[]) {
  return Object.assign({}, ...styleObjects.filter(Boolean))
}

export function gradient(color: keyof typeof tokens.gradients) {
  const {values} = tokens.gradients[color]
  return values
    .map(([pos, color]) => {
      return `${color} ${pos * 100}%`
    })
    .join(', ')
}
