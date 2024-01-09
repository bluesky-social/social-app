import * as tokens from '#/alf/tokens'
import type {Mutable} from '#/alf/types'

export type ThemeName = 'light' | 'dark'
export type ReadonlyTheme = typeof light
export type Theme = Mutable<ReadonlyTheme>

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
      color: tokens.color.gray_1000,
    },
    text_contrast_700: {
      color: tokens.color.gray_700,
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
      backgroundColor: tokens.color.green_500,
    },
    bg_negative: {
      backgroundColor: tokens.color.red_400,
    },
    border: {
      borderColor: tokens.color.gray_200,
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
      backgroundColor: tokens.color.green_400,
    },
    bg_negative: {
      backgroundColor: tokens.color.red_400,
    },
    border: {
      borderColor: tokens.color.gray_800,
    },
    border_contrast_500: {
      borderColor: tokens.color.gray_500,
    },
  },
}
