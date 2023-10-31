import {Platform} from 'react-native'
import type {Theme} from './ThemeContext'
import {alpha, colors} from './styles'

const oldDefaultTheme: Theme = {
  colorScheme: 'light',
  palette: {
    default: {
      background: colors.white,
      backgroundLight: colors.gray1,
      backgroundInverted: colors.black,
      backgroundInvertedLight: colors.gray6,
      highlight: '#E0D6F4', //colors.gray2, // Waverly light-purple
      text: colors.black,
      textLight: colors.gray4,
      textInverted: colors.white,
      link: colors.blue3,
      border: '#f0e9e9',
      borderDark: '#e0d9d9',
      icon: colors.gray4,

      // non-standard
      textVeryLight: colors.gray4,
      replyLine: colors.gray2,
      replyLineDot: colors.gray3,
      unreadNotifBg: '#ebf6ff',
      unreadNotifBorder: colors.blue1,
      postCtrl: '#71768A',
      brandText: '#0066FF',
      emptyStateIcon: '#B6B6C9',
    },
    primary: {
      background: colors.waverly5,
      backgroundLight: colors.waverly4,
      backgroundInverted: colors.waverly1,
      backgroundInvertedLight: colors.waverly3,
      highlight: colors.lilac3,
      text: colors.black,
      textLight: colors.waverly1,
      textInverted: colors.white,
      link: colors.blue0,
      border: colors.waverly4,
      borderDark: colors.waverly1,
      icon: colors.lilac5,
    },
    secondary: {
      background: colors.green3,
      backgroundLight: colors.green2,
      backgroundInverted: colors.green5,
      backgroundInvertedLight: colors.green4,
      highlight: colors.green4,
      text: colors.white,
      textLight: colors.green1,
      textInverted: colors.green4,
      link: colors.green1,
      border: colors.green4,
      borderDark: colors.green5,
      icon: colors.green4,
    },
    inverted: {
      background: colors.black,
      backgroundLight: colors.gray6,
      backgroundInverted: colors.white,
      backgroundInvertedLight: colors.gray1,
      highlight: colors.gray1,
      text: colors.white,
      textLight: colors.gray3,
      textInverted: colors.black,
      link: colors.blue2,
      border: colors.gray3,
      borderDark: colors.gray2,
      icon: colors.gray5,
    },
    error: {
      background: colors.red3,
      backgroundLight: colors.red2,
      backgroundInverted: colors.red5,
      backgroundInvertedLight: colors.red4,
      highlight: colors.red4,
      text: colors.white,
      textLight: colors.red1,
      textInverted: colors.red3,
      link: colors.red1,
      border: colors.red4,
      borderDark: colors.red5,
      icon: colors.red4,
    },
  },
  shapes: {
    button: {
      // TODO
    },
    bigButton: {
      // TODO
    },
    smallButton: {
      // TODO
    },
  },
  typography: {
    '4xl': {
      fontSize: 32,
      letterSpacing: -0.41,
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    '3xl-thin': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '300',
      fontFamily: 'SF-Pro-Text-Thin',
    },
    '3xl': {
      fontSize: 22,
      letterSpacing: 0.25,
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    '3xl-medium': {
      fontSize: 22,
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Text-Medium',
    },
    '3xl-bold': {
      fontSize: 22,
      letterSpacing: 0.25,
      fontWeight: '700',
      fontFamily: 'SF-Pro-Text-Bold',
    },
    '3xl-heavy': {
      fontSize: 22,
      letterSpacing: 0.25,
      fontWeight: '800',
      fontFamily: 'SF-Pro-Text-Heavy',
    },
    '2xl-thin': {
      fontSize: 22,
      letterSpacing: 0.25,
      fontWeight: '300',
      fontFamily: 'SF-Pro-Text-Thin',
    },
    '2xl': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    '2xl-medium': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Text-Medium',
    },
    '2xl-bold': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '700',
      fontFamily: 'SF-Pro-Text-Bold',
    },
    '2xl-heavy': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '800',
      fontFamily: 'SF-Pro-Text-Heavy',
    },
    'xl-thin': {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '300',
      fontFamily: 'SF-Pro-Text-Thin',
    },
    xl: {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    'xl-medium': {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Text-Medium',
    },
    'xl-bold': {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '700',
      fontFamily: 'SF-Pro-Text-Bold',
    },
    'xl-heavy': {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '800',
      fontFamily: 'SF-Pro-Text-Heavy',
    },
    'lg-thin': {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '300',
      fontFamily: 'SF-Pro-Text-Thin',
    },
    lg: {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    'lg-medium': {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Text-Medium',
    },
    'lg-bold': {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '700',
      fontFamily: 'SF-Pro-Text-Bold',
    },
    'lg-heavy': {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '800',
      fontFamily: 'SF-Pro-Text-Heavy',
    },
    'md-thin': {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '300',
      fontFamily: 'SF-Pro-Text-Thin',
    },
    md: {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    'md-medium': {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Text-Medium',
    },
    'md-bold': {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '700',
      fontFamily: 'SF-Pro-Text-Bold',
    },
    'md-heavy': {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '800',
      fontFamily: 'SF-Pro-Text-Heavy',
    },
    'sm-thin': {
      fontSize: 12,
      letterSpacing: 0.25,
      fontWeight: '300',
      fontFamily: 'SF-Pro-Text-Thin',
    },
    sm: {
      fontSize: 12,
      letterSpacing: 0.25,
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    'sm-medium': {
      fontSize: 13, // Waverly: bumped this up from 12
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Text-Medium',
    },
    'sm-bold': {
      fontSize: 12,
      letterSpacing: 0.25,
      fontWeight: '700',
      fontFamily: 'SF-Pro-Text-Bold',
    },
    'sm-heavy': {
      fontSize: 12,
      letterSpacing: 0.25,
      fontWeight: '800',
      fontFamily: 'SF-Pro-Text-Heavy',
    },
    'xs-thin': {
      fontSize: 9,
      letterSpacing: 0.25,
      fontWeight: '300',
      fontFamily: 'SF-Pro-Text-Thin',
    },
    xs: {
      fontSize: 9,
      letterSpacing: 0.25,
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    'xs-medium': {
      fontSize: 9,
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Text-Medium',
    },
    'xs-bold': {
      fontSize: 9,
      letterSpacing: 0.25,
      fontWeight: '700',
      fontFamily: 'SF-Pro-Text-Bolc',
    },
    'xs-heavy': {
      fontSize: 9,
      letterSpacing: 0.25,
      fontWeight: '800',
      fontFamily: 'SF-Pro-Text-Heavy',
    },
    'title-2xl': {
      fontSize: 34,
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Display-Medium',
    },
    'title-xl': {
      fontSize: 28,
      letterSpacing: 0.25,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Display-Medium',
    },
    'title-lg': {
      fontSize: 22,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Display-Medium',
    },
    title: {
      fontWeight: '500',
      fontSize: 20,
      letterSpacing: 0.15,
      fontFamily: 'SF-Pro-Display-Medium',
    },
    'title-sm': {
      fontWeight: 'bold',
      fontSize: 17,
      letterSpacing: 0.15,
      fontFamily: 'SF-Pro-Display-Bold',
    },
    'post-text': {
      fontSize: 16, //17,
      letterSpacing: 0.2,
      fontWeight: '400',
      //fontFamily: 'NewYorkMedium-Regular',
    },
    'post-text-lg': {
      fontSize: 22,
      letterSpacing: 0.4,
      fontWeight: '400',
      //fontFamily: 'NewYorkMedium-Regular',
    },
    'button-lg': {
      fontWeight: '500',
      fontSize: 18,
      letterSpacing: 0.5,
      fontFamily: 'SF-Pro-Text-Medium',
    },
    button: {
      fontWeight: '500',
      fontSize: 14,
      letterSpacing: 0.5,
      fontFamily: 'SF-Pro-Text-Medium',
    },
    mono: {
      fontSize: 14,
      fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    },
  },
}

// Theming based on the "Post Types" Figma page from 17 Jul '23
export const newDefaultTheme: Theme = {
  ...oldDefaultTheme,
  palette: {
    ...oldDefaultTheme.palette,
    default: {
      ...oldDefaultTheme.palette.default,
      text: alpha(colors.black, 0.87), // Figma: set to "Dark Text/High Emphasis"
      textInverted: alpha(colors.white, 0.87), // Figma: set to "Dark Text/High Emphasis"
    },
  },
  typography: {
    ...oldDefaultTheme.typography,
    // 'post-text': {
    //   fontSize: 17, // Figma: adjust sizze
    //   letterSpacing: -0.41, // Figma: adjust spacing
    //   fontWeight: '400',
    //   fontFamily: 'NewYorkMedium-Regular',
    // },
    'title-lg': {
      fontSize: 22,
      fontWeight: '500',
      fontFamily: 'SF-Pro-Text-Bold', // Figma: set to bold
    },
    xs: {
      fontSize: 9,
      //letterSpacing: 0.25, // Figma: remove this
      fontWeight: '400',
      fontFamily: 'SF-Pro-Text-Regular',
    },
    'xs-bold': {
      fontSize: 9,
      //letterSpacing: 0.25, // Figma: remove this
      fontWeight: '700',
      fontFamily: 'SF-Pro-Text-Bold', // Figma: set to bold
    },
  },
}

// Default to using the latest Figma theme.
export const defaultTheme = newDefaultTheme

////////////////////////////////////////////////////////////////////////////////

// TODO: design a custom darkTheme.
export const darkTheme: Theme = {
  ...defaultTheme,
  colorScheme: 'dark',
  palette: {
    ...defaultTheme.palette,
    default: {
      background: colors.black,
      backgroundLight: colors.gray7,
      backgroundInverted: colors.white,
      backgroundInvertedLight: colors.gray2,
      highlight: colors.gray6,
      text: colors.white,
      textLight: colors.gray3,
      textInverted: colors.black,
      link: colors.blue3,
      border: colors.gray7,
      borderDark: colors.gray6,
      icon: colors.gray4,

      // non-standard
      textVeryLight: colors.gray4,
      replyLine: colors.gray5,
      replyLineDot: colors.gray6,
      unreadNotifBg: colors.blue7,
      unreadNotifBorder: colors.blue6,
      postCtrl: '#707489',
      brandText: '#0085ff',
      emptyStateIcon: colors.gray4,
    },
    primary: {
      ...defaultTheme.palette.primary,
      textInverted: colors.blue2,
    },
    secondary: {
      ...defaultTheme.palette.secondary,
      textInverted: colors.green2,
    },
    inverted: {
      background: colors.white,
      backgroundLight: colors.gray2,
      backgroundInverted: colors.black,
      backgroundInvertedLight: colors.gray7,
      highlight: colors.gray6,
      text: colors.black,
      textLight: colors.gray5,
      textInverted: colors.white,
      link: colors.blue3,
      border: colors.gray3,
      borderDark: colors.gray4,
      icon: colors.gray1,
    },
  },
}
