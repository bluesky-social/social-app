const BLUE_HUE = 211
const GRAYSCALE_SATURATION = 22

export const color = {
  white: '#FFFFFF',

  gray_0: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 100%)`,
  gray_100: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 95%)`,
  gray_200: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 85%)`,
  gray_300: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 75%)`,
  gray_400: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 65%)`,
  gray_500: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 55%)`,
  gray_600: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 45%)`,
  gray_700: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 35%)`,
  gray_800: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 25%)`,
  gray_900: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 15%)`,
  gray_1000: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 5%)`,

  blue_0: `hsl(${BLUE_HUE}, 99%, 100%)`,
  blue_100: `hsl(${BLUE_HUE}, 99%, 93%)`,
  blue_200: `hsl(${BLUE_HUE}, 99%, 83%)`,
  blue_300: `hsl(${BLUE_HUE}, 99%, 73%)`,
  blue_400: `hsl(${BLUE_HUE}, 99%, 63%)`,
  blue_500: `hsl(${BLUE_HUE}, 99%, 53%)`,
  blue_600: `hsl(${BLUE_HUE}, 99%, 43%)`,
  blue_700: `hsl(${BLUE_HUE}, 99%, 33%)`,
  blue_800: `hsl(${BLUE_HUE}, 99%, 23%)`,
  blue_900: `hsl(${BLUE_HUE}, 99%, 13%)`,
  blue_1000: `hsl(${BLUE_HUE}, 99%, 8%)`,

  green_0: `hsl(130, 60%, 100%)`,
  green_100: `hsl(130, 60%, 95%)`,
  green_200: `hsl(130, 60%, 85%)`,
  green_300: `hsl(130, 60%, 75%)`,
  green_400: `hsl(130, 60%, 65%)`,
  green_500: `hsl(130, 60%, 55%)`,
  green_600: `hsl(130, 60%, 45%)`,
  green_700: `hsl(130, 60%, 35%)`,
  green_800: `hsl(130, 60%, 25%)`,
  green_900: `hsl(130, 60%, 15%)`,
  green_1000: `hsl(130, 60%, 5%)`,

  red_0: `hsl(349, 96%, 100%)`,
  red_100: `hsl(349, 96%, 95%)`,
  red_200: `hsl(349, 96%, 85%)`,
  red_300: `hsl(349, 96%, 75%)`,
  red_400: `hsl(349, 96%, 65%)`,
  red_500: `hsl(349, 96%, 55%)`,
  red_600: `hsl(349, 96%, 45%)`,
  red_700: `hsl(349, 96%, 35%)`,
  red_800: `hsl(349, 96%, 25%)`,
  red_900: `hsl(349, 96%, 15%)`,
  red_1000: `hsl(349, 96%, 5%)`,
} as const

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const

export const fontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
} as const

// TODO test
export const lineHeight = {
  none: 1,
  normal: 1.5,
  relaxed: 1.625,
} as const

export const borderRadius = {
  sm: 8,
  md: 12,
  full: 999,
} as const

export const fontWeight = {
  normal: '400',
  semibold: '600',
  bold: '900',
} as const

export type Color = keyof typeof color
export type Space = keyof typeof space
export type FontSize = keyof typeof fontSize
export type LineHeight = keyof typeof lineHeight
export type BorderRadius = keyof typeof borderRadius
export type FontWeight = keyof typeof fontWeight
