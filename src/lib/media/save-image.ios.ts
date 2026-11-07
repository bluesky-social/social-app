import {useLingui} from '@lingui/react/macro'

import {requestPermissionsAsync} from '#/lib/media/media-library'
import * as Toast from '#/components/Toast'
import {IS_NATIVE} from '#/env'
import {saveImageToMediaLibrary} from './manip'

/**
 * Same as `saveImageToMediaLibrary`, but also handles permissions and toasts
 *
 * iOS only needs add-only access to save images to the media library.
 */
export function useSaveImageToMediaLibrary() {
  const {t: l} = useLingui()
  return async (uri: string) => {
    if (!IS_NATIVE) {
      throw new Error('useSaveImageToMediaLibrary is native only')
    }

    try {
      // Asset.create requires permission to be granted before it is called.
      const permission = await requestPermissionsAsync(true)
      if (!permission.granted) {
        Toast.show(
          l`Permission to access your photo library was denied. Please enable it in your system settings.`,
          {type: 'error'},
        )
        return
      }

      await saveImageToMediaLibrary({uri})
      Toast.show(l`Image saved`)
    } catch (e: unknown) {
      Toast.show(l`Failed to save image: ${String(e)}`, {type: 'error'})
    }
  }
}
