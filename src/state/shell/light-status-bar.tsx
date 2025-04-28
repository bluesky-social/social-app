import {useEffect} from 'react'
import {SystemBars} from 'react-native-edge-to-edge'

export function useSetLightStatusBar(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      const entry = SystemBars.pushStackEntry({
        style: {
          statusBar: 'light',
        },
      })
      return () => {
        SystemBars.popStackEntry(entry)
      }
    }
  }, [enabled])
}
