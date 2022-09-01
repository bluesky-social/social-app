import {StyleSheet} from 'react-native'

// 1 is lightest, 2 is light, 3 is mid, 4 is dark, 5 is darkest
export const colors = {
  white: '#ffffff',
  black: '#000000',

  gray1: '#f8f3f3',
  gray2: '#e4e2e2',
  gray3: '#c1b9b9',
  gray4: '#968d8d',
  gray5: '#645454',

  blue1: '#8bc7fd',
  blue2: '#52acfe',
  blue3: '#0085ff',
  blue4: '#0062bd',
  blue5: '#034581',

  red1: '#ffe6f2',
  red2: '#fba2ce',
  red3: '#ec4899',
  red4: '#d1106f',
  red5: '#97074e',

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

export const gradients = {
  primary: {start: '#db00ff', end: '#ff007a'},
}

export const s = StyleSheet.create({
  // font weights
  fw600: {fontWeight: '600'},
  bold: {fontWeight: '600'},
  fw500: {fontWeight: '500'},
  semiBold: {fontWeight: '500'},
  fw400: {fontWeight: '400'},
  normal: {fontWeight: '400'},
  fw300: {fontWeight: '300'},
  light: {fontWeight: '300'},
  fw200: {fontWeight: '200'},

  // font sizes
  f13: {fontSize: 13},
  f14: {fontSize: 14},
  f15: {fontSize: 15},
  f16: {fontSize: 16},
  f18: {fontSize: 18},

  // line heights
  ['lh13-1']: {lineHeight: 13},
  ['lh13-1.3']: {lineHeight: 16.9}, // 1.3 of 13px
  ['lh14-1']: {lineHeight: 14},
  ['lh14-1.3']: {lineHeight: 18.2}, // 1.3 of 14px
  ['lh15-1']: {lineHeight: 15},
  ['lh15-1.3']: {lineHeight: 19.5}, // 1.3 of 15px
  ['lh16-1']: {lineHeight: 16},
  ['lh16-1.3']: {lineHeight: 20.8}, // 1.3 of 16px
  ['lh18-1']: {lineHeight: 18},
  ['lh18-1.3']: {lineHeight: 23.4}, // 1.3 of 18px

  // margins
  mr2: {marginRight: 2},
  mr5: {marginRight: 5},
  mr10: {marginRight: 10},
  ml2: {marginLeft: 2},
  ml5: {marginLeft: 5},
  ml10: {marginLeft: 10},
  mt2: {marginTop: 2},
  mt5: {marginTop: 5},
  mt10: {marginTop: 10},
  mb2: {marginBottom: 2},
  mb5: {marginBottom: 5},
  mb10: {marginBottom: 10},

  // paddings
  p2: {padding: 2},
  p5: {padding: 5},
  p10: {padding: 10},
  pr2: {paddingRight: 2},
  pr5: {paddingRight: 5},
  pr10: {paddingRight: 10},
  pl2: {paddingLeft: 2},
  pl5: {paddingLeft: 5},
  pl10: {paddingLeft: 10},
  pt2: {paddingTop: 2},
  pt5: {paddingTop: 5},
  pt10: {paddingTop: 10},
  pb2: {paddingBottom: 2},
  pb5: {paddingBottom: 5},
  pb10: {paddingBottom: 10},

  // flex
  flexRow: {flexDirection: 'row'},
  flexCol: {flexDirection: 'column'},
  flex1: {flex: 1},

  // dimensions
  w100pct: {width: '100%'},
  h100pct: {height: '100%'},

  // text align
  textLeft: {textAlign: 'left'},
  textCenter: {textAlign: 'center'},
  textRight: {textAlign: 'right'},

  // colors
  white: {color: colors.white},
  black: {color: colors.black},

  gray1: {color: colors.gray1},
  gray2: {color: colors.gray2},
  gray3: {color: colors.gray3},
  gray4: {color: colors.gray4},
  gray5: {color: colors.gray5},

  blue1: {color: colors.blue1},
  blue2: {color: colors.blue2},
  blue3: {color: colors.blue3},
  blue4: {color: colors.blue4},
  blue5: {color: colors.blue5},

  red1: {color: colors.red1},
  red2: {color: colors.red2},
  red3: {color: colors.red3},
  red4: {color: colors.red4},
  red5: {color: colors.red5},

  pink1: {color: colors.pink1},
  pink2: {color: colors.pink2},
  pink3: {color: colors.pink3},
  pink4: {color: colors.pink4},
  pink5: {color: colors.pink5},

  purple1: {color: colors.purple1},
  purple2: {color: colors.purple2},
  purple3: {color: colors.purple3},
  purple4: {color: colors.purple4},
  purple5: {color: colors.purple5},

  green1: {color: colors.green1},
  green2: {color: colors.green2},
  green3: {color: colors.green3},
  green4: {color: colors.green4},
  green5: {color: colors.green5},
})
