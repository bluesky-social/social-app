import * as tokens from '#/alf/tokens'

export type ThemeName = 'light' | 'dark'
export type Theme = typeof light

export type Palette = {
  primary: string
  positive: string
  negative: string
}

export const lightPalette: Palette = {
  primary: tokens.color.blue_600,
  positive: tokens.color.green_600,
  negative: tokens.color.red_600,
} as const

export const darkPalette: Palette = {
  primary: tokens.color.blue_600,
  positive: tokens.color.green_600,
  negative: tokens.color.red_600,
} as const

export const light = {
  palette: lightPalette,
  atoms: {
    text: {
      color: tokens.color.gray_1000,
    },
    text_contrast_700: {
      color: tokens.color.gray_700,
    },
    text_contrast_600: {
      color: tokens.color.gray_600,
    },
    text_contrast_500: {
      color: tokens.color.gray_500,
    },
    text_inverted: {
      color: tokens.color.white,
    },
    bg: {
      backgroundColor: tokens.color.white,
    },
    bg_contrast_100: {
      backgroundColor: tokens.color.gray_100,
    },
    bg_contrast_200: {
      backgroundColor: tokens.color.gray_200,
    },
    bg_contrast_300: {
      backgroundColor: tokens.color.gray_300,
    },
    bg_positive: {
      backgroundColor: lightPalette.positive,
    },
    bg_negative: {
      backgroundColor: lightPalette.negative,
    },
    border: {
      borderColor: tokens.color.gray_300,
    },
    border_contrast_500: {
      borderColor: tokens.color.gray_500,
    },
  },
}

export const dark: Theme = {
  palette: darkPalette,
  atoms: {
    text: {
      color: tokens.color.white,
    },
    text_contrast_700: {
      color: tokens.color.gray_300,
    },
    text_contrast_600: {
      color: tokens.color.gray_400,
    },
    text_contrast_500: {
      color: tokens.color.gray_500,
    },
    text_inverted: {
      color: tokens.color.gray_1000,
    },
    bg: {
      backgroundColor: tokens.color.gray_1000,
    },
    bg_contrast_100: {
      backgroundColor: tokens.color.gray_900,
    },
    bg_contrast_200: {
      backgroundColor: tokens.color.gray_800,
    },
    bg_contrast_300: {
      backgroundColor: tokens.color.gray_700,
    },
    bg_positive: {
      backgroundColor: darkPalette.positive,
    },
    bg_negative: {
      backgroundColor: darkPalette.negative,
    },
    border: {
      borderColor: tokens.color.gray_800,
    },
    border_contrast_500: {
      borderColor: tokens.color.gray_500,
    },
  },
}
