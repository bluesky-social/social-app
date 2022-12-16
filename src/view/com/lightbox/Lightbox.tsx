import React from 'react'
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Swipe, Dir} from '../util/gestures/Swipe'
import {useStores} from '../../../state'
import {useAnimatedValue} from '../../lib/useAnimatedValue'

import * as models from '../../../state/models/shell-ui'

import * as ProfileImageLightbox from './ProfileImage'
import * as ImageLightbox from './Image'
import * as ImagesLightbox from './Images'

export const Lightbox = observer(function Lightbox() {
  const store = useStores()
  const winDim = useWindowDimensions()
  const panX = useAnimatedValue(0)
  const panY = useAnimatedValue(0)

  const onClose = () => {
    store.shell.closeLightbox()
  }
  const onSwipeEnd = (dir: Dir) => {
    if (dir === Dir.Up || dir === Dir.Down) {
      onClose()
    } else if (dir === Dir.Left) {
      store.shell.activeLightbox?.onSwipeLeft()
    } else if (dir === Dir.Right) {
      store.shell.activeLightbox?.onSwipeRight()
    }
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
  } else if (store.shell.activeLightbox?.name === 'images') {
    element = (
      <ImagesLightbox.Component
        {...(store.shell.activeLightbox as models.ImagesLightbox)}
      />
    )
  } else {
    return <View />
  }

  const translateX = Animated.multiply(panX, winDim.width * -1)
  const translateY = Animated.multiply(panY, winDim.height * -1)
  const swipeTransform = {transform: [{translateX}, {translateY}]}
  const swipeOpacity = {
    opacity: panY.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    }),
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Swipe
        panX={panX}
        panY={panY}
        swipeEnabled
        canSwipeLeft={store.shell.activeLightbox.canSwipeLeft}
        canSwipeRight={store.shell.activeLightbox.canSwipeRight}
        canSwipeUp
        canSwipeDown
        hasPriority
        onSwipeEnd={onSwipeEnd}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.bg, swipeOpacity]} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.xIcon}>
            <FontAwesomeIcon icon="x" size={24} style={{color: '#fff'}} />
          </View>
        </TouchableWithoutFeedback>
        <Animated.View style={swipeTransform}>{element}</Animated.View>
      </Swipe>
    </View>
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
