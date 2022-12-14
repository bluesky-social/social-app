import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useStores} from '../../../state'

import * as models from '../../../state/models/shell-ui'

import * as ProfileImageLightbox from './ProfileImage'
import * as ImageLightbox from './Image'

export const Lightbox = observer(function Lightbox() {
  const store = useStores()

  const onClose = () => {
    store.shell.closeLightbox()
  }

  if (!store.shell.isLightboxActive) {
    return <View />
  }

  let element
  if (store.shell.activeLightbox?.name === 'profile-image') {
    element = (
      <ProfileImageLightbox.Component
        {...(store.shell.activeLightbox as models.ProfileImageLightbox)}
      />
    )
  } else if (store.shell.activeLightbox?.name === 'image') {
    element = (
      <ImageLightbox.Component
        {...(store.shell.activeLightbox as models.ImageLightbox)}
      />
    )
  } else {
    return <View />
  }

  return (
    <>
      <TouchableOpacity style={styles.bg} onPress={onClose} />
      <TouchableOpacity style={styles.xIcon} onPress={onClose}>
        <FontAwesomeIcon icon="x" size={24} style={{color: '#fff'}} />
      </TouchableOpacity>
      {element}
    </>
  )
})

const styles = StyleSheet.create({
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    opacity: 0.9,
  },
  xIcon: {
    position: 'absolute',
    top: 30,
    right: 30,
  },
  container: {
    position: 'absolute',
  },
})
