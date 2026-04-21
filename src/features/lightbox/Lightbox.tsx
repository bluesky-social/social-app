import {useCallback} from 'react'

import {shareImageModal} from '#/lib/media/manip'
import {useSaveImageToMediaLibrary} from '#/lib/media/save-image'
import ImageView from '#/features/lightbox/pager/ImagePager'
import {useLightbox, useLightboxControls} from '#/features/lightbox/state'

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
