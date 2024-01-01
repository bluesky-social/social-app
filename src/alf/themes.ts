import * as tokens from '#/alf/tokens'

export type ThemeName = 'light' | 'dark'
export type Theme = typeof light

export type Palette = {
  primary: string
  positive: string
  negative: string
}

export const lightPalette: Palette = {
  primary: tokens.color.blue_500,
  positive: tokens.color.green_500,
  negative: tokens.color.red_500,
} as const

export const darkPalette: Palette = {
  primary: tokens.color.blue_500,
  positive: tokens.color.green_400,
  negative: tokens.color.red_400,
} as const

export const light = {
  palette: lightPalette,
  atoms: {
    text: {
      color: tokens.color.gray_950,
    },
    text_contrast_700: {
      color: tokens.color.gray_600,
    },
    text_contrast_500: {
      color: tokens.color.gray_400,
    },
    text_inverted: {
      color: tokens.color.white,
    },
    bg: {
      backgroundColor: tokens.color.white,
    },
    bg_contrast_100: {
      backgroundColor: tokens.color.gray_50,
    },
    bg_contrast_200: {
      backgroundColor: tokens.color.gray_100,
    },
    bg_contrast_300: {
      backgroundColor: tokens.color.gray_200,
    },
    border: {
      borderColor: tokens.color.gray_100,
    },
    border_contrast_500: {
      borderColor: tokens.color.gray_400,
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
    text_contrast_500: {
      color: tokens.color.gray_500,
    },
    text_inverted: {
      color: tokens.color.gray_950,
    },
    bg: {
      backgroundColor: tokens.color.gray_950,
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
    border: {
      borderColor: tokens.color.gray_800,
    },
    border_contrast_500: {
      borderColor: tokens.color.gray_500,
    },
  },
}
