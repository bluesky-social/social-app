import React from 'react'

import {choose} from '#/lib/functions'
import {useTheme} from '#/lib/ThemeContext'

export function useCustomPalette<T>({light, dark}: {light: T; dark: T}) {
  const theme = useTheme()
  return React.useMemo(() => {
    return choose<T, Record<string, T>>(theme.colorScheme, {
      dark,
      light,
    })
  }, [theme.colorScheme, dark, light])
}
