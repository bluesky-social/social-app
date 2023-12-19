import * as persisted from '#/state/persisted'
import {useColorScheme_FIXED} from '#/lib/hooks/useColorScheme_FIXED'

export function useColorModeTheme(
  theme: persisted.Schema['colorMode'],
): 'light' | 'dark' {
  const colorScheme = useColorScheme_FIXED()
  return (theme === 'system' ? colorScheme : theme) || 'light'
}
