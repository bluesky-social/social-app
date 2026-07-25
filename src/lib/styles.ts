import {type StyleProp, StyleSheet, type TextStyle} from 'react-native'

import {IS_WEB} from '#/env'
import {type Theme, type TypographyVariant} from './ThemeContext'

// 1 is lightest, 2 is light, 3 is mid, 4 is dark, 5 is darkest
/**
 * @deprecated use ALF colors instead
 */
export const colors = {
  white: '#ffffff',
  black: '#000000',

  gray1: '#F3F3F8',
  gray2: '#E2E2E4',
  gray3: '#B9B9C1',
  gray4: '#8D8E96',
  gray5: '#545664',
  gray6: '#373942',
  gray7: '#26272D',
  gray8: '#141417',

  blue0: '#bfe1ff',
  blue1: '#8bc7fd',
  blue2: '#52acfe',
  blue3: '#0085ff',
  blue4: '#0062bd',
  blue5: '#034581',
  blue6: '#012561',
  blue7: '#001040',

  red1: '#ffe6eb',
  red2: '#fba2b2',
  red3: '#ec4868',
  red4: '#d11043',
  red5: '#970721',
  red6: '#690419',
  red7: '#4F0314',

  pink1: '#f8ccff',
  pink2: '#e966ff',
  pink3: '#db00ff',
  pink4: '#a601c1',
  pink5: '#570066',

  purple1: '#ebdbff',
  purple2: '#ba85ff',
  purple3: '#9747ff',
  purple4: '#6d00fa',
  purple5: '#380080',

  green1: '#c1ffb8',
  green2: '#27f406',
  green3: '#20bc07',
  green4: '#148203',
  green5: '#082b03',
}

/**
 * @deprecated use atoms from `#/alf`
 */
export const s = StyleSheet.create({
  // helpers
  footerSpacer: {height: 100},
  contentContainer: {paddingBottom: 200},

  // margins
  mr2: {marginRight: 2},
  mr5: {marginRight: 5},
  mr10: {marginRight: 10},
  mr20: {marginRight: 20},
  ml2: {marginLeft: 2},
  ml5: {marginLeft: 5},
  ml10: {marginLeft: 10},
  ml20: {marginLeft: 20},
  mt2: {marginTop: 2},
  mt5: {marginTop: 5},
  mt10: {marginTop: 10},
  mt20: {marginTop: 20},
  mb2: {marginBottom: 2},
  mb5: {marginBottom: 5},
  mb10: {marginBottom: 10},
  mb20: {marginBottom: 20},

  // paddings
  p2: {padding: 2},
  p5: {padding: 5},
  p10: {padding: 10},
  p20: {padding: 20},
  pr2: {paddingRight: 2},
  pr5: {paddingRight: 5},
  pr10: {paddingRight: 10},
  pr20: {paddingRight: 20},
  pl2: {paddingLeft: 2},
  pl5: {paddingLeft: 5},
  pl10: {paddingLeft: 10},
  pl20: {paddingLeft: 20},
  pt2: {paddingTop: 2},
  pt5: {paddingTop: 5},
  pt10: {paddingTop: 10},
  pt20: {paddingTop: 20},
  pb2: {paddingBottom: 2},
  pb5: {paddingBottom: 5},
  pb10: {paddingBottom: 10},
  pb20: {paddingBottom: 20},
  px5: {paddingHorizontal: 5},

  // dimensions
  hContentRegion: IS_WEB ? {minHeight: '100%'} : {height: '100%'},

  // text align
  textCenter: {textAlign: 'center'},

  // colors
  white: {color: colors.white},
  black: {color: colors.black},
})

export function lh(
  theme: Theme,
  type: TypographyVariant,
  height: number,
): TextStyle {
  return {
    lineHeight: Math.round((theme.typography[type].fontSize || 16) * height),
  }
}

export function addStyle<T>(
  base: StyleProp<T>,
  addedStyle: StyleProp<T>,
): StyleProp<T> {
  if (Array.isArray(base)) {
    return base.concat([addedStyle])
  }
  return [base, addedStyle]
}
