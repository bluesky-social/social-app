import {useCallback, useState} from 'react'
import {Image, Pressable, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type ComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
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

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearImages = useCallback(() => {
    setImages([])
  }, [])

  return {
    images,
    addImages,
    removeImage,
    clearImages,
  }
}

export function MessageInputImages({
  images,
  onRemove,
}: {
  images: ComposerImage[]
  onRemove: (index: number) => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  if (images.length === 0) {
    return null
  }

  return (
    <View style={[a.flex_row, a.gap_xs, a.flex_wrap, a.pb_xs]}>
      {images.map((image, index) => {
        const source = image.transformed || image.source
        return (
          <View
            key={source.id}
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
            <Pressable
              onPress={() => onRemove(index)}
              accessibilityLabel={_(msg`Remove image`)}
              accessibilityHint={_(msg`Removes this image from the message`)}
              style={[
                a.absolute,
                {top: 4, right: 4},
                a.rounded_full,
                {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  padding: 4,
                },
              ]}>
              <X size="xs" fill="white" />
            </Pressable>
          </View>
        )
      })}
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
