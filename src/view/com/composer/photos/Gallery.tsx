import React from 'react'
import {
  type ImageStyle,
  Keyboard,
  type LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import {Image} from 'expo-image'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {type Dimensions} from '#/lib/media/types'
import {colors, s} from '#/lib/styles'
import {isNative} from '#/platform/detection'
import {type ComposerImage, cropImage} from '#/state/gallery'
import {Text} from '#/view/com/util/text/Text'
import {tokens, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {type PostAction} from '../state/composer'
import {EditImageDialog} from './EditImageDialog'
import {ImageAltTextDialog} from './ImageAltTextDialog'

const IMAGE_GAP = 8

interface GalleryProps {
  images: ComposerImage[]
  dispatch: (action: PostAction) => void
}

export let Gallery = (props: GalleryProps): React.ReactNode => {
  const [containerInfo, setContainerInfo] = React.useState<Dimensions>()

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
Gallery = React.memo(Gallery)

interface GalleryInnerProps extends GalleryProps {
  containerInfo: Dimensions
}

const GalleryInner = ({images, containerInfo, dispatch}: GalleryInnerProps) => {
  const {isMobile} = useWebMediaQueries()

  const {altTextControlStyle, imageControlsStyle, imageStyle} =
    React.useMemo(() => {
      const side =
        images.length === 1
          ? 250
          : (containerInfo.width - IMAGE_GAP * (images.length - 1)) /
            images.length

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

  return images.length !== 0 ? (
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
      <AltTextReminder />
    </>
  ) : null
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

  const altTextControl = Dialog.useDialogControl()
  const editControl = Dialog.useDialogControl()

  const onImageEdit = () => {
    if (isNative) {
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
      style={imageStyle as ViewStyle}
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
          <FontAwesomeIcon
            icon="check"
            size={10}
            style={{color: t.palette.white}}
          />
        ) : (
          <FontAwesomeIcon
            icon="plus"
            size={10}
            style={{color: t.palette.white}}
          />
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
          <FontAwesomeIcon icon="pen" size={12} style={{color: colors.white}} />
        </TouchableOpacity>
        <TouchableOpacity
          testID="removePhotoButton"
          accessibilityRole="button"
          accessibilityLabel={_(msg`Remove image`)}
          accessibilityHint=""
          onPress={onRemove}
          style={styles.imageControl}>
          <FontAwesomeIcon
            icon="xmark"
            size={16}
            style={{color: colors.white}}
          />
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
        cachePolicy="none"
        autoplay={false}
        contentFit="cover"
      />

      <MediaInsetBorder />

      <ImageAltTextDialog
        control={altTextControl}
        image={image}
        onChange={onChange}
      />

      <EditImageDialog
        control={editControl}
        image={image}
        onChange={onChange}
      />
    </View>
  )
}

export function AltTextReminder() {
  const t = useTheme()
  return (
    <View style={[styles.reminder]}>
      <View style={[styles.infoIcon, t.atoms.bg_contrast_25]}>
        <FontAwesomeIcon icon="info" size={12} color={t.atoms.text.color} />
      </View>
      <Text type="sm" style={[t.atoms.text_contrast_medium, s.flex1]}>
        <Trans>
          Alt text describes images for blind and low-vision users, and helps
          give context to everyone.
        </Trans>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  gallery: {
    flex: 1,
    flexDirection: 'row',
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

  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 14,
  },
  infoIcon: {
    width: 22,
    height: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
