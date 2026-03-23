import {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {AccessibilityInfo} from 'react-native'

import {IS_WEB} from '#/env'
import {PlatformInfo} from '../../modules/expo-bluesky-swiss-army'

const Context = createContext({
  reduceMotionEnabled: false,
  screenReaderEnabled: false,
})
Context.displayName = 'A11yContext'

export function useA11y() {
  return useContext(Context)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(() =>
    PlatformInfo.getIsReducedMotionEnabled(),
  )
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)

  useEffect(() => {
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

  const ctx = useMemo(() => {
    return {
      reduceMotionEnabled,
      /**
       * Always returns true on web. For now, we're using this for mobile a11y,
       * so we reset to false on web.
       *
       * @see https://github.com/necolas/react-native-web/discussions/2072
       */
      screenReaderEnabled: IS_WEB ? false : screenReaderEnabled,
    }
  }, [reduceMotionEnabled, screenReaderEnabled])

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
