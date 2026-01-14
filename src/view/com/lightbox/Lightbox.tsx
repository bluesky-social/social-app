import {useCallback} from 'react'

import {shareImageModal} from '#/lib/media/manip'
import {useSaveImageToMediaLibrary} from '#/lib/media/save-image'
import {useLightbox, useLightboxControls} from '#/state/lightbox'
import ImageView from './ImageViewing'

export function Lightbox() {
  const {activeLightbox} = useLightbox()
  const {closeLightbox} = useLightboxControls()

  const onClose = useCallback(() => {
    closeLightbox()
  }, [closeLightbox])

  const saveImageToAlbum = useSaveImageToMediaLibrary()

  return (
    <ImageView
      lightbox={activeLightbox}
      onRequestClose={onClose}
      onPressSave={saveImageToAlbum}
      onPressShare={uri => shareImageModal({uri})}
    />
  )
}
