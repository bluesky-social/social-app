import {useCallback} from 'react'
import * as MediaLibrary from 'expo-media-library'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as Toast from '#/components/Toast'
import {IS_NATIVE} from '#/env'
import {saveImageToMediaLibrary} from './manip'

/**
 * Same as `saveImageToMediaLibrary`, but also handles permissions and toasts
 */
export function useSaveImageToMediaLibrary() {
  const {_} = useLingui()
  const [permissionResponse, requestPermission, getPermission] =
    MediaLibrary.usePermissions({
      granularPermissions: ['photo'],
    })
  return useCallback(
    async (uri: string) => {
      if (!IS_NATIVE) {
        throw new Error('useSaveImageToMediaLibrary is native only')
      }

      async function save() {
        try {
          await saveImageToMediaLibrary({uri})

          Toast.show(_(msg`Image saved`))
        } catch (e: any) {
          Toast.show(_(msg`Failed to save image: ${String(e)}`), {
            type: 'error',
          })
        }
      }

      const permission = permissionResponse ?? (await getPermission())

      if (permission.granted) {
        await save()
      } else {
        if (permission.canAskAgain) {
          // request again once
          const askAgain = await requestPermission()
          if (askAgain.granted) {
            await save()
          } else {
            // since we've been explicitly denied, show a toast.
            Toast.show(
              _(
                msg`Images cannot be saved unless permission is granted to access your photo library.`,
              ),
              {type: 'error'},
            )
          }
        } else {
          Toast.show(
            _(
              msg`Permission to access your photo library was denied. Please enable it in your system settings.`,
            ),
            {type: 'error'},
          )
        }
      }
    },
    [permissionResponse, requestPermission, getPermission, _],
  )
}
