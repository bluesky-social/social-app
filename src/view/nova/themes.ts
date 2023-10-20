import {createTheme} from './lib/theme'

const palette = {
  white: '#FFFFFF',
  black: '#0A0B0D',
  gray1: '#F7F9FC',
  gray2: '#E4E8EE',
  gray3: '#CED5DE',
  gray4: '#828A99',
  gray5: '#4D5564',
  gray6: '#1D2126',
  blue: '#1185FE',
  green: '#54D469',
  red: '#FB4566',
}

export const light = createTheme({
  tokens: {
    color: {
      primary: palette.blue,
      l1: palette.white,
      l2: palette.gray1,
      l3: palette.gray2,
      l4: palette.gray3,
      l5: palette.gray4,
      l6: palette.gray5,
      l7: palette.gray6,
      l8: palette.black,
    },
    fontSize: {
      xxs: 10,
      xs: 12,
      s: 14,
      m: 16,
      l: 18,
      xl: 22,
      xxl: 26,
    },
    lineHeight: {
      xs: 12,
      s: 14,
      m: 16,
      l: 18,
      xl: 22,
    },
  },
  properties: {
    w: ['width'],
    h: ['height'],
    c: ['color'],
    bg: ['backgroundColor'],
    ma: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
    mt: ['marginTop'],
    mb: ['marginBottom'],
    ml: ['marginLeft'],
    mr: ['marginRight'],
    my: ['marginTop', 'marginBottom'],
    mx: ['marginLeft', 'marginRight'],
    /**
     * Alias for `padding`, maps to all padding properties e.g. `paddingTop`,
     * `paddingBottom`, etc.
     */
    pa: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    pt: ['paddingTop'],
    pb: ['paddingBottom'],
    pl: ['paddingLeft'],
    pr: ['paddingRight'],
    py: ['paddingTop', 'paddingBottom'],
    px: ['paddingLeft', 'paddingRight'],
    z: ['zIndex'],
    radius: ['borderRadius'],
  },
  macros: {
    row: (_: boolean) => ({flexDirection: 'row'}),
    column: (_: boolean) => ({flex: 1}),
    abs: (_: boolean) => ({position: 'absolute'}),
    cover: (_: boolean) => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }),
    caps: (_: boolean) => ({textTransform: 'uppercase'}),
    fontSize(value: 'xs' | 's' | 'm' | 'l' | 'xl', tokens) {
      return {
        fontSize: tokens.fontSize[value],
        lineHeight: tokens.lineHeight[value],
      }
    },
  },
  breakpoints: {
    gtMobile: 800,
    gtTablet: 1300,
  },
})

export const dark = createTheme({
  ...light.config,
  tokens: {
    ...light.config.tokens,
    color: {
      ...light.config.tokens.color,
      l1: palette.black,
      l2: palette.gray6,
      l3: palette.gray5,
      l4: palette.gray4,
      l5: palette.gray3,
      l6: palette.gray2,
      l7: palette.gray1,
      l8: palette.white,
    },
  },
})
