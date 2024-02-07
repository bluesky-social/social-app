import React from 'react'
import {useColorScheme} from 'react-native'

import {useThemePrefs} from 'state/shell'
import {isWeb} from 'platform/detection'
import {ThemeName, light, dark, dim} from '#/alf/themes'
import * as SystemUI from 'expo-system-ui'

export function useColorModeTheme(): ThemeName {
  const colorScheme = useColorScheme()
  const {colorMode, darkTheme} = useThemePrefs()
  const [themeName, setThemeName] = React.useState<ThemeName>('light')

  React.useLayoutEffect(() => {
    if (
      (colorMode === 'system' && colorScheme === 'light') ||
      colorMode === 'light'
    ) {
      updateDocument('light')
      updateSystemBackground('light')
      setThemeName('light')
    } else {
      const theme = darkTheme ?? 'dim'
      updateDocument(theme)
      updateSystemBackground(theme)
      setThemeName(theme)
    }
  }, [colorMode, colorScheme, darkTheme])

  return themeName
}

function updateDocument(theme: ThemeName) {
  // @ts-ignore web only
  if (isWeb && typeof window !== 'undefined') {
    // @ts-ignore web only
    const html = window.document.documentElement
    // remove any other color mode classes
    html.className = html.className.replace(/(theme)--\w+/g, '')

    html.classList.add(`theme--${theme}`)
  }
}

function updateSystemBackground(theme: ThemeName) {
  switch (theme) {
    case 'light':
      SystemUI.setBackgroundColorAsync(light.atoms.bg.backgroundColor)
      break
    case 'dark':
      SystemUI.setBackgroundColorAsync(dark.atoms.bg.backgroundColor)
      break
    case 'dim':
      SystemUI.setBackgroundColorAsync(dim.atoms.bg.backgroundColor)
      break
  }
}
