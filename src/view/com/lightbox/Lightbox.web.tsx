import {useCallback, useEffect, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {FocusGuards, FocusScope} from 'radix-ui/internal'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {useA11y} from '#/state/a11y'
import {useLightbox, useLightboxControls} from '#/state/lightbox'
import {
  atoms as a,
  flatten,
  ThemeProvider,
  useBreakpoints,
  useTheme,
} from '#/alf'
import {Button} from '#/components/Button'
import {Backdrop} from '#/components/Dialog'
import {
  ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon,
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
} from '#/components/icons/Chevron'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {type ImageSource} from './ImageViewing/@types'

export function Lightbox() {
  const {activeLightbox} = useLightbox()
  const {closeLightbox} = useLightboxControls()
  const isActive = !!activeLightbox

  if (!isActive) {
    return null
  }

  const initialIndex = activeLightbox.index
  const imgs = activeLightbox.images
  return (
    <ThemeProvider theme="dark">
      <LightboxContainer handleBackgroundPress={closeLightbox}>
        <LightboxGallery
          key={activeLightbox.id}
          imgs={imgs}
          initialIndex={initialIndex}
          onClose={closeLightbox}
        />
      </LightboxContainer>
    </ThemeProvider>
  )
}

function LightboxContainer({
  children,
  handleBackgroundPress,
}: {
  children: React.ReactNode
  handleBackgroundPress: () => void
}) {
  const {_} = useLingui()
  FocusGuards.useFocusGuards()
  return (
    <Pressable
      accessibilityHint={undefined}
      accessibilityLabel={_(msg`Close image lightbox`)}
      onPress={handleBackgroundPress}
      style={[a.fixed, a.inset_0, a.z_10]}>
      <Backdrop />
      <RemoveScrollBar />
      <FocusScope.FocusScope loop trapped asChild>
        <div style={{position: 'absolute', inset: 0}}>{children}</div>
      </FocusScope.FocusScope>
    </Pressable>
  )
}

function LightboxGallery({
  imgs,
  initialIndex = 0,
  onClose,
}: {
  imgs: ImageSource[]
  initialIndex: number
  onClose: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {reduceMotionEnabled} = useA11y()
  const [index, setIndex] = useState(initialIndex)
  const [hasAnyLoaded, setAnyHasLoaded] = useState(false)
  const [isAltExpanded, setAltExpanded] = useState(false)

  const {gtPhone} = useBreakpoints()

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
        e.preventDefault()
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

  const delayedFadeInAnim = !reduceMotionEnabled && [
    a.fade_in,
    {animationDelay: '0.2s', animationFillMode: 'both'},
  ]

  const img = imgs[index]

  return (
    <View style={[a.absolute, a.inset_0]}>
      <View style={[a.flex_1, a.justify_center, a.align_center]}>
        <LightboxGalleryItem
          key={index}
          source={img.uri}
          alt={img.alt}
          type={img.type}
          hasAnyLoaded={hasAnyLoaded}
          onLoad={() => setAnyHasLoaded(true)}
        />
        {canGoLeft && (
          <Button
            onPress={onPressLeft}
            style={[
              a.absolute,
              styles.leftBtn,
              styles.blurredBackdrop,
              a.transition_color,
              delayedFadeInAnim,
            ]}
            hoverStyle={styles.blurredBackdropHover}
            color="secondary"
            label={_(msg`Previous image`)}
            shape="round"
            size={gtPhone ? 'large' : 'small'}>
            <ChevronLeftIcon
              size={gtPhone ? 'md' : 'sm'}
              style={{color: t.palette.white}}
            />
          </Button>
        )}
        {canGoRight && (
          <Button
            onPress={onPressRight}
            style={[
              a.absolute,
              styles.rightBtn,
              styles.blurredBackdrop,
              a.transition_color,
              delayedFadeInAnim,
            ]}
            hoverStyle={styles.blurredBackdropHover}
            color="secondary"
            label={_(msg`Next image`)}
            shape="round"
            size={gtPhone ? 'large' : 'small'}>
            <ChevronRightIcon
              size={gtPhone ? 'md' : 'sm'}
              style={{color: t.palette.white}}
            />
          </Button>
        )}
      </View>
      {img.alt ? (
        <View style={[a.px_4xl, a.py_2xl, t.atoms.bg, delayedFadeInAnim]}>
          <Pressable
            accessibilityLabel={_(msg`Expand alt text`)}
            accessibilityHint={_(
              msg`If alt text is long, toggles alt text expanded state`,
            )}
            onPress={() => {
              setAltExpanded(!isAltExpanded)
            }}>
            <Text
              style={[a.text_md, a.leading_snug]}
              numberOfLines={isAltExpanded ? 0 : 3}
              ellipsizeMode="tail">
              {img.alt}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <Button
        onPress={onClose}
        style={[
          a.absolute,
          styles.closeBtn,
          styles.blurredBackdrop,
          a.transition_color,
          delayedFadeInAnim,
        ]}
        hoverStyle={styles.blurredBackdropHover}
        color="secondary"
        label={_(msg`Close lightbox`)}
        shape="round"
        size={gtPhone ? 'large' : 'small'}>
        <XIcon size={gtPhone ? 'md' : 'sm'} style={{color: t.palette.white}} />
      </Button>
    </View>
  )
}

function LightboxGalleryItem({
  source,
  alt,
  type,
  onLoad,
  hasAnyLoaded,
}: {
  source: string
  alt: string | undefined
  type: ImageSource['type']
  onLoad: () => void
  hasAnyLoaded: boolean
}) {
  const {reduceMotionEnabled} = useA11y()
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isFirstToLoad] = useState(!hasAnyLoaded)

  /**
   * We want to show a zoom/fade in animation when the lightbox first opens.
   * To avoid showing it as we switch between images, we keep track in the parent
   * whether any image has loaded yet. We then save what the value of this is on first
   * render (as when it changes, we don't want to then *remove* then animation). when
   * the image loads, if this is the first image to load, we play the animation.
   *
   * We also use this `hasLoaded` state to show a loading indicator. This is on a 1s
   * delay and then a slow fade in to avoid flicker. -sfn
   */
  const zoomInWhenReady =
    !reduceMotionEnabled &&
    isFirstToLoad &&
    (hasAnyLoaded
      ? [a.zoom_fade_in, {animationDuration: '0.5s'}]
      : {opacity: 0})

  const handleLoad = () => {
    setHasLoaded(true)
    onLoad()
  }

  let image = null
  switch (type) {
    case 'circle-avi':
    case 'rect-avi':
      image = (
        <img
          src={source}
          style={flatten([
            styles.avi,
            {
              borderRadius:
                type === 'circle-avi' ? '50%' : type === 'rect-avi' ? '10%' : 0,
            },
            zoomInWhenReady,
          ])}
          alt={alt}
          onLoad={handleLoad}
        />
      )
      break
    case 'image':
      image = (
        <Image
          source={{uri: source}}
          alt={alt}
          style={[a.w_full, a.h_full, zoomInWhenReady]}
          onLoad={handleLoad}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      )
      break
  }

  return (
    <>
      {image}
      {!hasLoaded && (
        <View
          style={[
            a.absolute,
            a.inset_0,
            a.justify_center,
            a.align_center,
            a.fade_in,
            {
              opacity: 0,
              animationDuration: '500ms',
              animationDelay: '1s',
              animationFillMode: 'both',
            },
          ]}>
          <Loader size="xl" />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  avi: {
    // @ts-ignore web-only
    maxWidth: `calc(min(400px, 100vw))`,
    // @ts-ignore web-only
    maxHeight: `calc(min(400px, 100vh))`,
    padding: 16,
    boxSizing: 'border-box',
  },
  closeBtn: {
    top: 20,
    right: 20,
  },
  leftBtn: {
    left: 20,
    right: 'auto',
    top: '50%',
  },
  rightBtn: {
    right: 20,
    left: 'auto',
    top: '50%',
  },
  blurredBackdrop: {
    backgroundColor: '#00000077',
    // @ts-expect-error web only -sfn
    backdropFilter: 'blur(10px)',
  },
  blurredBackdropHover: {
    backgroundColor: '#00000088',
  },
})
