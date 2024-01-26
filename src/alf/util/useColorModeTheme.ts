import {useColorScheme} from 'react-native'

import * as persisted from '#/state/persisted'
import {useThemePrefs} from 'state/shell'

export function useColorModeTheme(
  theme: persisted.Schema['colorMode'],
): 'light' | 'dark' | 'oled' {
  const colorScheme = useColorScheme()
  const {darkTheme} = useThemePrefs()

  if (theme === 'system') {
    return colorScheme as 'light' | 'dark'
  } else if (theme === 'dark') {
    return darkTheme ?? 'dark'
  } else {
    return 'light'
  }
}
