import {useMemo, useRef} from 'react'
import {type DimensionValue, Pressable, View} from 'react-native'
import Animated, {
  type AnimatedRef,
  useAnimatedRef,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'
import {utils} from '@bsky.app/alf'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type Dimensions} from '#/lib/media/types'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme} from '#/alf'
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
  hideBadge,
  onPress,
  onLongPress,
  onPressIn,
}: {
  image: AppBskyEmbedImages.ViewImage
  crop?: 'none' | 'square' | 'constrained'
  hideBadge?: boolean
  onPress?: (
    containerRef: AnimatedRef<any>,
    fetchedDims: Dimensions | null,
  ) => void
  onLongPress?: () => void
  onPressIn?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const largeAlt = useLargeAltBadgeEnabled()
  const containerRef = useAnimatedRef()
  const fetchedDimsRef = useRef<{width: number; height: number} | null>(null)

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
            fetchedDimsRef.current = {
              width: e.source.width,
              height: e.source.height,
            }
          }
        }}
        loading="lazy"
      />
      <MediaInsetBorder />

      {(hasAlt || isCropped) && !hideBadge ? (
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
              style={[
                a.rounded_xs,
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
              style={[
                a.justify_center,
                a.rounded_xs,
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
              <Text style={[a.font_bold, largeAlt ? a.text_xs : {fontSize: 8}]}>
                ALT
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
        accessibilityHint={_(msg`Views full image`)}
        accessibilityRole="button"
        android_ripple={{
          color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
          foreground: true,
        }}
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          {aspectRatio: max ?? 1},
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
          accessibilityHint={_(msg`Views full image`)}
          accessibilityRole="button"
          android_ripple={{
            color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
            foreground: true,
          }}
          style={[a.h_full]}>
          {contents}
        </Pressable>
      </ConstrainedImage>
    )
  }
}
