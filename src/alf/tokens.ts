export const color = {
  white: '#FFFFFF',

  gray_25: `#FCFCFD`,
  gray_50: `#F9FAFB`,
  gray_100: `#F3F4F6`,
  gray_200: `#E5E7EB`,
  gray_300: `#D2D6DB`,
  gray_400: `#9DA4AE`,
  gray_500: `#6C737F`,
  gray_600: `#4D5761`,
  gray_700: `#384250`,
  gray_800: `#1F2A37`,
  gray_900: `#111927`,

  blue_25: `#F5FAFF`,
  blue_50: `#EFF8FF`,
  blue_100: `#EFF8FF`,
  blue_200: `#B2DDFF`,
  blue_300: `#84CAFF`,
  blue_400: `#53B1FD`,
  blue_500: `#1185FE`,
  blue_600: `#1073DB`,
  blue_700: `#0B5CB2`,
  blue_800: `#084585`,
  blue_900: `#08305A`,

  green_25: `#F6FEF9`,
  green_50: `#ECFDF3`,
  green_100: `#D1FADF`,
  green_200: `#A6F4C5`,
  green_300: `#6CE9A6`,
  green_400: `#32D583`,
  green_500: `#12B76A`,
  green_600: `#039855`,
  green_700: `#027A48`,
  green_800: `#05603A`,
  green_900: `#054F31`,

  red_25: `#FFF5F6`,
  red_50: `#FFF1F3`,
  red_100: `#FFE4E8`,
  red_200: `#FECDD6`,
  red_300: `#FEA3B4`,
  red_400: `#FD6F8E`,
  red_500: `#F63D68`,
  red_600: `#E31B54`,
  red_700: `#C01048`,
  red_800: `#A11043`,
  red_900: `#89123E`,
} as const

export const space = {
  _2xs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  _2xl: 24,
  _3xl: 28,
  _4xl: 32,
  _5xl: 40,
} as const

export const fontSize = {
  _2xs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  _2xl: 22,
  _3xl: 26,
  _4xl: 32,
  _5xl: 40,
} as const

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
