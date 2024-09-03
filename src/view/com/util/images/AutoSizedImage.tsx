import React from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedImages} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as imageSizes from '#/lib/media/image-sizes'
import {Dimensions} from '#/lib/media/types'
import {atoms as a, useTheme} from '#/alf'

export function useImageAspectRatio({
  src,
  dimensions,
}: {
  src: string
  dimensions: Dimensions | undefined
}) {
  const [aspectRatio, setAspectRatio] = React.useState<number>(
    dimensions ? calc(dimensions) : 1,
  )

  React.useEffect(() => {
    let aborted = false
    if (dimensions) return
    imageSizes.fetch(src).then(newDim => {
      if (aborted) return
      setAspectRatio(calc(newDim))
    })
    return () => {
      aborted = true
    }
  }, [dimensions, setAspectRatio, src])

  return {
    dimensions,
    aspectRatio,
  }
}

export function SquareFramedImage({
  aspectRatio,
  children,
}: {
  aspectRatio: number
  children: React.ReactNode
}) {
  const t = useTheme()
  const outerAspectRatio = React.useMemo(() => {
    return Math.min(1 / aspectRatio, 1)
  }, [aspectRatio])
  const innerAspectRatio = React.useMemo(() => {
    return Math.max(aspectRatio, 0.75)
  }, [aspectRatio])

  return (
    <View style={[a.w_full]}>
      <View
        style={[a.overflow_hidden, {paddingTop: `${outerAspectRatio * 100}%`}]}>
        <View style={[a.absolute, a.inset_0, a.flex_row]}>
          <View
            style={[
              a.h_full,
              a.rounded_sm,
              a.overflow_hidden,
              t.atoms.bg_contrast_25,
              {aspectRatio: innerAspectRatio},
            ]}>
            {children}
          </View>
        </View>
      </View>
    </View>
  )
}

export function AutoSizedImage({
  image,
  disableCrop,
  onPress,
  onLongPress,
  onPressIn,
  children = null,
}: {
  image: AppBskyEmbedImages.ViewImage
  disableCrop?: boolean
  children?: React.ReactNode
  onPress?: () => void
  onLongPress?: () => void
  onPressIn?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {aspectRatio} = useImageAspectRatio({
    src: image.thumb,
    dimensions: image.aspectRatio,
  })

  const contents = (
    <Image
      style={[a.w_full, a.h_full]}
      source={image.thumb}
      accessible={true} // Must set for `accessibilityLabel` to work
      accessibilityIgnoresInvertColors
      accessibilityLabel={image.alt}
      accessibilityHint=""
    />
  )

  if (disableCrop) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        accessibilityLabel={image.alt}
        accessibilityHint={_(msg`Tap to view fully`)}
        style={[
          a.w_full,
          a.rounded_sm,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          {aspectRatio},
        ]}>
        {contents}
        {children}
      </Pressable>
    )
  } else {
    return (
      <SquareFramedImage aspectRatio={aspectRatio}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          accessibilityLabel={image.alt}
          accessibilityHint={_(msg`Tap to view fully`)}
          style={[a.h_full]}>
          {contents}
          {children}
        </Pressable>
      </SquareFramedImage>
    )
  }
}

function calc(dim: Dimensions) {
  if (dim.width === 0 || dim.height === 0) {
    return 1
  }
  return dim.width / dim.height
}
