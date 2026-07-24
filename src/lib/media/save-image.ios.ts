import {useCallback} from 'react'
import {useLingui} from '@lingui/react/macro'

import * as Toast from '#/components/Toast'
import {IS_NATIVE} from '#/env'
import {saveImageToMediaLibrary} from './manip'

/**
 * Same as `saveImageToMediaLibrary`, but also handles permissions and toasts
 *
 * iOS doesn't not require permissions to save images to the media library,
 * so this file is platform-split as it's much simpler than the Android version.
 */
export function useSaveImageToMediaLibrary() {
  const {t: l} = useLingui()
  return useCallback(
    async (uri: string) => {
      if (!IS_NATIVE) {
        throw new Error('useSaveImageToMediaLibrary is native only')
      }

      try {
        await saveImageToMediaLibrary({uri})
        Toast.show(l`Image saved`)
      } catch (e: any) {
        Toast.show(l`Failed to save image: ${String(e)}`, {type: 'error'})
      }
    },
    [l],
  )
}
