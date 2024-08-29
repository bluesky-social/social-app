import React from 'react'
import {AccessibilityInfo} from 'react-native'

import {isWeb} from '#/platform/detection'
import {PlatformInfo} from '../../modules/expo-bluesky-swiss-army'

const Context = React.createContext({
  reduceMotionEnabled: false,
  screenReaderEnabled: false,
})

export function useA11y() {
  return React.useContext(Context)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = React.useState(() =>
    PlatformInfo.getIsReducedMotionEnabled(),
  )
  const [screenReaderEnabled, setScreenReaderEnabled] = React.useState(false)

  React.useEffect(() => {
    const reduceMotionChangedSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        setReduceMotionEnabled(enabled)
      },
    )
    const screenReaderChangedSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      enabled => {
        setScreenReaderEnabled(enabled)
      },
    )

    ;(async () => {
      const [_reduceMotionEnabled, _screenReaderEnabled] = await Promise.all([
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isScreenReaderEnabled(),
      ])
      setReduceMotionEnabled(_reduceMotionEnabled)
      setScreenReaderEnabled(_screenReaderEnabled)
    })()

    return () => {
      reduceMotionChangedSubscription.remove()
      screenReaderChangedSubscription.remove()
    }
  }, [])

  const ctx = React.useMemo(() => {
    return {
      reduceMotionEnabled,
      /**
       * Always returns true on web. For now, we're using this for mobile a11y,
       * so we reset to false on web.
       *
       * @see https://github.com/necolas/react-native-web/discussions/2072
       */
      screenReaderEnabled: isWeb ? false : screenReaderEnabled,
    }
  }, [reduceMotionEnabled, screenReaderEnabled])

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
