import * as tokens from '#/alf/tokens'
import type {Mutable} from '#/alf/types'
import {atoms} from '#/alf/atoms'

export type ThemeName = 'light' | 'dim' | 'dark'
export type ReadonlyTheme = typeof light
export type Theme = Mutable<ReadonlyTheme>
export type ReadonlyPalette = typeof lightPalette
export type Palette = Mutable<ReadonlyPalette>

export const lightPalette = {
  white: tokens.color.gray_0,
  black: tokens.color.gray_1000,

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
  contrast_950: tokens.color.gray_950,
  contrast_975: tokens.color.gray_975,

  primary_25: tokens.color.blue_25,
  primary_50: tokens.color.blue_50,
  primary_100: tokens.color.blue_100,
  primary_200: tokens.color.blue_200,
  primary_300: tokens.color.blue_300,
  primary_400: tokens.color.blue_400,
  primary_500: tokens.color.blue_500,
  primary_600: tokens.color.blue_600,
  primary_700: tokens.color.blue_700,
  primary_800: tokens.color.blue_800,
  primary_900: tokens.color.blue_900,
  primary_950: tokens.color.blue_950,
  primary_975: tokens.color.blue_975,

  positive_25: tokens.color.green_25,
  positive_50: tokens.color.green_50,
  positive_100: tokens.color.green_100,
  positive_200: tokens.color.green_200,
  positive_300: tokens.color.green_300,
  positive_400: tokens.color.green_400,
  positive_500: tokens.color.green_500,
  positive_600: tokens.color.green_600,
  positive_700: tokens.color.green_700,
  positive_800: tokens.color.green_800,
  positive_900: tokens.color.green_900,
  positive_950: tokens.color.green_950,
  positive_975: tokens.color.green_975,

  negative_25: tokens.color.red_25,
  negative_50: tokens.color.red_50,
  negative_100: tokens.color.red_100,
  negative_200: tokens.color.red_200,
  negative_300: tokens.color.red_300,
  negative_400: tokens.color.red_400,
  negative_500: tokens.color.red_500,
  negative_600: tokens.color.red_600,
  negative_700: tokens.color.red_700,
  negative_800: tokens.color.red_800,
  negative_900: tokens.color.red_900,
  negative_950: tokens.color.red_950,
  negative_975: tokens.color.red_975,
} as const

export const darkPalette: Palette = {
  white: tokens.color.gray_0,
  black: tokens.color.gray_1000,

  contrast_25: tokens.color.gray_975,
  contrast_50: tokens.color.gray_950,
  contrast_100: tokens.color.gray_900,
  contrast_200: tokens.color.gray_800,
  contrast_300: tokens.color.gray_700,
  contrast_400: tokens.color.gray_600,
  contrast_500: tokens.color.gray_500,
  contrast_600: tokens.color.gray_400,
  contrast_700: tokens.color.gray_300,
  contrast_800: tokens.color.gray_200,
  contrast_900: tokens.color.gray_100,
  contrast_950: tokens.color.gray_50,
  contrast_975: tokens.color.gray_25,

  primary_25: tokens.color.blue_25,
  primary_50: tokens.color.blue_50,
  primary_100: tokens.color.blue_100,
  primary_200: tokens.color.blue_200,
  primary_300: tokens.color.blue_300,
  primary_400: tokens.color.blue_400,
  primary_500: tokens.color.blue_500,
  primary_600: tokens.color.blue_600,
  primary_700: tokens.color.blue_700,
  primary_800: tokens.color.blue_800,
  primary_900: tokens.color.blue_900,
  primary_950: tokens.color.blue_950,
  primary_975: tokens.color.blue_975,

  positive_25: tokens.color.green_25,
  positive_50: tokens.color.green_50,
  positive_100: tokens.color.green_100,
  positive_200: tokens.color.green_200,
  positive_300: tokens.color.green_300,
  positive_400: tokens.color.green_400,
  positive_500: tokens.color.green_500,
  positive_600: tokens.color.green_600,
  positive_700: tokens.color.green_700,
  positive_800: tokens.color.green_800,
  positive_900: tokens.color.green_900,
  positive_950: tokens.color.green_950,
  positive_975: tokens.color.green_975,

  negative_25: tokens.color.red_25,
  negative_50: tokens.color.red_50,
  negative_100: tokens.color.red_100,
  negative_200: tokens.color.red_200,
  negative_300: tokens.color.red_300,
  negative_400: tokens.color.red_400,
  negative_500: tokens.color.red_500,
  negative_600: tokens.color.red_600,
  negative_700: tokens.color.red_700,
  negative_800: tokens.color.red_800,
  negative_900: tokens.color.red_900,
  negative_950: tokens.color.red_950,
  negative_975: tokens.color.red_975,
} as const

export const light = {
  name: 'light',
  palette: lightPalette,
  atoms: {
    text: {
      color: lightPalette.black,
    },
    text_contrast_700: {
      color: lightPalette.contrast_700,
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
    shadow_sm: {
      ...atoms.shadow_sm,
      shadowColor: lightPalette.black,
    },
    shadow_md: {
      ...atoms.shadow_md,
      shadowColor: lightPalette.black,
    },
    shadow_lg: {
      ...atoms.shadow_lg,
      shadowColor: lightPalette.black,
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
    text_contrast_700: {
      color: darkPalette.contrast_800,
    },
    text_contrast_600: {
      color: darkPalette.contrast_700,
    },
    text_contrast_500: {
      color: darkPalette.contrast_600,
    },
    text_contrast_400: {
      color: darkPalette.contrast_500,
    },
    text_inverted: {
      color: darkPalette.black,
    },
    bg: {
      backgroundColor: darkPalette.contrast_50,
    },
    bg_contrast_25: {
      backgroundColor: darkPalette.contrast_100,
    },
    bg_contrast_50: {
      backgroundColor: darkPalette.contrast_200,
    },
    bg_contrast_100: {
      backgroundColor: darkPalette.contrast_300,
    },
    bg_contrast_200: {
      backgroundColor: darkPalette.contrast_400,
    },
    bg_contrast_300: {
      backgroundColor: darkPalette.contrast_500,
    },
    border: {
      borderColor: darkPalette.contrast_200,
    },
    border_contrast: {
      borderColor: darkPalette.contrast_400,
    },
    shadow_sm: {
      ...atoms.shadow_sm,
      shadowOpacity: 0.7,
      shadowColor: tokens.color.trueBlack,
    },
    shadow_md: {
      ...atoms.shadow_md,
      shadowOpacity: 0.7,
      shadowColor: tokens.color.trueBlack,
    },
    shadow_lg: {
      ...atoms.shadow_lg,
      shadowOpacity: 0.7,
      shadowColor: tokens.color.trueBlack,
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
    text_contrast_700: {
      color: darkPalette.contrast_700,
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
      color: darkPalette.black,
    },
    bg: {
      backgroundColor: darkPalette.black,
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
      borderColor: darkPalette.contrast_100,
    },
    border_contrast: {
      borderColor: darkPalette.contrast_300,
    },
    shadow_sm: {
      ...atoms.shadow_sm,
      shadowOpacity: 0.7,
      shadowColor: tokens.color.trueBlack,
    },
    shadow_md: {
      ...atoms.shadow_md,
      shadowOpacity: 0.7,
      shadowColor: tokens.color.trueBlack,
    },
    shadow_lg: {
      ...atoms.shadow_lg,
      shadowOpacity: 0.7,
      shadowColor: tokens.color.trueBlack,
    },
  },
}
