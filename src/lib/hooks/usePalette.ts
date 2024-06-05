import {useMemo} from 'react'
import {TextStyle, ViewStyle} from 'react-native'

import {PaletteColor, PaletteColorName, useTheme} from '../ThemeContext'

export interface UsePaletteValue {
  colors: PaletteColor
  view: ViewStyle
  viewLight: ViewStyle
  btn: ViewStyle
  border: ViewStyle
  borderDark: ViewStyle
  text: TextStyle
  textLight: TextStyle
  textInverted: TextStyle
  link: TextStyle
  icon: TextStyle
}
export function usePalette(color: PaletteColorName): UsePaletteValue {
  const theme = useTheme()
  return useMemo(() => {
    const palette = theme.palette[color]
    return {
      colors: palette,
      view: {
        backgroundColor: palette.background,
      },
      viewLight: {
        backgroundColor: palette.backgroundLight,
      },
      btn: {
        backgroundColor: palette.backgroundLight,
      },
      border: {
        borderColor: palette.border,
      },
      borderDark: {
        borderColor: palette.borderDark,
      },
      text: {
        color: palette.text,
      },
      textLight: {
        color: palette.textLight,
      },
      textInverted: {
        color: palette.textInverted,
      },
      link: {
        color: palette.link,
      },
      icon: {
        color: palette.icon,
      },
    }
  }, [theme, color])
}
