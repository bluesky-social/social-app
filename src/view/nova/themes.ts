import {createTheme} from './lib/theme'

const BLUE_HUE = 210
const GRAYSCALE_SATURATION = 12

export const palette = {
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
}

export const light = createTheme({
  tokens: {
    space: {
      xxs: 2,
      xs: 4,
      s: 8,
      m: 12,
      l: 18,
      xl: 24,
      xxl: 32,
    },
    color: {
      primary: palette.blue,
      l0: palette.white,
      l1: palette.gray1,
      l2: palette.gray2,
      l3: palette.gray3,
      l4: palette.gray4,
      l5: palette.gray5,
      l6: palette.gray6,
      l7: palette.black,
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
    borderRadius: {
      s: 8,
      m: 12,
      xl: 36,
      round: 999,
    },
    fontWeight: {
      normal: '400',
      semi: '700',
      bold: '900',
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
    column: (span: boolean | number) => ({
      flex: typeof span === 'number' ? span : 1,
    }),
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
    fontSize(value: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl', tokens) {
      return {
        fontSize: tokens.fontSize[value],
        lineHeight: tokens.lineHeight[value],
      }
    },
    fontFamily: (fontFamily: string) => ({fontFamily}),
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
      l0: palette.black,
      l1: palette.gray6,
      l2: palette.gray5,
      l3: palette.gray4,
      l4: palette.gray3,
      l5: palette.gray2,
      l6: palette.gray1,
      l7: palette.white,
    },
  },
})
