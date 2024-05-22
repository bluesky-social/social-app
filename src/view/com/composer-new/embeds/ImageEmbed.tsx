import React from 'react'
import {ImageStyle, LayoutChangeEvent, ViewStyle} from 'react-native'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Image} from 'expo-image'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ComposerImage, cropImage} from '#/state/gallery'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Dimensions} from 'lib/media/types'
import {colors} from 'lib/styles'
import {isNative} from 'platform/detection'
import {Text} from 'view/com/util/text/Text'
import {useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {EditImageDialog} from '../../composer/photos/EditImageDialog'
import {ImageAltTextDialog} from '../../composer/photos/ImageAltTextDialog'
import {ComposerAction, PostImageEmbed} from '../state'

const IMAGE_GAP = 8

export const ImageEmbed = (props: {
  active: boolean
  postId: string
  embed: PostImageEmbed
  dispatch: React.Dispatch<ComposerAction>
}): React.ReactNode => {
  const [layout, setLayout] = React.useState<Dimensions>()

  const onLayout = (evt: LayoutChangeEvent) => {
    const {width, height} = evt.nativeEvent.layout
    setLayout({
      width,
      height,
    })
  }

  return (
    <View onLayout={onLayout}>
      {layout !== undefined && <ImageEmbedInner {...props} layout={layout} />}
    </View>
  )
}

const ImageEmbedInner = ({
  active,
  postId,
  embed,
  layout,
  dispatch,
}: {
  active: boolean
  postId: string
  embed: PostImageEmbed
  layout: Dimensions
  dispatch: React.Dispatch<ComposerAction>
}): React.ReactNode => {
  const images = embed.images

  const {isMobile} = useWebMediaQueries()

  const {altTextControlStyle, imageControlsStyle, imageStyle} =
    React.useMemo(() => {
      const side =
        images.length === 1
          ? 250
          : (layout.width - IMAGE_GAP * (images.length - 1)) / images.length

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
    }, [images.length, layout, isMobile])

  return (
    <View style={styles.gallery}>
      {images.map(image => {
        return (
          <GalleryItem
            key={image.source.id}
            active={active}
            postId={postId}
            image={image}
            altTextControlStyle={altTextControlStyle}
            imageControlsStyle={imageControlsStyle}
            imageStyle={imageStyle}
            dispatch={dispatch}
          />
        )
      })}
    </View>
  )
}

const GalleryItem = ({
  active,
  postId,
  image,
  altTextControlStyle,
  imageControlsStyle,
  imageStyle,
  dispatch,
}: {
  active: boolean
  postId: string
  image: ComposerImage
  altTextControlStyle?: ViewStyle
  imageControlsStyle?: ViewStyle
  imageStyle?: ViewStyle
  dispatch: React.Dispatch<ComposerAction>
}) => {
  const {_} = useLingui()
  const t = useTheme()

  const altTextControl = Dialog.useDialogControl()
  const editControl = Dialog.useDialogControl()

  const onChange = (next: ComposerImage) => {
    dispatch({type: 'embed_update_image', postId, image: next})
  }

  const onRemove = () => {
    dispatch({type: 'embed_remove_image', postId, image})
  }

  const onEdit = () => {
    if (isNative) {
      cropImage(image).then(onChange)
    } else {
      editControl.open()
    }
  }

  return (
    <View style={imageStyle}>
      {active && (
        <>
          <TouchableOpacity
            testID="altTextButton"
            accessibilityRole="button"
            accessibilityLabel={_(msg`Add alt text`)}
            accessibilityHint=""
            onPress={altTextControl.open}
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
              onPress={onEdit}
              style={styles.imageControl}>
              <FontAwesomeIcon
                icon="pen"
                size={12}
                style={{color: colors.white}}
              />
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
            // @ts-expect-error: don't put this on keyboard nav
            tabIndex={-1}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Add alt text`)}
            accessibilityHint=""
            onPress={altTextControl.open}
            style={styles.altTextHiddenRegion}
          />
        </>
      )}

      <Image
        testID="selectedPhotoImage"
        style={[styles.image, imageStyle] as ImageStyle}
        source={{
          uri: (image.transformed ?? image.source).path,
        }}
        accessible={true}
        accessibilityIgnoresInvertColors
      />

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

const styles = StyleSheet.create({
  gallery: {
    flex: 1,
    flexDirection: 'row',
    gap: IMAGE_GAP,
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 8,
  },
  imageControl: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontWeight: 'bold',
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
