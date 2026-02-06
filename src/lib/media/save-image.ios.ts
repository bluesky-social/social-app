import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
  const {_} = useLingui()
  return useCallback(
    async ({uri, baseSaveName}: {uri: string; baseSaveName?: string}) => {
      if (!IS_NATIVE) {
        throw new Error('useSaveImageToMediaLibrary is native only')
      }

      try {
        await saveImageToMediaLibrary({uri, baseSaveName})
        Toast.show(_(msg`Image saved`))
      } catch (e: any) {
        Toast.show(_(msg`Failed to save image: ${String(e)}`), {type: 'error'})
      }
    },
    [_],
  )
}
