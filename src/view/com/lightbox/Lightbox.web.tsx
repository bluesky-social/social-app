import React, {useCallback, useEffect, useState} from 'react'
import {
  Image,
  ImageStyle,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebBodyScrollLock} from '#/lib/hooks/useWebBodyScrollLock'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {colors, s} from '#/lib/styles'
import {useLightbox, useLightboxControls} from '#/state/lightbox'
import {Text} from '../util/text/Text'
import ImageDefaultHeader from './ImageViewing/components/ImageDefaultHeader'

interface Img {
  uri: string
  alt?: string
}

export function Lightbox() {
  const {activeLightbox} = useLightbox()
  const {closeLightbox} = useLightboxControls()
  const isActive = !!activeLightbox
  useWebBodyScrollLock(isActive)

  if (!isActive) {
    return null
  }

  const initialIndex =
    activeLightbox.type === 'images' ? activeLightbox.index : 0

  let imgs: Img[] | undefined
  if (activeLightbox.type === 'profile-image') {
    const opts = activeLightbox
    if (opts.profile.avatar) {
      imgs = [{uri: opts.profile.avatar}]
    }
  } else if (activeLightbox.type === 'images') {
    const opts = activeLightbox
    imgs = opts.images
  }

  if (!imgs) {
    return null
  }

  return (
    <LightboxInner
      imgs={imgs}
      initialIndex={initialIndex}
      onClose={closeLightbox}
    />
  )
}

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

  const {isTabletOrDesktop} = useWebMediaQueries()
  const btnStyle = React.useMemo(() => {
    return isTabletOrDesktop ? styles.btnTablet : styles.btnMobile
  }, [isTabletOrDesktop])
  const iconSize = React.useMemo(() => {
    return isTabletOrDesktop ? 32 : 24
  }, [isTabletOrDesktop])

  return (
    <View style={styles.mask}>
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Close image viewer`)}
        accessibilityHint={_(msg`Exits image view`)}
        onAccessibilityEscape={onClose}>
        <View style={styles.imageCenterer}>
          <Image
            accessibilityIgnoresInvertColors
            source={imgs[index]}
            style={styles.image as ImageStyle}
            accessibilityLabel={imgs[index].alt}
            accessibilityHint=""
          />
          {canGoLeft && (
            <TouchableOpacity
              onPress={onPressLeft}
              style={[
                styles.btn,
                btnStyle,
                styles.leftBtn,
                styles.blurredBackground,
              ]}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Previous image`)}
              accessibilityHint="">
              <FontAwesomeIcon
                icon="angle-left"
                style={styles.icon as FontAwesomeIconStyle}
                size={iconSize}
              />
            </TouchableOpacity>
          )}
          {canGoRight && (
            <TouchableOpacity
              onPress={onPressRight}
              style={[
                styles.btn,
                btnStyle,
                styles.rightBtn,
                styles.blurredBackground,
              ]}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Next image`)}
              accessibilityHint="">
              <FontAwesomeIcon
                icon="angle-right"
                style={styles.icon as FontAwesomeIconStyle}
                size={iconSize}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>
      {imgs[index].alt ? (
        <View style={styles.footer}>
          <Pressable
            accessibilityLabel={_(msg`Expand alt text`)}
            accessibilityHint={_(
              msg`If alt text is long, toggles alt text expanded state`,
            )}
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
    // @ts-ignore
    position: 'fixed',
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
    backgroundColor: '#00000077',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTablet: {
    width: 50,
    height: 50,
    borderRadius: 25,
    left: 30,
    right: 30,
  },
  btnMobile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    left: 20,
    right: 20,
  },
  leftBtn: {
    right: 'auto',
    top: '50%',
  },
  rightBtn: {
    left: 'auto',
    top: '50%',
  },
  footer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: colors.black,
  },
  blurredBackground: {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  } as ViewStyle,
})
