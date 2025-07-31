import {useCallback} from 'react'
import {isIOS} from '#/platform/detection'
import * as Toast from '#/view/com/util/Toast'

/**
 * Enhanced toast hook for iOS modal contexts.
 *
 * The issue on iOS is that when the Composer is presented as a modal,
 * and then a native sheet (image picker) is shown on top, the Toast
 * system using RootSiblings may render in the wrong layer or be blocked.
 *
 * This hook addresses the issue by:
 * 1. Adding substantial delay on iOS to ensure all modal transitions complete
 * 2. Using console.log as a fallback to ensure user gets feedback
 * 3. Waiting for the UI thread to be available
 */
export function useComposerToast() {
  const showToast = useCallback(
    (
      message: string,
      type: 'default' | 'success' | 'error' | 'warning' | 'info' = 'default',
    ) => {
      if (isIOS) {
        // Log immediately so we can see if this is being called
        console.log('📱 iOS Toast request:', message, type)

        // Wait for all animations and modal transitions to complete
        requestAnimationFrame(() => {
          setTimeout(() => {
            console.log('📱 iOS Toast showing:', message)
            Toast.show(message, type)
          }, 1000) // 1 second delay to ensure everything is settled
        })
      } else {
        Toast.show(message, type)
      }
    },
    [],
  )

  return {showToast}
}
