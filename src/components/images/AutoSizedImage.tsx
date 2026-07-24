import {useEffect, useMemo, useRef} from 'react'
import {type DimensionValue, Pressable, View} from 'react-native'
import Animated, {
  type AnimatedRef,
  useAnimatedRef,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'
import {utils} from '@bsky.app/alf'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {type Dimensions} from '#/lib/media/types'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme, web} from '#/alf'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as Fullscreen} from '#/components/icons/ArrowsDiagonal'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

export function ConstrainedImage({
  aspectRatio,
  fullBleed,
  children,
  minMobileAspectRatio,
}: {
  aspectRatio: number
  fullBleed?: boolean
  minMobileAspectRatio?: number
  children: React.ReactNode
}) {
  const t = useTheme()
  /**
   * Computed as a % value to apply as `paddingTop`, this basically controls
   * the height of the image.
   */
  const outerAspectRatio = useMemo<DimensionValue>(() => {
    const ratio = IS_NATIVE
      ? Math.min(1 / aspectRatio, minMobileAspectRatio ?? 16 / 9) // 9:16 bounding box
      : Math.min(1 / aspectRatio, 1) // 1:1 bounding box
    return `${ratio * 100}%`
  }, [aspectRatio, minMobileAspectRatio])

  return (
    <View style={[a.w_full]}>
      <View style={[a.overflow_hidden, {paddingTop: outerAspectRatio}]}>
        <View style={[a.absolute, a.inset_0, a.flex_row]}>
          <View
            style={[
              a.h_full,
              a.rounded_md,
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
  onPress,
  onLongPress,
  onPressIn,
  onContainerRef,
  onDimsChange,
}: {
  image: AppBskyEmbedImages.ViewImage
  crop?: 'none' | 'square' | 'constrained'
  onPress?: (
    containerRef: AnimatedRef<any>,
    fetchedDims: Dimensions | null,
  ) => void
  onLongPress?: () => void
  onPressIn?: () => void
  /** Fires once with the internal container ref so a parent can drive its
   *  own lightbox-return animation without waiting for an `onPress`. */
  onContainerRef?: (ref: AnimatedRef<any>) => void
  /** Fires when the underlying image reports its natural dimensions. */
  onDimsChange?: (dims: Dimensions) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const largeAlt = useLargeAltBadgeEnabled()
  const containerRef = useAnimatedRef()
  const fetchedDimsRef = useRef<{width: number; height: number} | null>(null)

  useEffect(() => {
    onContainerRef?.(containerRef)
  }, [containerRef, onContainerRef])

  let aspectRatio: number | undefined
  const dims = image.aspectRatio
  if (dims) {
    aspectRatio = dims.width / dims.height
    if (Number.isNaN(aspectRatio)) {
      aspectRatio = undefined
    }
  }

  let constrained: number | undefined
  let max: number | undefined
  let rawIsCropped: boolean | undefined
  if (aspectRatio !== undefined) {
    const ratio = 1 / 2 // max of 1:2 ratio in feeds
    constrained = Math.max(aspectRatio, ratio)
    max = Math.max(aspectRatio, 0.25) // max of 1:4 in thread
    rawIsCropped = aspectRatio < constrained
  }

  const cropDisabled = crop === 'none'
  const isCropped = rawIsCropped && !cropDisabled
  const isContain = aspectRatio === undefined
  const hasAlt = !!image.alt

  const contents = (
    <Animated.View ref={containerRef} collapsable={false} style={{flex: 1}}>
      <Image
        contentFit={isContain ? 'contain' : 'cover'}
        style={[a.w_full, a.h_full]}
        source={image.thumb}
        accessible={true} // Must set for `accessibilityLabel` to work
        accessibilityIgnoresInvertColors
        accessibilityLabel={image.alt}
        accessibilityHint=""
        onLoad={e => {
          if (!isContain) {
            const dims = {
              width: e.source.width,
              height: e.source.height,
            }
            fetchedDimsRef.current = dims
            onDimsChange?.(dims)
          }
        }}
        loading="lazy"
        useAppleWebpCodec
      />
      <MediaInsetBorder />

      {hasAlt || isCropped ? (
        <View
          accessible={false}
          style={[
            a.absolute,
            a.flex_row,
            {
              bottom: a.p_xs.padding,
              right: a.p_xs.padding,
              gap: 3,
            },
            largeAlt && [
              {
                gap: 4,
              },
            ],
          ]}>
          {isCropped && (
            <View
              accessible={false}
              style={[
                a.rounded_sm,
                a.p_xs,
                t.atoms.bg_contrast_25,
                {
                  padding: 3,
                  opacity: 0.8,
                },
                largeAlt && [
                  {
                    padding: 5,
                  },
                ],
              ]}>
              <Fullscreen
                fill={t.atoms.text_contrast_high.color}
                width={largeAlt ? 18 : 12}
              />
            </View>
          )}
          {hasAlt && (
            <View
              accessible={false}
              style={[
                a.justify_center,
                a.rounded_sm,
                a.p_xs,
                t.atoms.bg_contrast_25,
                {
                  opacity: 0.8,
                },
                largeAlt && [
                  {
                    padding: 6,
                  },
                ],
              ]}>
              <Text style={[a.font_bold, largeAlt ? a.text_xs : {fontSize: 8}]}>
                <Trans>ALT</Trans>
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </Animated.View>
  )

  if (cropDisabled) {
    return (
      <Pressable
        onPress={() => onPress?.(containerRef, fetchedDimsRef.current)}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        // alt here is what screen readers actually use
        accessibilityLabel={image.alt}
        accessibilityHint={l`Views full image`}
        accessibilityRole="button"
        android_ripple={{
          color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
          foreground: true,
        }}
        style={({pressed}) => [
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          {aspectRatio: max ?? 1},
          web([
            a.transition_transform,
            {transitionDuration: '200ms'},
            pressed && {transform: [{scale: 0.99}]},
          ]),
        ]}>
        {contents}
      </Pressable>
    )
  } else {
    return (
      <ConstrainedImage
        fullBleed={crop === 'square'}
        aspectRatio={constrained ?? 1}>
        <Pressable
          onPress={() => onPress?.(containerRef, fetchedDimsRef.current)}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          // alt here is what screen readers actually use
          accessibilityLabel={image.alt}
          accessibilityHint={l`Views full image`}
          accessibilityRole="button"
          android_ripple={{
            color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
            foreground: true,
          }}
          style={({pressed}) => [
            a.h_full,
            a.rounded_md,
            a.overflow_hidden,
            web([
              a.transition_transform,
              {transitionDuration: '200ms'},
              pressed && {transform: [{scale: 0.99}]},
            ]),
          ]}>
          {contents}
        </Pressable>
      </ConstrainedImage>
    )
  }
}
