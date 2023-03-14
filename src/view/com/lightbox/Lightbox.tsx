import React from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import ImageView from './ImageViewing'
import {useStores} from 'state/index'
import * as models from 'state/models/ui/shell'
import {saveImageModal} from 'lib/media/manip'
import {ImageSource} from './ImageViewing/@types'

export const Lightbox = observer(function Lightbox() {
  const store = useStores()
  if (!store.shell.isLightboxActive) {
    return null
  }

  const onClose = () => {
    store.shell.closeLightbox()
  }
  const onLongPress = (image: ImageSource) => {
    if (
      typeof image === 'object' &&
      'uri' in image &&
      typeof image.uri === 'string'
    ) {
      saveImageModal({uri: image.uri})
    }
  }

  if (store.shell.activeLightbox?.name === 'profile-image') {
    const opts = store.shell.activeLightbox as models.ProfileImageLightbox
    return (
      <ImageView
        images={[{uri: opts.profileView.avatar}]}
        imageIndex={0}
        visible
        onRequestClose={onClose}
      />
    )
  } else if (store.shell.activeLightbox?.name === 'images') {
    const opts = store.shell.activeLightbox as models.ImagesLightbox
    return (
      <ImageView
        images={opts.uris.map(uri => ({uri}))}
        imageIndex={opts.index}
        visible
        onRequestClose={onClose}
        onLongPress={onLongPress}
      />
    )
  } else {
    return <View />
  }
})
