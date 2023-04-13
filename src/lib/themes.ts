import {Platform} from 'react-native'
import type {Theme} from './ThemeContext'
import {colors} from './styles'

export const defaultTheme: Theme = {
  colorScheme: 'light',
  palette: {
    default: {
      background: colors.white,
      backgroundLight: colors.gray1,
      text: colors.black,
      textLight: colors.gray5,
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
      background: colors.blue3,
      backgroundLight: colors.blue2,
      text: colors.white,
      textLight: colors.blue0,
      textInverted: colors.blue3,
      link: colors.blue0,
      border: colors.blue4,
      borderDark: colors.blue5,
      icon: colors.blue4,
    },
    secondary: {
      background: colors.green3,
      backgroundLight: colors.green2,
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
    '2xl-thin': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '300',
    },
    '2xl': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '400',
    },
    '2xl-medium': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    '2xl-bold': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '700',
    },
    '2xl-heavy': {
      fontSize: 18,
      letterSpacing: 0.25,
      fontWeight: '800',
    },
    'xl-thin': {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '300',
    },
    xl: {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '400',
    },
    'xl-medium': {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    'xl-bold': {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '700',
    },
    'xl-heavy': {
      fontSize: 17,
      letterSpacing: 0.25,
      fontWeight: '800',
    },
    'lg-thin': {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '300',
    },
    lg: {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '400',
    },
    'lg-medium': {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    'lg-bold': {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '700',
    },
    'lg-heavy': {
      fontSize: 16,
      letterSpacing: 0.25,
      fontWeight: '800',
    },
    'md-thin': {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '300',
    },
    md: {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '400',
    },
    'md-medium': {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    'md-bold': {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '700',
    },
    'md-heavy': {
      fontSize: 15,
      letterSpacing: 0.25,
      fontWeight: '800',
    },
    'sm-thin': {
      fontSize: 14,
      letterSpacing: 0.25,
      fontWeight: '300',
    },
    sm: {
      fontSize: 14,
      letterSpacing: 0.25,
      fontWeight: '400',
    },
    'sm-medium': {
      fontSize: 14,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    'sm-bold': {
      fontSize: 14,
      letterSpacing: 0.25,
      fontWeight: '700',
    },
    'sm-heavy': {
      fontSize: 14,
      letterSpacing: 0.25,
      fontWeight: '800',
    },
    'xs-thin': {
      fontSize: 13,
      letterSpacing: 0.25,
      fontWeight: '300',
    },
    xs: {
      fontSize: 13,
      letterSpacing: 0.25,
      fontWeight: '400',
    },
    'xs-medium': {
      fontSize: 13,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    'xs-bold': {
      fontSize: 13,
      letterSpacing: 0.25,
      fontWeight: '700',
    },
    'xs-heavy': {
      fontSize: 13,
      letterSpacing: 0.25,
      fontWeight: '800',
    },

    'title-2xl': {
      fontSize: 34,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    'title-xl': {
      fontSize: 28,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    'title-lg': {
      fontSize: 22,
      fontWeight: '500',
    },
    title: {
      fontWeight: '500',
      fontSize: 20,
      letterSpacing: 0.15,
    },
    'title-sm': {
      fontWeight: 'bold',
      fontSize: 17,
      letterSpacing: 0.15,
    },
    'post-text': {
      fontSize: 16,
      letterSpacing: 0.2,
      fontWeight: '400',
    },
    'post-text-lg': {
      fontSize: 22,
      letterSpacing: 0.4,
      fontWeight: '400',
    },
    'button-lg': {
      fontWeight: '500',
      fontSize: 18,
      letterSpacing: 0.5,
    },
    button: {
      fontWeight: '500',
      fontSize: 14,
      letterSpacing: 0.5,
    },
    mono: {
      fontSize: 14,
      fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    },
  },
}

export const darkTheme: Theme = {
  ...defaultTheme,
  colorScheme: 'dark',
  palette: {
    ...defaultTheme.palette,
    default: {
      background: colors.gray8,
      backgroundLight: colors.gray6,
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
      postCtrl: '#61657A',
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
