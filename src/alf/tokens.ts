import {isAndroid} from '#/platform/detection'

export const TRACKING = isAndroid ? 0.1 : 0

export const color = {
  temp_purple: 'rgb(105 0 255)',
  temp_purple_dark: 'rgb(83 0 202)',
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
  lg: 16,
  full: 999,
} as const

/**
 * These correspond to Inter font files we actually load.
 */
export const fontWeight = {
  normal: '400',
  medium: '500',
  bold: '600',
  heavy: '800',
} as const

export const gradients = {
  primary: {
    values: [
      [0, '#054CFF'],
      [0.4, '#1085FE'],
      [0.6, '#1085FE'],
      [1, '#59B9FF'],
    ],
    hover_value: '#1085FE',
  },
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
