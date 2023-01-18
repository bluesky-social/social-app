import React from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import ImageView from 'react-native-image-viewing'
import {useStores} from '../../../state'

import * as models from '../../../state/models/shell-ui'

export const Lightbox = observer(function Lightbox() {
  const store = useStores()
  const onClose = () => {
    store.shell.closeLightbox()
  }

  if (!store.shell.isLightboxActive) {
    return <View />
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
      />
    )
  } else {
    return <View />
  }
})
