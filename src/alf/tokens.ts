const BLUE_HUE = 210
const GRAYSCALE_SATURATION = 12

export const color = {
  white: '#FFFFFF',

  /**
   * Mathematical scale of grays, from lightest to darkest, all based on the
   * primary blue color
   */
  gray1: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 95%)`,
  gray2: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 85%)`,
  gray3: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 75%)`,
  gray4: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 30%)`,
  gray5: `hsl(${BLUE_HUE} ${GRAYSCALE_SATURATION}%, 20%)`,
  gray6: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 10%)`,
  black: `hsl(${BLUE_HUE}, ${GRAYSCALE_SATURATION}%, 5%)`,

  blue: `hsl(${BLUE_HUE}, 100%, 53%)`,
  green: '#54D469',
  red: '#FB4566',
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
  normal: 1.5,
  relaxed: 1.625,
} as const

export const borderRadius = {
  sm: 8,
  md: 12,
  xl: 36,
  full: 999,
} as const

export const fontWeight = {
  normal: '400',
  semi: '600',
  bold: '900',
} as const

export type Color = keyof typeof color
export type Space = keyof typeof space
export type FontSize = keyof typeof fontSize
export type LineHeight = keyof typeof lineHeight
export type BorderRadius = keyof typeof borderRadius
export type FontWeight = keyof typeof fontWeight
