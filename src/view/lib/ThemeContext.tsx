import React, {createContext, useContext, useMemo} from 'react'
import {TextStyle, useColorScheme, ViewStyle} from 'react-native'
import {darkTheme, defaultTheme} from './themes'

export type ColorScheme = 'light' | 'dark'

export type PaletteColorName =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'inverted'
  | 'error'
export type PaletteColor = {
  isLowContrast: boolean
  background: string
  backgroundLight: string
  text: string
  textLight: string
  textInverted: string
  link: string
  border: string
  icon: string
}
export type Palette = Record<PaletteColorName, PaletteColor>

export type ShapeName = 'button' | 'bigButton' | 'smallButton'
export type Shapes = Record<ShapeName, ViewStyle>

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'button'
  | 'caption'
  | 'overline'
export type Typography = Record<TypographyVariant, TextStyle>

export interface Theme {
  colorScheme: ColorScheme
  palette: Palette
  shapes: Shapes
  typography: Typography
}

export interface ThemeProviderProps {
  theme?: ColorScheme
}

export const ThemeContext = createContext<Theme>(defaultTheme)

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme,
  children,
}) => {
  const colorScheme = useColorScheme()

  const value = useMemo(
    () => ((theme || colorScheme) === 'dark' ? darkTheme : defaultTheme),
    [colorScheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
