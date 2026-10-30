import {useCallback} from 'react'

import {shareImageModal} from '#/lib/media/manip'
import {useSaveImageToMediaLibrary} from '#/lib/media/save-image'
import ImageView from '#/components/Lightbox/pager/ImagePager'
import {useLightbox, useLightboxControls} from '#/components/Lightbox/state'

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
      onPressSave={uri => void saveImageToAlbum(uri)}
      onPressShare={uri => void shareImageModal({uri})}
    />
  )
}
