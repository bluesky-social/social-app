import {
  BLUE_HUE,
  generateScale,
  GREEN_HUE,
  RED_HUE,
} from '#/alf/util/colorGeneration'

export const scale = generateScale(6, 100)
// dim shifted 6% lighter
export const dimScale = generateScale(12, 100)

export const color = {
  trueBlack: '#000000',

  temp_purple: 'rgb(105 0 255)',
  temp_purple_dark: 'rgb(83 0 202)',

  gray_0: `hsl(${BLUE_HUE}, 20%, ${scale[14]}%)`,
  gray_25: `hsl(${BLUE_HUE}, 20%, ${scale[13]}%)`,
  gray_50: `hsl(${BLUE_HUE}, 20%, ${scale[12]}%)`,
  gray_100: `hsl(${BLUE_HUE}, 20%, ${scale[11]}%)`,
  gray_200: `hsl(${BLUE_HUE}, 20%, ${scale[10]}%)`,
  gray_300: `hsl(${BLUE_HUE}, 20%, ${scale[9]}%)`,
  gray_400: `hsl(${BLUE_HUE}, 20%, ${scale[8]}%)`,
  gray_500: `hsl(${BLUE_HUE}, 20%, ${scale[7]}%)`,
  gray_600: `hsl(${BLUE_HUE}, 24%, ${scale[6]}%)`,
  gray_700: `hsl(${BLUE_HUE}, 24%, ${scale[5]}%)`,
  gray_800: `hsl(${BLUE_HUE}, 28%, ${scale[4]}%)`,
  gray_900: `hsl(${BLUE_HUE}, 28%, ${scale[3]}%)`,
  gray_950: `hsl(${BLUE_HUE}, 28%, ${scale[2]}%)`,
  gray_975: `hsl(${BLUE_HUE}, 28%, ${scale[1]}%)`,
  gray_1000: `hsl(${BLUE_HUE}, 28%, ${scale[0]}%)`,

  blue_25: `hsl(${BLUE_HUE}, 99%, 97%)`,
  blue_50: `hsl(${BLUE_HUE}, 99%, 95%)`,
  blue_100: `hsl(${BLUE_HUE}, 99%, 90%)`,
  blue_200: `hsl(${BLUE_HUE}, 99%, 80%)`,
  blue_300: `hsl(${BLUE_HUE}, 99%, 70%)`,
  blue_400: `hsl(${BLUE_HUE}, 99%, 60%)`,
  blue_500: `hsl(${BLUE_HUE}, 99%, 53%)`,
  blue_600: `hsl(${BLUE_HUE}, 99%, 42%)`,
  blue_700: `hsl(${BLUE_HUE}, 99%, 34%)`,
  blue_800: `hsl(${BLUE_HUE}, 99%, 26%)`,
  blue_900: `hsl(${BLUE_HUE}, 99%, 18%)`,
  blue_950: `hsl(${BLUE_HUE}, 99%, 10%)`,
  blue_975: `hsl(${BLUE_HUE}, 99%, 7%)`,

  green_25: `hsl(${GREEN_HUE}, 82%, 97%)`,
  green_50: `hsl(${GREEN_HUE}, 82%, 95%)`,
  green_100: `hsl(${GREEN_HUE}, 82%, 90%)`,
  green_200: `hsl(${GREEN_HUE}, 82%, 80%)`,
  green_300: `hsl(${GREEN_HUE}, 82%, 70%)`,
  green_400: `hsl(${GREEN_HUE}, 82%, 60%)`,
  green_500: `hsl(${GREEN_HUE}, 82%, 50%)`,
  green_600: `hsl(${GREEN_HUE}, 82%, 42%)`,
  green_700: `hsl(${GREEN_HUE}, 82%, 34%)`,
  green_800: `hsl(${GREEN_HUE}, 82%, 26%)`,
  green_900: `hsl(${GREEN_HUE}, 82%, 18%)`,
  green_950: `hsl(${GREEN_HUE}, 82%, 10%)`,
  green_975: `hsl(${GREEN_HUE}, 82%, 7%)`,

  red_25: `hsl(${RED_HUE}, 91%, 97%)`,
  red_50: `hsl(${RED_HUE}, 91%, 95%)`,
  red_100: `hsl(${RED_HUE}, 91%, 90%)`,
  red_200: `hsl(${RED_HUE}, 91%, 80%)`,
  red_300: `hsl(${RED_HUE}, 91%, 70%)`,
  red_400: `hsl(${RED_HUE}, 91%, 60%)`,
  red_500: `hsl(${RED_HUE}, 91%, 50%)`,
  red_600: `hsl(${RED_HUE}, 91%, 42%)`,
  red_700: `hsl(${RED_HUE}, 91%, 34%)`,
  red_800: `hsl(${RED_HUE}, 91%, 26%)`,
  red_900: `hsl(${RED_HUE}, 91%, 18%)`,
  red_950: `hsl(${RED_HUE}, 91%, 10%)`,
  red_975: `hsl(${RED_HUE}, 91%, 7%)`,
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
  _2xs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  full: 999,
} as const

export const fontWeight = {
  normal: '400',
  semibold: '500',
  bold: '600',
  heavy: '700',
} as const

export const gradients = {
  sky: {
    values: [
      [0, '#0A7AFF'],
      [1, '#59B9FF'],
    ],
    hover_value: '#0A7AFF',
  },
  midnight: {
    values: [
      [0, '#022C5E'],
      [1, '#4079BC'],
    ],
    hover_value: '#022C5E',
  },
  sunrise: {
    values: [
      [0, '#4E90AE'],
      [0.4, '#AEA3AB'],
      [0.8, '#E6A98F'],
      [1, '#F3A84C'],
    ],
    hover_value: '#AEA3AB',
  },
  sunset: {
    values: [
      [0, '#6772AF'],
      [0.6, '#B88BB6'],
      [1, '#FFA6AC'],
    ],
    hover_value: '#B88BB6',
  },
  summer: {
    values: [
      [0, '#FF6A56'],
      [0.3, '#FF9156'],
      [1, '#FFDD87'],
    ],
    hover_value: '#FF9156',
  },
  nordic: {
    values: [
      [0, '#083367'],
      [1, '#9EE8C1'],
    ],
    hover_value: '#3A7085',
  },
  bonfire: {
    values: [
      [0, '#203E4E'],
      [0.4, '#755B62'],
      [0.8, '#CD7765'],
      [1, '#EF956E'],
    ],
    hover_value: '#755B62',
  },
} as const

export type Color = keyof typeof color
export type Space = keyof typeof space
export type FontSize = keyof typeof fontSize
export type LineHeight = keyof typeof lineHeight
export type BorderRadius = keyof typeof borderRadius
export type FontWeight = keyof typeof fontWeight
