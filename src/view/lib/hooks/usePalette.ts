import {TextStyle, ViewStyle} from 'react-native'
import {useTheme, PaletteColorName, PaletteColor} from '../ThemeContext'

export interface UsePaletteValue {
  colors: PaletteColor
  view: ViewStyle
  border: ViewStyle
  text: TextStyle
  textLight: TextStyle
  textInverted: TextStyle
  link: TextStyle
}
export function usePalette(color: PaletteColorName): UsePaletteValue {
  const palette = useTheme().palette[color]
  return {
    colors: palette,
    view: {
      backgroundColor: palette.background,
    },
    border: {
      borderWidth: 1,
      borderColor: palette.border,
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
  }
}
