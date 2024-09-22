import {Platform} from 'react-native'

import {tokens} from '#/alf'
import {darkPalette, dimPalette, lightPalette} from '#/alf/themes'
import {colors} from './styles'
import type {Theme} from './ThemeContext'

export const defaultTheme: Theme = {
  colorScheme: 'light',
  palette: {
    default: {
      background: lightPalette.white,
      backgroundLight: lightPalette.contrast_25,
      text: lightPalette.black,
      textLight: lightPalette.contrast_700,
      textInverted: lightPalette.white,
      link: lightPalette.primary_500,
      border: lightPalette.contrast_100,
      borderDark: lightPalette.contrast_200,
      icon: lightPalette.contrast_500,

      // non-standard
      textVeryLight: lightPalette.contrast_400,
      replyLine: lightPalette.contrast_100,
      replyLineDot: lightPalette.contrast_200,
      unreadNotifBg: lightPalette.primary_25,
      unreadNotifBorder: lightPalette.primary_100,
      postCtrl: lightPalette.contrast_500,
      brandText: lightPalette.primary_500,
      emptyStateIcon: lightPalette.contrast_300,
      borderLinkHover: lightPalette.contrast_300,
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
      background: darkPalette.black,
      backgroundLight: darkPalette.contrast_50,
      text: darkPalette.white,
      textLight: darkPalette.contrast_700,
      textInverted: darkPalette.black,
      link: darkPalette.primary_500,
      border: darkPalette.contrast_100,
      borderDark: darkPalette.contrast_200,
      icon: darkPalette.contrast_500,
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
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    '2xl': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    '2xl-medium': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    '2xl-bold': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    '2xl-heavy': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: '800',
    },
    'xl-thin': {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    xl: {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    'xl-medium': {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'xl-bold': {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'xl-heavy': {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: '800',
    },
    'lg-thin': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    lg: {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    'lg-medium': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'lg-bold': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'lg-heavy': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: '800',
    },
    'md-thin': {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    md: {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    'md-medium': {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'md-bold': {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'md-heavy': {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: '800',
    },
    'sm-thin': {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    sm: {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    'sm-medium': {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'sm-bold': {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'sm-heavy': {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: '800',
    },
    'xs-thin': {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    xs: {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    'xs-medium': {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'xs-bold': {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'xs-heavy': {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: '800',
    },

    'title-2xl': {
      fontSize: 34,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'title-xl': {
      fontSize: 28,
      letterSpacing: tokens.TRACKING,
      fontWeight: '600',
    },
    'title-lg': {
      fontSize: 22,
      fontWeight: '600',
    },
    title: {
      fontWeight: '600',
      fontSize: 20,
      letterSpacing: tokens.TRACKING,
    },
    'title-sm': {
      fontWeight: '600',
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
    },
    'post-text': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    'post-text-lg': {
      fontSize: 20,
      letterSpacing: tokens.TRACKING,
      fontWeight: '400',
    },
    'button-lg': {
      fontWeight: '600',
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
    },
    button: {
      fontWeight: '600',
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
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
      background: darkPalette.black,
      backgroundLight: darkPalette.contrast_25,
      text: darkPalette.white,
      textLight: darkPalette.contrast_600,
      textInverted: darkPalette.black,
      link: darkPalette.primary_500,
      border: darkPalette.contrast_100,
      borderDark: darkPalette.contrast_200,
      icon: darkPalette.contrast_500,

      // non-standard
      textVeryLight: darkPalette.contrast_400,
      replyLine: darkPalette.contrast_200,
      replyLineDot: darkPalette.contrast_200,
      unreadNotifBg: darkPalette.primary_25,
      unreadNotifBorder: darkPalette.primary_100,
      postCtrl: darkPalette.contrast_500,
      brandText: darkPalette.primary_500,
      emptyStateIcon: darkPalette.contrast_300,
      borderLinkHover: darkPalette.contrast_300,
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
      background: lightPalette.white,
      backgroundLight: lightPalette.contrast_50,
      text: lightPalette.black,
      textLight: lightPalette.contrast_700,
      textInverted: lightPalette.white,
      link: lightPalette.primary_500,
      border: lightPalette.contrast_100,
      borderDark: lightPalette.contrast_200,
      icon: lightPalette.contrast_500,
    },
  },
}

export const dimTheme: Theme = {
  ...darkTheme,
  palette: {
    ...darkTheme.palette,
    default: {
      ...darkTheme.palette.default,
      background: dimPalette.black,
      backgroundLight: dimPalette.contrast_25,
      text: dimPalette.white,
      textLight: dimPalette.contrast_700,
      textInverted: dimPalette.black,
      link: dimPalette.primary_500,
      border: dimPalette.contrast_100,
      borderDark: dimPalette.contrast_200,
      icon: dimPalette.contrast_500,

      // non-standard
      textVeryLight: dimPalette.contrast_400,
      replyLine: dimPalette.contrast_200,
      replyLineDot: dimPalette.contrast_200,
      unreadNotifBg: dimPalette.primary_25,
      unreadNotifBorder: dimPalette.primary_100,
      postCtrl: dimPalette.contrast_500,
      brandText: dimPalette.primary_500,
      emptyStateIcon: dimPalette.contrast_300,
      borderLinkHover: dimPalette.contrast_300,
    },
  },
}
