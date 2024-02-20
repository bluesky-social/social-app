import React from 'react'
import {ColorSchemeName, useColorScheme} from 'react-native'

import {useThemePrefs} from 'state/shell'
import {isWeb} from 'platform/detection'
import {ThemeName, light, dark, dim} from '#/alf/themes'
import * as SystemUI from 'expo-system-ui'

export function useColorModeTheme(): ThemeName {
  const colorScheme = useColorScheme()
  const {colorMode, darkTheme} = useThemePrefs()

  React.useLayoutEffect(() => {
    const theme = getThemeName(colorScheme, colorMode, darkTheme)
    updateDocument(theme)
    SystemUI.setBackgroundColorAsync(getBackgroundColor(theme))
  }, [colorMode, colorScheme, darkTheme])

  return React.useMemo(
    () => getThemeName(colorScheme, colorMode, darkTheme),
    [colorScheme, colorMode, darkTheme],
  )
}

function getThemeName(
  colorScheme: ColorSchemeName,
  colorMode: 'system' | 'light' | 'dark',
  darkTheme?: ThemeName,
) {
  if (
    (colorMode === 'system' && colorScheme === 'light') ||
    colorMode === 'light'
  ) {
    return 'light'
  } else {
    return darkTheme ?? 'dim'
  }
}

function updateDocument(theme: ThemeName) {
  // @ts-ignore web only
  if (isWeb && typeof window !== 'undefined') {
    // @ts-ignore web only
    const html = window.document.documentElement
    // @ts-ignore web only
    const meta = window.document.querySelector('meta[name="theme-color"]')

    // remove any other color mode classes
    html.className = html.className.replace(/(theme)--\w+/g, '')
    html.classList.add(`theme--${theme}`)
    // set color to 'theme-color' meta tag
    meta?.setAttribute('content', getBackgroundColor(theme))
  }
}

function getBackgroundColor(theme: ThemeName): string {
  switch (theme) {
    case 'light':
      return light.atoms.bg.backgroundColor
    case 'dark':
      return dark.atoms.bg.backgroundColor
    case 'dim':
      return dim.atoms.bg.backgroundColor
  }
}
