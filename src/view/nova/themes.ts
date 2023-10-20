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
      xxs: 10,
      xs: 12,
      s: 14,
      m: 16,
      l: 18,
      xl: 22,
      xxl: 26,
    },
  },
  properties: {
    /** Alias for `width` */
    w: ['width'],
    /** Alias for `height` */
    h: ['height'],
    /** Alias for `color` */
    c: ['color'],
    /** Alias for `backgroundColor` */
    bg: ['backgroundColor'],
    /** Alias for all directional margin properties */
    ma: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
    /** Alias for `marginTop` */
    mt: ['marginTop'],
    /** Alias for `marginBottom` */
    mb: ['marginBottom'],
    /** Alias for `marginLeft` */
    ml: ['marginLeft'],
    /** Alias for `marginRight` */
    mr: ['marginRight'],
    /** Alias for `marginVertical` */
    my: ['marginTop', 'marginBottom'],
    /** Alias for `marginHorizontal` */
    mx: ['marginLeft', 'marginRight'],
    /** Alias for all directional padding properties */
    pa: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    /** Alias for `paddingTop` */
    pt: ['paddingTop'],
    /** Alias for `paddingBottom` */
    pb: ['paddingBottom'],
    /** Alias for `paddingLeft` */
    pl: ['paddingLeft'],
    /** Alias for `paddingRight` */
    pr: ['paddingRight'],
    /** Alias for `paddingVertical` */
    py: ['paddingTop', 'paddingBottom'],
    /** Alias for `paddingHorizontal` */
    px: ['paddingLeft', 'paddingRight'],
    /** Alias for `zIndex` */
    z: ['zIndex'],
    /** Alias for `borderRadius` */
    radius: ['borderRadius'],
  },
  macros: {
    /** Shorthand for `flexDirection: 'row'` */
    row: (_: boolean) => ({flexDirection: 'row'}),
    /**
     * Shorthand for `flex: 1`.
     *
     * Semantically this is helpful as a direct child of `<Box row>`
     *
     * @example
     * <Box row>
     *   <Box column>
     *     <Text>Hello</Text>
     *   </Box>
     * </Box>
     */
    column: (_: boolean) => ({flex: 1}),
    /** Shorthand for `position: 'absolute'` */
    abs: (_: boolean) => ({position: 'absolute'}),
    /** Shorthand for `StyleSheet.absoluteFillObject` */
    cover: (_: boolean) => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }),
    /** Shorthand for `textTransform: 'uppercase'` */
    caps: (_: boolean) => ({textTransform: 'uppercase'}),
    /**
     * Shorthand for applying `fontSize` and `fontHeight`, according to our type scale.
     */
    fontSize(value: 'xs' | 's' | 'm' | 'l' | 'xl', tokens) {
      return {
        fontSize: tokens.fontSize[value],
        lineHeight: tokens.lineHeight[value],
      }
    },
  },
  breakpoints: {
    /** Greater than 800 */
    gtMobile: 800,
    /** Greater than 1300 */
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
