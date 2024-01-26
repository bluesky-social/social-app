import React from 'react'
import {useColorScheme} from 'react-native'

import * as persisted from '#/state/persisted'
import {useThemePrefs} from 'state/shell'
import {isWeb} from 'platform/detection'

export function useColorModeTheme(
  theme: persisted.Schema['colorMode'],
): 'light' | 'dark' | 'oled' {
  const colorScheme = useColorScheme()
  const {darkTheme} = useThemePrefs()

  return React.useMemo(() => {
    if ((theme === 'system' && colorScheme === 'light') || theme === 'light') {
      updateDocument('light')
      return 'light'
    } else {
      const themeName = darkTheme ?? 'dark'
      updateDocument(themeName)
      return themeName
    }
  }, [theme, darkTheme, colorScheme])
}

function updateDocument(theme: string) {
  if (isWeb && typeof window !== 'undefined') {
    const html = window.document.documentElement
    // remove any other color mode classes
    html.className = html.className.replace(/(theme)--\w+/g, '')

    html.classList.add(`theme--${theme}`)
  }
}
