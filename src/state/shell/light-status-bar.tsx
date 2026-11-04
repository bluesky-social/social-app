import {useEffect} from 'react'
import {StatusBar} from 'react-native'

import {IS_NATIVE} from '#/env'

export function useSetLightStatusBar(enabled: boolean) {
  useEffect(() => {
    // react-native-web's StatusBar has no stack API
    if (enabled && IS_NATIVE) {
      const entry = StatusBar.pushStackEntry({
        barStyle: 'light-content',
        animated: true,
      })
      return () => {
        StatusBar.popStackEntry(entry)
      }
    }
  }, [enabled])
}
