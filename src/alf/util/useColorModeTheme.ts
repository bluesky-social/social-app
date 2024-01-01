import {useColorScheme} from 'react-native'

import * as persisted from '#/state/persisted'

export function useColorModeTheme(
  theme: persisted.Schema['colorMode'],
): 'light' | 'dark' {
  const colorScheme = useColorScheme()
  return (theme === 'system' ? colorScheme : theme) || 'light'
}
