import React from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import ImageView from './ImageViewing'
import {useStores} from '../../../state'
import * as models from '../../../state/models/shell-ui'
import {saveImageModal} from '../util/images/saveImageModal'

export const Lightbox = observer(function Lightbox() {
  const store = useStores()
  if (!store.shell.isLightboxActive) {
    return null
  }

  const onClose = () => {
    store.shell.closeLightbox()
  }
  const onLongPress = ({uri}: {uri: string}) => {
    store.shell.openModal(saveImageModal({uri}))
  }

  if (store.shell.activeLightbox?.name === 'profile-image') {
    const opts = store.shell.activeLightbox as models.ProfileImageLightbox
    return (
      <>
        <ImageView
          images={[{uri: opts.profileView.avatar}]}
          imageIndex={0}
          visible
          onRequestClose={onClose}
          presentationStyle="formSheet"
        />
      </>
    )
  } else if (store.shell.activeLightbox?.name === 'images') {
    const opts = store.shell.activeLightbox as models.ImagesLightbox
    return (
      <>
        <ImageView
          images={opts.uris.map(uri => ({uri}))}
          imageIndex={opts.index}
          visible
          onRequestClose={onClose}
          onLongPress={onLongPress}
        />
      </>
    )
  } else {
    return <View />
  }
})
