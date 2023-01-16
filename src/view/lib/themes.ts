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
      border: colors.gray2,
      icon: colors.gray2,

      // non-standard
      actionLabel: colors.gray4,
      replyLine: colors.gray2,
      replyLineDot: colors.gray3,
      unreadNotifBg: '#ebf6ff',
    },
    primary: {
      background: colors.blue3,
      backgroundLight: colors.blue2,
      text: colors.white,
      textLight: colors.blue0,
      textInverted: colors.blue3,
      link: colors.blue0,
      border: colors.blue4,
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
    h1: {
      fontSize: 48,
      fontWeight: '500',
    },
    h2: {
      fontSize: 34,
      letterSpacing: 0.25,
      fontWeight: '500',
    },
    h3: {
      fontSize: 24,
      fontWeight: '500',
    },
    h4: {
      fontWeight: '500',
      fontSize: 20,
      letterSpacing: 0.15,
    },
    h5: {
      fontWeight: 'bold',
      fontSize: 17,
      letterSpacing: 0.15,
    },
    h6: {
      fontWeight: '400',
      fontSize: 15,
      letterSpacing: 0.15,
    },
    subtitle1: {
      fontSize: 16,
      letterSpacing: 0.15,
    },
    subtitle2: {
      fontWeight: '500',
      fontSize: 14,
      letterSpacing: 0.1,
    },
    body1: {
      fontSize: 17,
      letterSpacing: 0.2,
    },
    body2: {
      fontSize: 14,
      letterSpacing: 0.25,
    },
    button: {
      fontWeight: '500',
      fontSize: 14,
      letterSpacing: 0.5,
    },
    caption: {
      fontSize: 12,
      letterSpacing: 0.4,
    },
    overline1: {
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    overline2: {
      fontSize: 14,
      fontWeight: '600',
    },
    mono1: {
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
      border: colors.gray6,
      icon: colors.gray5,

      // non-standard
      actionLabel: colors.gray3,
      replyLine: colors.gray5,
      replyLineDot: colors.gray6,
      unreadNotifBg: colors.blue5,
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
      icon: colors.gray1,
    },
  },
}
