import {useEffect} from 'react'
import {StatusBar} from 'react-native'

export function useSetLightStatusBar(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
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
