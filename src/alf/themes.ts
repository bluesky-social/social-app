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
  black: tokens.color.trueBlack,

  contrast_25: `hsl(211, 28%, 8%)`,
  contrast_50: `hsl(211, 28%, 11%)`,
  contrast_100: `hsl(211, 28%, 16%)`,
  contrast_200: `hsl(211, 28%, 24%)`,
  contrast_300: `hsl(211, 24%, 31%)`,
  contrast_400: `hsl(211, 24%, 38%)`,
  contrast_500: `hsl(211, 20%, 44%)`,
  contrast_600: `hsl(211, 20%, 55%)`,
  contrast_700: `hsl(211, 20%, 63%)`,
  contrast_800: `hsl(211, 20%, 71%)`,
  contrast_900: `hsl(211, 20%, 79%)`,
  contrast_950: `hsl(211, 20%, 87%)`,
  contrast_975: `hsl(211, 20%, 95%)`,

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

export const dimPalette: Palette = {
  ...darkPalette,
  black: `hsl(211, 28%, 12%)`,

  contrast_25: `hsl(211, 28%, 15%)`,
  contrast_50: `hsl(211, 28%, 18%)`,
  contrast_100: `hsl(211, 28%, 24%)`,
  contrast_200: `hsl(211, 28%, 27%)`,
  contrast_300: `hsl(211, 24%, 34%)`,
  contrast_400: `hsl(211, 24%, 41%)`,
  contrast_500: `hsl(211, 20%, 52%)`,
  contrast_600: `hsl(211, 20%, 55%)`,
  contrast_700: `hsl(211, 20%, 67%)`,
  contrast_800: `hsl(211, 20%, 71%)`,
  contrast_900: `hsl(211, 20%, 79%)`,
  contrast_950: `hsl(211, 20%, 87%)`,
  contrast_975: `hsl(211, 20%, 95%)`,

  primary_600: `hsl(211, 95%, 39%)`,
  primary_700: `hsl(211, 90%, 30%)`,
  primary_800: `hsl(211, 90%, 23%)`,
  primary_900: `hsl(211, 80%, 16%)`,
  primary_950: `hsl(211, 80%, 13%)`,
  primary_975: `hsl(211, 80%, 10%)`,
} as const

export const light = {
  name: 'light',
  palette: lightPalette,
  atoms: {
    text: {
      color: lightPalette.black,
    },
    text_contrast_low: {
      color: lightPalette.contrast_400,
    },
    text_contrast_medium: {
      color: lightPalette.contrast_700,
    },
    text_contrast_high: {
      color: lightPalette.contrast_900,
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
    bg_contrast_400: {
      backgroundColor: lightPalette.contrast_400,
    },
    bg_contrast_500: {
      backgroundColor: lightPalette.contrast_500,
    },
    bg_contrast_600: {
      backgroundColor: lightPalette.contrast_600,
    },
    bg_contrast_700: {
      backgroundColor: lightPalette.contrast_700,
    },
    bg_contrast_800: {
      backgroundColor: lightPalette.contrast_800,
    },
    bg_contrast_900: {
      backgroundColor: lightPalette.contrast_900,
    },
    bg_contrast_950: {
      backgroundColor: lightPalette.contrast_950,
    },
    bg_contrast_975: {
      backgroundColor: lightPalette.contrast_975,
    },
    border_contrast_low: {
      borderColor: lightPalette.contrast_100,
    },
    border_contrast_medium: {
      borderColor: lightPalette.contrast_200,
    },
    border_contrast_high: {
      borderColor: lightPalette.contrast_300,
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

export const dark: Theme = {
  name: 'dark',
  palette: darkPalette,
  atoms: {
    text: {
      color: darkPalette.white,
    },
    text_contrast_low: {
      color: darkPalette.contrast_400,
    },
    text_contrast_medium: {
      color: darkPalette.contrast_700,
    },
    text_contrast_high: {
      color: darkPalette.contrast_900,
    },
    text_inverted: {
      color: darkPalette.black,
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
    bg_contrast_400: {
      backgroundColor: darkPalette.contrast_400,
    },
    bg_contrast_500: {
      backgroundColor: darkPalette.contrast_500,
    },
    bg_contrast_600: {
      backgroundColor: darkPalette.contrast_600,
    },
    bg_contrast_700: {
      backgroundColor: darkPalette.contrast_700,
    },
    bg_contrast_800: {
      backgroundColor: darkPalette.contrast_800,
    },
    bg_contrast_900: {
      backgroundColor: darkPalette.contrast_900,
    },
    bg_contrast_950: {
      backgroundColor: darkPalette.contrast_950,
    },
    bg_contrast_975: {
      backgroundColor: darkPalette.contrast_975,
    },
    border_contrast_low: {
      borderColor: darkPalette.contrast_100,
    },
    border_contrast_medium: {
      borderColor: darkPalette.contrast_200,
    },
    border_contrast_high: {
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

export const dim: Theme = {
  ...dark,
  name: 'dim',
  palette: dimPalette,
  atoms: {
    ...dark.atoms,
    text: {
      color: dimPalette.white,
    },
    text_contrast_low: {
      color: dimPalette.contrast_400,
    },
    text_contrast_medium: {
      color: dimPalette.contrast_700,
    },
    text_contrast_high: {
      color: dimPalette.contrast_900,
    },
    text_inverted: {
      color: dimPalette.black,
    },
    bg: {
      backgroundColor: dimPalette.black,
    },
    bg_contrast_25: {
      backgroundColor: dimPalette.contrast_25,
    },
    bg_contrast_50: {
      backgroundColor: dimPalette.contrast_50,
    },
    bg_contrast_100: {
      backgroundColor: dimPalette.contrast_100,
    },
    bg_contrast_200: {
      backgroundColor: dimPalette.contrast_200,
    },
    bg_contrast_300: {
      backgroundColor: dimPalette.contrast_300,
    },
    bg_contrast_400: {
      backgroundColor: dimPalette.contrast_400,
    },
    bg_contrast_500: {
      backgroundColor: dimPalette.contrast_500,
    },
    bg_contrast_600: {
      backgroundColor: dimPalette.contrast_600,
    },
    bg_contrast_700: {
      backgroundColor: dimPalette.contrast_700,
    },
    bg_contrast_800: {
      backgroundColor: dimPalette.contrast_800,
    },
    bg_contrast_900: {
      backgroundColor: dimPalette.contrast_900,
    },
    bg_contrast_950: {
      backgroundColor: dimPalette.contrast_950,
    },
    bg_contrast_975: {
      backgroundColor: dimPalette.contrast_975,
    },
    border_contrast_low: {
      borderColor: dimPalette.contrast_100,
    },
    border_contrast_medium: {
      borderColor: dimPalette.contrast_200,
    },
    border_contrast_high: {
      borderColor: dimPalette.contrast_300,
    },
    shadow_sm: {
      ...atoms.shadow_sm,
      shadowOpacity: 0.7,
      shadowColor: `hsl(211, 28%, 3%)`,
    },
    shadow_md: {
      ...atoms.shadow_md,
      shadowOpacity: 0.7,
      shadowColor: `hsl(211, 28%, 3%)`,
    },
    shadow_lg: {
      ...atoms.shadow_lg,
      shadowOpacity: 0.7,
      shadowColor: `hsl(211, 28%, 3%)`,
    },
  },
}
