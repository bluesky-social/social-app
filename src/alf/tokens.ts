const BLUE_HUE = 211
const GRAYSCALE_SATURATION = 22

export const color = {
  white: '#FFFFFF',

  gray_50: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 95%)`,
  gray_100: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 90%)`,
  gray_200: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 80%)`,
  gray_300: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 70%)`,
  gray_400: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 60%)`,
  gray_500: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 50%)`,
  gray_600: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 40%)`,
  gray_700: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 30%)`,
  gray_800: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 20%)`,
  gray_900: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 10%)`,
  gray_950: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 5%)`,

  blue_50: `hsl(${BLUE_HUE}, 99%, 98%)`,
  blue_100: `hsl(${BLUE_HUE}, 99%, 93%)`,
  blue_200: `hsl(${BLUE_HUE}, 99%, 83%)`,
  blue_300: `hsl(${BLUE_HUE}, 99%, 73%)`,
  blue_400: `hsl(${BLUE_HUE}, 99%, 63%)`,
  blue_500: `hsl(${BLUE_HUE}, 99%, 53%)`,
  blue_600: `hsl(${BLUE_HUE}, 99%, 43%)`,
  blue_700: `hsl(${BLUE_HUE}, 99%, 33%)`,
  blue_800: `hsl(${BLUE_HUE}, 99%, 23%)`,
  blue_900: `hsl(${BLUE_HUE}, 99%, 13%)`,
  blue_950: `hsl(${BLUE_HUE}, 99%, 8%)`,

  green_50: `hsl(130, 60%, 95%)`,
  green_100: `hsl(130, 60%, 90%)`,
  green_200: `hsl(130, 60%, 80%)`,
  green_300: `hsl(130, 60%, 70%)`,
  green_400: `hsl(130, 60%, 60%)`,
  green_500: `hsl(130, 60%, 50%)`,
  green_600: `hsl(130, 60%, 40%)`,
  green_700: `hsl(130, 60%, 30%)`,
  green_800: `hsl(130, 60%, 20%)`,
  green_900: `hsl(130, 60%, 10%)`,
  green_950: `hsl(130, 60%, 5%)`,

  red_50: `hsl(349, 96%, 95%)`,
  red_100: `hsl(349, 96%, 90%)`,
  red_200: `hsl(349, 96%, 80%)`,
  red_300: `hsl(349, 96%, 70%)`,
  red_400: `hsl(349, 96%, 60%)`,
  red_500: `hsl(349, 96%, 50%)`,
  red_600: `hsl(349, 96%, 40%)`,
  red_700: `hsl(349, 96%, 30%)`,
  red_800: `hsl(349, 96%, 20%)`,
  red_900: `hsl(349, 96%, 10%)`,
  red_950: `hsl(349, 96%, 5%)`,
}

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
}

export const fontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
}

// TODO test
export const lineHeight = {
  none: 1,
  normal: 1.5,
  relaxed: 1.625,
}

export const borderRadius = {
  sm: 8,
  md: 12,
  xl: 36,
  full: 999,
}

export const fontWeight = {
  normal: '400',
  semibold: '600',
  bold: '900',
}

export type Color = keyof typeof color
export type Space = keyof typeof space
export type FontSize = keyof typeof fontSize
export type LineHeight = keyof typeof lineHeight
export type BorderRadius = keyof typeof borderRadius
export type FontWeight = keyof typeof fontWeight
