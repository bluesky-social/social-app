import {useCallback} from 'react'

import {useDialogStateControlContext} from '#/state/dialogs'

/**
 * If we're calling a system API like the image picker that opens a sheet
 * wrap it in this function to make sure the status bar is the correct color.
 */
export function useSheetWrapper() {
  const {setFullyExpandedCount} = useDialogStateControlContext()
  return useCallback(
    async <T>(promise: Promise<T>): Promise<T> => {
      setFullyExpandedCount(c => c + 1)
      const res = await promise
      setFullyExpandedCount(c => c - 1)
      return res
    },
    [setFullyExpandedCount],
  )
}
