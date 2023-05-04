import React, {useCallback, useEffect} from 'react'
import {
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useStores} from 'state/index'
import * as models from 'state/models/ui/shell'
import {colors} from 'lib/styles'
import ImageDefaultHeader from './ImageViewing/components/ImageDefaultHeader'

interface Img {
  uri: string
}

export const Lightbox = observer(function Lightbox() {
  const store = useStores()
  if (!store.shell.isLightboxActive) {
    return null
  }

  const activeLightbox = store.shell.activeLightbox
  const initialIndex =
    activeLightbox instanceof models.ImagesLightbox ? activeLightbox.index : 0

  const onClose = () => store.shell.closeLightbox()

  let imgs: Img[] | undefined
  if (activeLightbox instanceof models.ProfileImageLightbox) {
    const opts = activeLightbox
    if (opts.profileView.avatar) {
      imgs = [{uri: opts.profileView.avatar}]
    }
  } else if (activeLightbox instanceof models.ImagesLightbox) {
    const opts = activeLightbox
    imgs = opts.uris.map(uri => ({uri}))
  }

  if (!imgs) {
    return null
  }

  return (
    <LightboxInner imgs={imgs} initialIndex={initialIndex} onClose={onClose} />
  )
})

function LightboxInner({
  imgs,
  initialIndex = 0,
  onClose,
}: {
  imgs: Img[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = React.useState<number>(initialIndex)

  const canGoLeft = index >= 1
  const canGoRight = index < imgs.length - 1
  const onPressLeft = () => {
    if (canGoLeft) {
      setIndex(index - 1)
    }
  }
  const onPressRight = () => {
    if (canGoRight) {
      setIndex(index + 1)
    }
  }

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onEscape])

  return (
    <View style={styles.mask}>
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close image viewer"
        accessibilityHint="Exits image view"
        onAccessibilityEscape={onClose}>
        <View style={styles.imageCenterer}>
          <Image
            accessibilityIgnoresInvertColors
            source={imgs[index]}
            style={styles.image}
          />
          {canGoLeft && (
            <TouchableOpacity
              onPress={onPressLeft}
              style={[styles.btn, styles.leftBtn]}
              accessibilityRole="button"
              accessibilityLabel="Previous image"
              accessibilityHint="">
              <FontAwesomeIcon
                icon="angle-left"
                style={styles.icon}
                size={40}
              />
            </TouchableOpacity>
          )}
          {canGoRight && (
            <TouchableOpacity
              onPress={onPressRight}
              style={[styles.btn, styles.rightBtn]}
              accessibilityRole="button"
              accessibilityLabel="Next image"
              accessibilityHint="">
              <FontAwesomeIcon
                icon="angle-right"
                style={styles.icon}
                size={40}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.closeBtn}>
        <ImageDefaultHeader onRequestClose={onClose} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000c',
  },
  imageCenterer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  icon: {
    color: colors.white,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  btn: {
    position: 'absolute',
    backgroundColor: '#000',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  leftBtn: {
    left: 30,
    top: '50%',
  },
  rightBtn: {
    position: 'absolute',
    right: 30,
    top: '50%',
  },
})
