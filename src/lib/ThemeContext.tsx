import {isWeb} from 'platform/detection'
import React, {ReactNode, createContext, useContext} from 'react'
import {
  AppState,
  TextStyle,
  useColorScheme as useColorScheme_BUGGY,
  ViewStyle,
  ColorSchemeName,
} from 'react-native'
import {darkTheme, defaultTheme} from './themes'

export type ColorScheme = 'light' | 'dark'

export type PaletteColorName =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'inverted'
  | 'error'
export type PaletteColor = {
  background: string
  backgroundLight: string
  text: string
  textLight: string
  textInverted: string
  link: string
  border: string
  borderDark: string
  icon: string
  [k: string]: string
}
export type Palette = Record<PaletteColorName, PaletteColor>

export type ShapeName = 'button' | 'bigButton' | 'smallButton'
export type Shapes = Record<ShapeName, ViewStyle>

export type TypographyVariant =
  | '2xl-thin'
  | '2xl'
  | '2xl-medium'
  | '2xl-bold'
  | '2xl-heavy'
  | 'xl-thin'
  | 'xl'
  | 'xl-medium'
  | 'xl-bold'
  | 'xl-heavy'
  | 'lg-thin'
  | 'lg'
  | 'lg-medium'
  | 'lg-bold'
  | 'lg-heavy'
  | 'md-thin'
  | 'md'
  | 'md-medium'
  | 'md-bold'
  | 'md-heavy'
  | 'sm-thin'
  | 'sm'
  | 'sm-medium'
  | 'sm-bold'
  | 'sm-heavy'
  | 'xs-thin'
  | 'xs'
  | 'xs-medium'
  | 'xs-bold'
  | 'xs-heavy'
  | 'title-2xl'
  | 'title-xl'
  | 'title-lg'
  | 'title'
  | 'title-sm'
  | 'post-text-lg'
  | 'post-text'
  | 'button'
  | 'button-lg'
  | 'mono'
export type Typography = Record<TypographyVariant, TextStyle>

export interface Theme {
  colorScheme: ColorScheme
  palette: Palette
  shapes: Shapes
  typography: Typography
}

export interface ThemeProviderProps {
  children?: ReactNode
  theme?: 'light' | 'dark' | 'system'
}

export const ThemeContext = createContext<Theme>(defaultTheme)

export const useTheme = () => useContext(ThemeContext)

function getTheme(theme: ColorSchemeName) {
  return theme === 'dark' ? darkTheme : defaultTheme
}

/**
 * With RN iOS, we can only "trust" the color scheme reported while the app is
 * active. This is a workaround until the bug is fixed upstream.
 *
 * @see https://github.com/bluesky-social/social-app/pull/1417#issuecomment-1719868504
 * @see https://github.com/facebook/react-native/pull/39439
 */
function useColorScheme_FIXED() {
  const colorScheme = useColorScheme_BUGGY()
  const [currentColorScheme, setCurrentColorScheme] =
    React.useState<ColorSchemeName>(colorScheme)

  React.useEffect(() => {
    // we don't need to be updating state on web
    if (isWeb) return
    const subscription = AppState.addEventListener('change', state => {
      const isActive = state === 'active'
      if (!isActive) return
      setCurrentColorScheme(colorScheme)
    })
    return () => subscription.remove()
  }, [colorScheme])

  return isWeb ? colorScheme : currentColorScheme
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme,
  children,
}) => {
  const colorScheme = useColorScheme_FIXED()
  const themeValue = getTheme(theme === 'system' ? colorScheme : theme)

  return (
    <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
  )
}
