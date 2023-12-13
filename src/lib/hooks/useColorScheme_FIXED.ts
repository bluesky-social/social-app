import React from 'react'
import {
  AppState,
  useColorScheme as useColorScheme_BUGGY,
  ColorSchemeName,
} from 'react-native'

import {isWeb} from '#/platform/detection'

/**
 * With RN iOS, we can only "trust" the color scheme reported while the app is
 * active. This is a workaround until the bug is fixed upstream.
 *
 * @see https://github.com/bluesky-social/social-app/pull/1417#issuecomment-1719868504
 * @see https://github.com/facebook/react-native/pull/39439
 */
export function useColorScheme_FIXED() {
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
