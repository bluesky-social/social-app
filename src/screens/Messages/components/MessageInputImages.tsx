import {useCallback, useState} from 'react'
import {Image, Pressable, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type ComposerImage} from '#/state/gallery'
import {ImageAltTextDialog} from '#/view/com/composer/photos/ImageAltTextDialog'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Pencil_Stroke2_Corner0_Rounded as Pencil} from '#/components/icons/Pencil'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

export function useMessageImages() {
  const [images, setImages] = useState<ComposerImage[]>([])

  const addImages = useCallback((newImages: ComposerImage[]) => {
    setImages(prev => {
      const combined = [...prev, ...newImages]
      return combined.slice(0, 4)
    })
  }, [])

  const updateImage = useCallback((index: number, image: ComposerImage) => {
    setImages(prev => prev.map((img, i) => (i === index ? image : img)))
  }, [])

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearImages = useCallback(() => {
    setImages([])
  }, [])

  return {
    images,
    addImages,
    updateImage,
    removeImage,
    clearImages,
  }
}

export function MessageInputImages({
  images,
  onUpdate,
  onRemove,
}: {
  images: ComposerImage[]
  onUpdate: (index: number, image: ComposerImage) => void
  onRemove: (index: number) => void
}) {
  const t = useTheme()

  if (images.length === 0) {
    return null
  }

  return (
    <View style={[a.flex_row, a.gap_xs, a.flex_wrap, a.pb_xs]}>
      {images.map((image, index) => (
        <ImageThumbnail
          key={(image.transformed || image.source).id}
          image={image}
          index={index}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
      {images.length > 0 && (
        <View style={[a.justify_center, a.px_sm]}>
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {images.length}/4
          </Text>
        </View>
      )}
    </View>
  )
}

function ImageThumbnail({
  image,
  index,
  onUpdate,
  onRemove,
}: {
  image: ComposerImage
  index: number
  onUpdate: (index: number, image: ComposerImage) => void
  onRemove: (index: number) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const altTextControl = Dialog.useDialogControl()
  const source = image.transformed || image.source

  return (
    <>
      <View
        style={[
          {width: 80, height: 80},
          a.rounded_sm,
          a.overflow_hidden,
          t.atoms.border_contrast_low,
          a.border,
        ]}>
        <Image
          source={{uri: source.path}}
          style={[{width: '100%', height: '100%'}]}
          accessibilityLabel={image.alt || _(msg`Selected image`)}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
        <View style={[a.absolute, {top: 4, right: 4}, a.flex_row, a.gap_2xs]}>
          <Pressable
            onPress={() => altTextControl.open()}
            accessibilityLabel={_(msg`Add alt text`)}
            accessibilityHint={_(
              msg`Add descriptive alt text for accessibility`,
            )}
            style={[
              a.rounded_full,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: 4,
              },
            ]}>
            <Pencil size="xs" fill="white" />
          </Pressable>
          <Pressable
            onPress={() => onRemove(index)}
            accessibilityLabel={_(msg`Remove image`)}
            accessibilityHint={_(msg`Removes this image from the message`)}
            style={[
              a.rounded_full,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: 4,
              },
            ]}>
            <X size="xs" fill="white" />
          </Pressable>
        </View>
        {image.alt && (
          <View
            style={[
              a.absolute,
              {bottom: 4, left: 4, right: 4},
              a.rounded_sm,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                paddingHorizontal: 4,
                paddingVertical: 2,
              },
            ]}>
            <Text
              style={[a.text_2xs, {color: 'white'}]}
              numberOfLines={1}
              ellipsizeMode="tail">
              ALT
            </Text>
          </View>
        )}
      </View>

      <ImageAltTextDialog
        control={altTextControl}
        image={image}
        onChange={newImage => onUpdate(index, newImage)}
      />
    </>
  )
}
