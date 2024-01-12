import * as tokens from '#/alf/tokens'
import type {Mutable} from '#/alf/types'

export type ThemeName = 'light' | 'dim' | 'dark'
export type ReadonlyTheme = typeof light
export type Theme = Mutable<ReadonlyTheme>
export type ReadonlyPalette = typeof lightPalette
export type Palette = Mutable<ReadonlyPalette>

export const lightPalette = {
  white: '#FFFFFF',
  black: '#080B12',
  primary: tokens.color.blue_500,
  positive: tokens.color.green_500,
  negative: tokens.color.red_500,

  contrast_25: tokens.color.gray_25,
  contrast_50: tokens.color.gray_50,
  contrast_100: tokens.color.gray_100,
  contrast_200: tokens.color.gray_200,
  contrast_300: tokens.color.gray_300,
  contrast_400: tokens.color.gray_400,
  contrast_500: tokens.color.gray_500,
  contrast_600: tokens.color.gray_600,
  contrast_700: tokens.color.gray_700,
  contrast_800: tokens.color.gray_800,
  contrast_900: tokens.color.gray_900,
} as const

export const darkPalette: Palette = {
  white: '#FFFFFF',
  black: '#080B12',
  primary: tokens.color.blue_500,
  positive: tokens.color.green_500,
  negative: tokens.color.red_500,

  contrast_25: tokens.color.gray_900,
  contrast_50: tokens.color.gray_800,
  contrast_100: tokens.color.gray_700,
  contrast_200: tokens.color.gray_600,
  contrast_300: tokens.color.gray_500,
  contrast_400: tokens.color.gray_400,
  contrast_500: tokens.color.gray_300,
  contrast_600: tokens.color.gray_200,
  contrast_700: tokens.color.gray_100,
  contrast_800: tokens.color.gray_50,
  contrast_900: tokens.color.gray_25,
} as const

export const light = {
  name: 'light',
  palette: lightPalette,
  atoms: {
    text: {
      color: tokens.color.gray_900,
    },
    text_contrast_600: {
      color: lightPalette.contrast_600,
    },
    text_contrast_500: {
      color: lightPalette.contrast_500,
    },
    text_contrast_400: {
      color: lightPalette.contrast_400,
    },
    text_inverted: {
      color: lightPalette.white,
    },
    bg: {
      backgroundColor: lightPalette.white,
    },
    bg_contrast_25: {
      backgroundColor: lightPalette.contrast_25,
    },
    bg_contrast_50: {
      backgroundColor: lightPalette.contrast_50,
    },
    bg_contrast_100: {
      backgroundColor: lightPalette.contrast_100,
    },
    bg_contrast_200: {
      backgroundColor: lightPalette.contrast_200,
    },
    bg_contrast_300: {
      backgroundColor: lightPalette.contrast_300,
    },
    border: {
      borderColor: lightPalette.contrast_100,
    },
    border_contrast: {
      borderColor: lightPalette.contrast_400,
    },
  },
}

export const dim: Theme = {
  name: 'dim',
  palette: darkPalette,
  atoms: {
    text: {
      color: darkPalette.white,
    },
    text_contrast_600: {
      color: darkPalette.contrast_600,
    },
    text_contrast_500: {
      color: darkPalette.contrast_500,
    },
    text_contrast_400: {
      color: darkPalette.contrast_400,
    },
    text_inverted: {
      color: darkPalette.contrast_900,
    },
    bg: {
      backgroundColor: darkPalette.contrast_25,
    },
    bg_contrast_25: {
      backgroundColor: darkPalette.contrast_50,
    },
    bg_contrast_50: {
      backgroundColor: darkPalette.contrast_100,
    },
    bg_contrast_100: {
      backgroundColor: darkPalette.contrast_200,
    },
    bg_contrast_200: {
      backgroundColor: darkPalette.contrast_300,
    },
    bg_contrast_300: {
      backgroundColor: darkPalette.contrast_400,
    },
    border: {
      borderColor: darkPalette.contrast_50,
    },
    border_contrast: {
      borderColor: darkPalette.contrast_300,
    },
  },
}

export const dark: Theme = {
  name: 'dark',
  palette: darkPalette,
  atoms: {
    text: {
      color: darkPalette.white,
    },
    text_contrast_600: {
      color: darkPalette.contrast_600,
    },
    text_contrast_500: {
      color: darkPalette.contrast_500,
    },
    text_contrast_400: {
      color: darkPalette.contrast_400,
    },
    text_inverted: {
      color: tokens.color.gray_900,
    },
    bg: {
      backgroundColor: darkPalette.black,
    },
    bg_contrast_25: {
      backgroundColor: darkPalette.contrast_25,
    },
    bg_contrast_50: {
      backgroundColor: darkPalette.contrast_50,
    },
    bg_contrast_100: {
      backgroundColor: darkPalette.contrast_100,
    },
    bg_contrast_200: {
      backgroundColor: darkPalette.contrast_200,
    },
    bg_contrast_300: {
      backgroundColor: darkPalette.contrast_300,
    },
    border: {
      borderColor: darkPalette.contrast_50,
    },
    border_contrast: {
      borderColor: darkPalette.contrast_300,
    },
  },
}
