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
      fontWeight: palette.isLowContrast ? '500' : undefined,
    },
    textLight: {
      color: palette.textLight,
      fontWeight: palette.isLowContrast ? '500' : undefined,
    },
    textInverted: {
      color: palette.textInverted,
      fontWeight: palette.isLowContrast ? '500' : undefined,
    },
    link: {
      color: palette.link,
      fontWeight: palette.isLowContrast ? '500' : undefined,
    },
  }
}
