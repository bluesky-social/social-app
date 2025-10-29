import {useCallback} from 'react'
import {t} from '@lingui/macro'

import {isNative} from '#/platform/detection'
import * as Toast from '#/components/Toast'
import {saveImageToMediaLibrary} from './manip'

/**
 * Same as `saveImageToMediaLibrary`, but also handles permissions and toasts
 *
 * iOS doesn't not require permissions to save images to the media library,
 * so this file is platform-split as it's much simpler than the Android version.
 */
export function useSaveImageToMediaLibrary() {
  return useCallback(async (uri: string) => {
    if (!isNative) {
      throw new Error('useSaveImageToMediaLibrary is native only')
    }

    try {
      await saveImageToMediaLibrary({uri})
      Toast.show(t`Image saved`)
    } catch (e: any) {
      Toast.show(t`Failed to save image: ${String(e)}`, {type: 'error'})
    }
  }, [])
}
