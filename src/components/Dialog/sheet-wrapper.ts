import {useCallback} from 'react'
import {SystemBars} from 'react-native-edge-to-edge'

import {isIOS} from '#/platform/detection'

/**
 * If we're calling a system API like the image picker that opens a sheet
 * wrap it in this function to make sure the status bar is the correct color.
 */
export function useSheetWrapper() {
  return useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    if (isIOS) {
      const entry = SystemBars.pushStackEntry({
        style: {
          statusBar: 'light',
        },
      })
      const res = await promise
      SystemBars.popStackEntry(entry)
      return res
    } else {
      return await promise
    }
  }, [])
}
