import React, {useCallback, useEffect, useState} from 'react'
import {
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
  Pressable,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useStores} from 'state/index'
import * as models from 'state/models/ui/shell'
import {colors, s} from 'lib/styles'
import ImageDefaultHeader from './ImageViewing/components/ImageDefaultHeader'
import {Text} from '../util/text/Text'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

interface Img {
  uri: string
  alt?: string
}

export const Lightbox = observer(function Lightbox() {
  const store = useStores()

  const onClose = useCallback(() => store.shell.closeLightbox(), [store.shell])

  if (!store.shell.isLightboxActive) {
    return null
  }

  const activeLightbox = store.shell.activeLightbox
  const initialIndex =
    activeLightbox instanceof models.ImagesLightbox ? activeLightbox.index : 0

  let imgs: Img[] | undefined
  if (activeLightbox instanceof models.ProfileImageLightbox) {
    const opts = activeLightbox
    if (opts.profile.avatar) {
      imgs = [{uri: opts.profile.avatar}]
    }
  } else if (activeLightbox instanceof models.ImagesLightbox) {
    const opts = activeLightbox
    imgs = opts.images
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
  const {_} = useLingui()
  const [index, setIndex] = useState<number>(initialIndex)
  const [isAltExpanded, setAltExpanded] = useState(false)

  const canGoLeft = index >= 1
  const canGoRight = index < imgs.length - 1
  const onPressLeft = useCallback(() => {
    if (canGoLeft) {
      setIndex(index - 1)
    }
  }, [index, canGoLeft])
  const onPressRight = useCallback(() => {
    if (canGoRight) {
      setIndex(index + 1)
    }
  }, [index, canGoRight])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPressLeft()
      } else if (e.key === 'ArrowRight') {
        onPressRight()
      }
    },
    [onClose, onPressLeft, onPressRight],
  )

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  return (
    <View style={styles.mask}>
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Close image viewer`)}
        accessibilityHint="Exits image view"
        onAccessibilityEscape={onClose}>
        <View style={styles.imageCenterer}>
          <Image
            accessibilityIgnoresInvertColors
            source={imgs[index]}
            style={styles.image}
            accessibilityLabel={imgs[index].alt}
            accessibilityHint=""
          />
          {canGoLeft && (
            <TouchableOpacity
              onPress={onPressLeft}
              style={[styles.btn, styles.leftBtn]}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Previous image`)}
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
              accessibilityLabel={_(msg`Next image`)}
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
      {imgs[index].alt ? (
        <View style={styles.footer}>
          <Pressable
            accessibilityLabel={_(msg`Expand alt text`)}
            accessibilityHint="If alt text is long, toggles alt text expanded state"
            onPress={() => {
              setAltExpanded(!isAltExpanded)
            }}>
            <Text
              style={s.white}
              numberOfLines={isAltExpanded ? 0 : 3}
              ellipsizeMode="tail">
              {imgs[index].alt}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
  footer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: colors.black,
  },
})
