import {useCallback} from 'react'
import * as MediaLibrary from 'expo-media-library'
import {t} from '@lingui/macro'

import {isNative} from '#/platform/detection'
import * as Toast from '#/view/com/util/Toast'
import {saveImageToMediaLibrary} from './manip'

/**
 * Same as `saveImageToMediaLibrary`, but also handles permissions and toasts
 */
export function useSaveImageToMediaLibrary() {
  const [permissionResponse, requestPermission, getPermission] =
    MediaLibrary.usePermissions({
      granularPermissions: ['photo'],
    })
  return useCallback(
    async (uri: string) => {
      if (!isNative) {
        throw new Error('useSaveImageToMediaLibrary is native only')
      }

      async function save() {
        try {
          await saveImageToMediaLibrary({uri})
          Toast.show(t`Image saved`)
        } catch (e: any) {
          Toast.show(t`Failed to save image: ${String(e)}`, 'xmark')
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
              t`Images cannot be saved unless permission is granted to access your photo library.`,
              'xmark',
            )
          }
        } else {
          Toast.show(
            t`Permission to access your photo library was denied. Please enable it in your system settings.`,
            'xmark',
          )
        }
      }
    },
    [permissionResponse, requestPermission, getPermission],
  )
}
