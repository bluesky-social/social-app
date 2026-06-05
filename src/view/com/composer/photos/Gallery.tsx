import {memo, useEffect, useMemo, useRef, useState} from 'react'
import {
  findNodeHandle,
  type ImageStyle,
  Keyboard,
  type LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {type Dimensions} from '#/lib/media/types'
import {colors} from '#/lib/styles'
import {useA11y} from '#/state/a11y'
import {type ComposerImage, cropImage} from '#/state/gallery'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Pencil_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as TimesIcon} from '#/components/icons/Times'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_IOS, IS_NATIVE} from '#/env'
import {type PostAction} from '../state/composer'
import {EditImageDialog} from './EditImageDialog'
import {getCarouselTileWidth} from './galleryLayout'
import {ImageAltTextDialog} from './ImageAltTextDialog'

const IMAGE_GAP = 8

// Posts with more than this many images preview as a horizontal carousel
// instead of the grid (matches the viewing-side display rule).
const GALLERY_CAROUSEL_THRESHOLD = 4
// Fixed height for carousel tiles; widths derive from each image aspect ratio.
const CAROUSEL_TILE_HEIGHT = 171
const CAROUSEL_CONTROLS_STYLE = {
  display: 'flex' as const,
  flexDirection: 'row' as const,
  position: 'absolute' as const,
  top: 4,
  right: 4,
  gap: 4,
  zIndex: 1,
}
const CAROUSEL_ALT_STYLE = {left: 4, bottom: 4}

interface GalleryProps {
  images: ComposerImage[]
  dispatch: (action: PostAction) => void
}

export let Gallery = (props: GalleryProps): React.ReactNode => {
  const [containerInfo, setContainerInfo] = useState<Dimensions>()

  const onLayout = (evt: LayoutChangeEvent) => {
    const {width, height} = evt.nativeEvent.layout
    setContainerInfo({
      width,
      height,
    })
  }

  return (
    <View onLayout={onLayout}>
      {containerInfo ? (
        <GalleryInner {...props} containerInfo={containerInfo} />
      ) : undefined}
    </View>
  )
}
Gallery = memo(Gallery)

interface GalleryInnerProps extends GalleryProps {
  containerInfo: Dimensions
}

const GalleryInner = ({images, containerInfo, dispatch}: GalleryInnerProps) => {
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const {screenReaderEnabled} = useA11y()
  const isCarousel =
    images.length > GALLERY_CAROUSEL_THRESHOLD && !screenReaderEnabled

  const scrollRef = useRef<ScrollView>(null)
  const prevCountRef = useRef(images.length)
  useEffect(() => {
    // When a new image is added in carousel mode, reveal it.
    if (isCarousel && images.length > prevCountRef.current) {
      scrollRef.current?.scrollToEnd({animated: true})
    }
    prevCountRef.current = images.length
  }, [images.length, isCarousel])

  const {altTextControlStyle, imageControlsStyle, imageStyle} = useMemo(() => {
    // Cap columns at 4 so tiles stay tappable when MAX_GALLERY_IMAGES is high;
    // n > 4 wraps to multiple rows via flexWrap on the gallery container.
    const columns = Math.min(images.length, 4)
    const side =
      images.length === 1
        ? 250
        : (containerInfo.width - IMAGE_GAP * (columns - 1)) / columns

    const isOverflow = isMobile && images.length > 2

    return {
      altTextControlStyle: isOverflow
        ? {left: 4, bottom: 4}
        : !isMobile && images.length < 3
          ? {left: 8, top: 8}
          : {left: 4, top: 4},
      imageControlsStyle: {
        display: 'flex' as const,
        flexDirection: 'row' as const,
        position: 'absolute' as const,
        ...(isOverflow
          ? {top: 4, right: 4, gap: 4}
          : !isMobile && images.length < 3
            ? {top: 8, right: 8, gap: 8}
            : {top: 4, right: 4, gap: 4}),
        zIndex: 1,
      },
      imageStyle: {
        height: side,
        width: side,
      },
    }
  }, [images.length, containerInfo, isMobile])

  if (images.length === 0) {
    return null
  }

  const altTextReminder = images.some(image => !image.alt) ? (
    <Admonition type="info" style={[a.mt_sm]}>
      <Trans>
        Alt text describes images for blind and low-vision users, and helps give
        context to everyone.
      </Trans>
    </Admonition>
  ) : null

  if (isCarousel) {
    return (
      <>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          testID="selectedPhotosView"
          accessibilityLabel={_(msg`Selected photos, ${images.length} images`)}
          accessibilityHint=""
          role="group"
          aria-roledescription={_(msg`carousel`)}
          style={[
            {
              marginTop: 16,
              marginHorizontal: -tokens.space.lg,
            },
            web({overscrollBehaviorX: 'contain'}),
          ]}
          contentContainerStyle={{
            gap: IMAGE_GAP,
            paddingHorizontal: tokens.space.lg,
          }}>
          {images.map(image => (
            <GalleryItem
              key={image.source.id}
              image={image}
              altTextControlStyle={CAROUSEL_ALT_STYLE}
              imageControlsStyle={CAROUSEL_CONTROLS_STYLE}
              imageStyle={{
                height: CAROUSEL_TILE_HEIGHT,
                width: getCarouselTileWidth(
                  image.transformed ?? image.source,
                  CAROUSEL_TILE_HEIGHT,
                ),
              }}
              onChange={next => {
                dispatch({type: 'embed_update_image', image: next})
              }}
              onRemove={() => {
                dispatch({type: 'embed_remove_image', image})
              }}
            />
          ))}
        </ScrollView>
        <CarouselAdmonition />
        {altTextReminder}
      </>
    )
  }

  return (
    <>
      <View testID="selectedPhotosView" style={styles.gallery}>
        {images.map(image => {
          return (
            <GalleryItem
              key={image.source.id}
              image={image}
              altTextControlStyle={altTextControlStyle}
              imageControlsStyle={imageControlsStyle}
              imageStyle={imageStyle}
              onChange={next => {
                dispatch({type: 'embed_update_image', image: next})
              }}
              onRemove={() => {
                dispatch({type: 'embed_remove_image', image})
              }}
            />
          )
        })}
      </View>
      {altTextReminder}
    </>
  )
}

type GalleryItemProps = {
  image: ComposerImage
  altTextControlStyle?: ViewStyle
  imageControlsStyle?: ViewStyle
  imageStyle?: ImageStyle
  onChange: (next: ComposerImage) => void
  onRemove: () => void
}

const GalleryItem = ({
  image,
  altTextControlStyle,
  imageControlsStyle,
  imageStyle,
  onChange,
  onRemove,
}: GalleryItemProps): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()

  const altTextControl = Dialog.useDialogControl()
  const editControl = Dialog.useDialogControl()
  const [altBtnViewTag, setAltBtnViewTag] = useState<number>()

  const altBtnRef = (node: View | null) => {
    // for iOS 26 fluid transition
    if (IS_IOS && node) {
      const tag = findNodeHandle(node)
      if (tag != null) setAltBtnViewTag(tag)
    }
  }

  const onImageEdit = () => {
    ax.metric('composer:image:edit', {
      platform: Platform.OS,
    })

    if (IS_NATIVE) {
      cropImage(image).then(next => {
        onChange(next)
      })
    } else {
      editControl.open()
    }
  }

  const onAltTextEdit = () => {
    Keyboard.dismiss()
    altTextControl.open()
  }

  return (
    <View
      ref={altBtnRef}
      style={imageStyle}
      // Fixes ALT and icons appearing with half opacity when the post is inactive
      renderToHardwareTextureAndroid>
      <TouchableOpacity
        testID="altTextButton"
        accessibilityRole="button"
        accessibilityLabel={_(msg`Add alt text`)}
        accessibilityHint=""
        onPress={onAltTextEdit}
        style={[styles.altTextControl, altTextControlStyle]}>
        {image.alt.length !== 0 ? (
          <CheckIcon width={10} style={{color: t.palette.white}} />
        ) : (
          <PlusIcon width={10} style={{color: t.palette.white}} />
        )}
        <Text style={styles.altTextControlLabel} accessible={false}>
          <Trans>ALT</Trans>
        </Text>
      </TouchableOpacity>
      <View style={imageControlsStyle}>
        <TouchableOpacity
          testID="editPhotoButton"
          accessibilityRole="button"
          accessibilityLabel={_(msg`Edit image`)}
          accessibilityHint=""
          onPress={onImageEdit}
          style={styles.imageControl}>
          <PencilIcon width={12} style={{color: colors.white}} />
        </TouchableOpacity>
        <TouchableOpacity
          testID="removePhotoButton"
          accessibilityRole="button"
          accessibilityLabel={_(msg`Remove image`)}
          accessibilityHint=""
          onPress={onRemove}
          style={styles.imageControl}>
          <TimesIcon width={16} style={{color: colors.white}} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={_(msg`Add alt text`)}
        accessibilityHint=""
        onPress={onAltTextEdit}
        style={styles.altTextHiddenRegion}
      />

      <Image
        testID="selectedPhotoImage"
        style={[styles.image, imageStyle]}
        source={{
          uri: (image.transformed ?? image.source).path,
        }}
        accessible={true}
        accessibilityIgnoresInvertColors
        enforceEarlyResizing
        cachePolicy="none"
        autoplay={false}
        contentFit="cover"
      />

      <MediaInsetBorder />

      <ImageAltTextDialog
        control={altTextControl}
        image={image}
        onChange={onChange}
        sourceViewTag={altBtnViewTag}
      />

      <EditImageDialog
        control={editControl}
        image={image}
        onChange={onChange}
      />
    </View>
  )
}

function CarouselAdmonition() {
  const {_} = useLingui()
  const {nux} = useNux(Nux.ComposerCarouselAnnouncement)
  const {mutate: save, variables} = useSaveNux()

  // Optimistically hide while the completion is saving.
  if (variables) return null
  if (nux && nux.completed) return null

  return (
    <View style={[a.mt_sm]}>
      <Admonition type="info">
        <Trans>
          Posts with more than 4 photos are shown as a swipeable carousel.
        </Trans>
      </Admonition>
      <Button
        label={_(msg`Dismiss`)}
        size="tiny"
        variant="solid"
        color="secondary_inverted"
        shape="round"
        onPress={() =>
          save({
            id: Nux.ComposerCarouselAnnouncement,
            completed: true,
            data: undefined,
          })
        }
        style={[a.absolute, {top: 8, right: 8}]}>
        <ButtonIcon icon={TimesIcon} />
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  gallery: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IMAGE_GAP,
    marginTop: 16,
  },
  image: {
    borderRadius: tokens.borderRadius.md,
  },
  imageControl: {
    width: 24,
    height: 24,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altTextControl: {
    position: 'absolute',
    zIndex: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  altTextControlLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  altTextHiddenRegion: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 4,
    top: 30,
    zIndex: 1,
  },
})
