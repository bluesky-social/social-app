import React from 'react'
import {useColorScheme} from 'react-native'

import {useThemePrefs} from 'state/shell'
import {isWeb} from 'platform/detection'
import {ThemeName} from '#/alf/themes'

export function useColorModeTheme(): ThemeName {
  const colorScheme = useColorScheme()
  const {colorMode, darkTheme} = useThemePrefs()

  return React.useMemo(() => {
    if (
      (colorMode === 'system' && colorScheme === 'light') ||
      colorMode === 'light'
    ) {
      updateDocument('light')
      return 'light'
    } else {
      const themeName = darkTheme ?? 'dim'
      // updateDocument(themeName)
      return themeName
    }
  }, [colorMode, darkTheme, colorScheme])
}

function updateDocument(theme: ThemeName) {
  if (isWeb && typeof window !== 'undefined') {
    const html = window.document.documentElement
    // remove any other color mode classes
    html.className = html.className.replace(/(theme)--\w+/g, '')

    html.classList.add(`theme--${theme}`)
  }
}
