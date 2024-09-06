import React from 'react'
import {DimensionValue, Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedImages} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as imageSizes from '#/lib/media/image-sizes'
import {Dimensions} from '#/lib/media/types'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme} from '#/alf'
import {Crop_Stroke2_Corner0_Rounded as Crop} from '#/components/icons/Crop'
import {Text} from '#/components/Typography'

export function useImageAspectRatio({
  src,
  dimensions,
}: {
  src: string
  dimensions: Dimensions | undefined
}) {
  const [raw, setAspectRatio] = React.useState<number>(
    dimensions ? calc(dimensions) : 1,
  )
  const {isCropped, constrained, max} = React.useMemo(() => {
    const a34 = 0.75 // max of 3:4 ratio in feeds
    const constrained = Math.max(raw, a34)
    const max = Math.max(raw, 0.25) // max of 1:4 in thread
    const isCropped = raw < constrained
    return {
      isCropped,
      constrained,
      max,
    }
  }, [raw])

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
    raw,
    constrained,
    max,
    isCropped,
  }
}

export function ConstrainedImage({
  aspectRatio,
  fullBleed,
  children,
}: {
  aspectRatio: number
  fullBleed?: boolean
  children: React.ReactNode
}) {
  const t = useTheme()
  /**
   * Computed as a % value to apply as `paddingTop`
   */
  const outerAspectRatio = React.useMemo<DimensionValue>(() => {
    // capped to square or shorter
    const ratio = Math.min(1 / aspectRatio, 1)
    return `${ratio * 100}%`
  }, [aspectRatio])

  return (
    <View style={[a.w_full]}>
      <View style={[a.overflow_hidden, {paddingTop: outerAspectRatio}]}>
        <View style={[a.absolute, a.inset_0, a.flex_row]}>
          <View
            style={[
              a.h_full,
              a.rounded_sm,
              a.overflow_hidden,
              t.atoms.bg_contrast_25,
              fullBleed ? a.w_full : {aspectRatio},
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
  crop = 'constrained',
  hideBadge,
  onPress,
  onLongPress,
  onPressIn,
}: {
  image: AppBskyEmbedImages.ViewImage
  crop?: 'none' | 'square' | 'constrained'
  hideBadge?: boolean
  onPress?: () => void
  onLongPress?: () => void
  onPressIn?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const largeAlt = useLargeAltBadgeEnabled()
  const {
    constrained,
    max,
    isCropped: rawIsCropped,
  } = useImageAspectRatio({
    src: image.thumb,
    dimensions: image.aspectRatio,
  })
  const cropDisabled = crop === 'none'
  const isCropped = rawIsCropped && !cropDisabled
  const hasAlt = !!image.alt

  const contents = (
    <>
      <Image
        style={[a.w_full, a.h_full]}
        source={image.thumb}
        accessible={true} // Must set for `accessibilityLabel` to work
        accessibilityIgnoresInvertColors
        accessibilityLabel={image.alt}
        accessibilityHint=""
      />

      {(hasAlt || isCropped) && !hideBadge ? (
        <View
          accessible={false}
          style={[
            a.absolute,
            a.flex_row,
            a.align_center,
            a.rounded_xs,
            t.atoms.bg_contrast_25,
            {
              gap: 3,
              padding: 3,
              bottom: a.p_xs.padding,
              right: a.p_xs.padding,
              opacity: 0.8,
            },
            largeAlt && [
              {
                gap: 4,
                padding: 5,
              },
            ],
          ]}>
          {isCropped && (
            <Crop
              fill={t.atoms.text_contrast_high.color}
              width={largeAlt ? 18 : 12}
            />
          )}
          {hasAlt && (
            <Text style={[a.font_heavy, largeAlt ? a.text_xs : {fontSize: 8}]}>
              ALT
            </Text>
          )}
        </View>
      ) : null}
    </>
  )

  if (cropDisabled) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        // alt here is what screen readers actually use
        accessibilityLabel={image.alt}
        accessibilityHint={_(msg`Tap to view full image`)}
        style={[
          a.w_full,
          a.rounded_sm,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          {aspectRatio: max},
        ]}>
        {contents}
      </Pressable>
    )
  } else {
    return (
      <ConstrainedImage fullBleed={crop === 'square'} aspectRatio={constrained}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          // alt here is what screen readers actually use
          accessibilityLabel={image.alt}
          accessibilityHint={_(msg`Tap to view full image`)}
          style={[a.h_full]}>
          {contents}
        </Pressable>
      </ConstrainedImage>
    )
  }
}

function calc(dim: Dimensions) {
  if (dim.width === 0 || dim.height === 0) {
    return 1
  }
  return dim.width / dim.height
}
