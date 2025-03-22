import React from 'react'
import * as MediaLibrary from 'expo-media-library'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {saveImageToMediaLibrary, shareImageModal} from '#/lib/media/manip'
import {useLightbox, useLightboxControls} from '#/state/lightbox'
import * as Toast from '../util/Toast'
import ImageView from './ImageViewing'

export function Lightbox() {
  const {activeLightbox} = useLightbox()
  const {closeLightbox} = useLightboxControls()

  const onClose = React.useCallback(() => {
    closeLightbox()
  }, [closeLightbox])

  const {_} = useLingui()
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  })
  const saveImageToAlbumWithToasts = React.useCallback(
    async (uri: string) => {
      if (!permissionResponse || permissionResponse.granted === false) {
        Toast.show(
          _(msg`Permission to access camera roll is required.`),
          'info',
        )
        if (permissionResponse?.canAskAgain) {
          requestPermission()
        } else {
          Toast.show(
            _(
              msg`Permission to access camera roll was denied. Please enable it in your system settings.`,
            ),
            'xmark',
          )
        }
        return
      }
      try {
        await saveImageToMediaLibrary({uri})
        Toast.show(_(msg`Image saved`))
      } catch (e: any) {
        Toast.show(_(msg`Failed to save image: ${String(e)}`), 'xmark')
      }
    },
    [permissionResponse, requestPermission, _],
  )

  return (
    <ImageView
      lightbox={activeLightbox}
      onRequestClose={onClose}
      onPressSave={saveImageToAlbumWithToasts}
      onPressShare={uri => shareImageModal({uri})}
    />
  )
}
