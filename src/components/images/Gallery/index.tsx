import {useEffect, useMemo, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {
  type AnimatedRef,
  useAnimatedRef,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {utils} from '@bsky.app/alf'
import {Trans, useLingui} from '@lingui/react/macro'
import debounce from 'lodash.debounce'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {type Dimensions} from '#/lib/media/types'
import {useA11y} from '#/state/a11y'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, tokens, useBreakpoints, useTheme, web} from '#/alf'
import * as GalleryPrimitive from '#/components/Gallery'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as Fullscreen} from '#/components/icons/ArrowsDiagonal'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {
  computeDims,
  getAspectRatio,
  getContentHeight,
} from '#/components/images/Gallery/utils'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {ImageContextMenu} from '#/components/Post/Embed/ImageContextMenu'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'

export * from './const'
export * from './maybeApplyGalleryOffsetStyles'

interface GalleryProps {
  images: app.bsky.embed.images.ViewImage[]
  onPress?: (
    index: number,
    containerRefs: AnimatedRef<any>[],
    fetchedDims: (Dimensions | null)[],
    onIndexChange?: (index: number) => void,
  ) => void
  onPressIn?: (index: number) => void
  viewContext?: PostEmbedViewContext
  isWithinQuote?: boolean
  // Post context for the in-feed carousel swipe metric. Omit for non-post
  // contexts (no event will be emitted).
  metricsPostContext?: {
    postUri: string
    postAuthorDid: string
    feedDescriptor?: string
  }
}

/**
 * Part of the app-facing image gallery API, alongside `Gallery`. App code uses
 * these rather than importing the generic gallery directly. They are the
 * generic gallery's own Bleed and hook, not copies, so everything shares
 * exactly one context.
 */
export {Bleed as GalleryBleed, useGalleryBleed} from '#/components/Gallery'

export function Gallery({
  images,
  onPress,
  onPressIn,
  viewContext,
  isWithinQuote,
  metricsPostContext,
}: GalleryProps) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {screenReaderEnabled} = useA11y()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const bps = useBreakpoints()
  const isWithinChat = viewContext === PostEmbedViewContext.ChatMessage
  const contentHeight = getContentHeight({
    isWithinChat,
    isWithinQuote,
    gtPhone: bps.gtPhone,
    gtMobile: bps.gtMobile,
  })

  const galleryRef = useRef<GalleryPrimitive.GalleryRef>(null)
  const containerRefsRef = useRef<Map<number, AnimatedRef>>(new Map())
  const thumbDimsRef = useRef<Map<number, Dimensions>>(new Map())

  /*
   * Debounced so that a flick through several images is one event. Created
   * once and reading the latest context at call time, since callers don't
   * keep `metricsPostContext` referentially stable.
   */
  const emitSwipeMetric = useNonReactiveCallback(
    (fromIndex: number, toIndex: number) => {
      if (!metricsPostContext) return
      ax.metric('post:photoEmbed:carouselSwipe', {
        fromImage: fromIndex + 1, // convert to 1-based index for easier analysis
        toImage: toIndex + 1, // convert to 1-based index for easier analysis
        totalImages: images.length,
        postUri: metricsPostContext.postUri,
        postAuthorDid: metricsPostContext.postAuthorDid,
        feedDescriptor: metricsPostContext.feedDescriptor,
      })
    },
  )
  const debouncedSwipeMetric = useMemo(
    () => debounce(emitSwipeMetric, 200),
    [emitSwipeMetric],
  )
  /*
   * Don't let a pending event land on a different post, feed, or set of
   * images, or after we're gone. Keyed on the values rather than on the
   * context object, which callers recreate on every render.
   */
  const postUri = metricsPostContext?.postUri
  const postAuthorDid = metricsPostContext?.postAuthorDid
  const feedDescriptor = metricsPostContext?.feedDescriptor
  const imagesSignature = images.map(image => image.thumb).join('\n')
  useEffect(
    () => () => debouncedSwipeMetric.cancel(),
    [
      debouncedSwipeMetric,
      postUri,
      postAuthorDid,
      feedDescriptor,
      imagesSignature,
    ],
  )

  /*
   * Keeps the image the lightbox is showing in view, so closing it lands on
   * the right thumbnail. Non-reactive because the lightbox holds onto it, and
   * the layout can change underneath (e.g. on rotation).
   */
  const scrollIntoView = useNonReactiveCallback((index: number) => {
    galleryRef.current?.scrollIntoView(index)
  })

  const registerContainerRef = useNonReactiveCallback(
    (index: number, ref: AnimatedRef, registered: boolean) => {
      if (registered) {
        containerRefsRef.current.set(index, ref)
      } else if (containerRefsRef.current.get(index) === ref) {
        containerRefsRef.current.delete(index)
      }
    },
  )
  const setThumbDims = useNonReactiveCallback(
    (index: number, dims: Dimensions | null) => {
      if (dims) {
        thumbDimsRef.current.set(index, dims)
      } else {
        thumbDimsRef.current.delete(index)
      }
    },
  )

  // Drop anything left over from images that are no longer here
  useEffect(() => {
    for (const map of [containerRefsRef.current, thumbDimsRef.current]) {
      for (const index of map.keys()) {
        if (index >= images.length) map.delete(index)
      }
    }
  }, [images.length])

  if (screenReaderEnabled) {
    return (
      <View style={[a.relative, a.gap_sm]}>
        {images.map((image, index) => (
          <AutoSizedImage
            key={image.thumb + index}
            crop={
              viewContext === PostEmbedViewContext.ThreadHighlighted
                ? 'none'
                : isWithinQuote
                  ? 'square'
                  : 'constrained'
            }
            image={image}
            onPress={(containerRef, dims) =>
              onPress?.(index, [containerRef], [dims])
            }
            onPressIn={() => onPressIn?.(index)}
          />
        ))}
      </View>
    )
  }

  return (
    <GalleryPrimitive.Root
      ref={galleryRef}
      label={l`Image gallery, ${images.length} images`}
      onIndexChange={(index, previousIndex) =>
        debouncedSwipeMetric(previousIndex, index)
      }>
      {images.map((image, index) => {
        const openLightboxAtIndex = onPress
          ? () => {
              const refs: AnimatedRef[] = []
              const dims: (Dimensions | null)[] = []
              for (let i = 0; i < images.length; i++) {
                refs.push(containerRefsRef.current.get(i)!)
                dims.push(thumbDimsRef.current.get(i) ?? null)
              }
              onPress(index, refs, dims, scrollIntoView)
            }
          : undefined
        return (
          <GalleryPrimitive.Item
            key={image.thumb + index}
            label={image.alt || l`Image ${index + 1} of ${images.length}`}>
            {({focusRef, tabIndex, onFocus}) => (
              <GalleryImage
                largeAltBadge={largeAltBadge}
                image={image}
                contentHeight={contentHeight}
                index={index}
                imageCount={images.length}
                focusRef={focusRef}
                tabIndex={tabIndex}
                onFocus={onFocus}
                onContainerRef={registerContainerRef}
                onThumbDims={setThumbDims}
                onPress={openLightboxAtIndex}
                onPressIn={onPressIn ? () => onPressIn(index) : undefined}
                onPreviewPress={openLightboxAtIndex}
              />
            )}
          </GalleryPrimitive.Item>
        )
      })}
    </GalleryPrimitive.Root>
  )
}

function GalleryImage({
  contentHeight: height,
  image,
  index,
  imageCount,
  focusRef,
  tabIndex,
  onFocus,
  largeAltBadge,
  onContainerRef,
  onThumbDims,
  onPress,
  onPressIn,
  onPreviewPress,
}: {
  contentHeight: number
  image: app.bsky.embed.images.ViewImage
  index: number
  imageCount: number
  focusRef: GalleryPrimitive.ItemFocusProps['focusRef']
  tabIndex: GalleryPrimitive.ItemFocusProps['tabIndex']
  onFocus: GalleryPrimitive.ItemFocusProps['onFocus']
  largeAltBadge?: boolean
  onContainerRef: (index: number, ref: AnimatedRef, registered: boolean) => void
  onThumbDims: (index: number, dims: Dimensions | null) => void
  onPress?: () => void
  onPressIn?: () => void
  onPreviewPress?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [focused, setFocused] = useState(false)
  const containerRef = useAnimatedRef()
  const [aspectRatio, setAspectRatio] = useState(() =>
    getAspectRatio(image.aspectRatio),
  )
  const {isCropped, ...dims} = computeDims({height, aspectRatio})
  const hasAlt = !!image.alt

  useEffect(() => {
    onContainerRef(index, containerRef, true)
    return () => {
      onContainerRef(index, containerRef, false)
      onThumbDims(index, null)
    }
  }, [index, containerRef, onContainerRef, onThumbDims])

  return (
    <Animated.View ref={containerRef} collapsable={false}>
      <ImageContextMenu
        fullsizeUri={image.fullsize}
        thumbUri={image.thumb}
        aspectRatio={aspectRatio}
        borderRadius={tokens.borderRadius.md}
        onPreviewPress={onPreviewPress}>
        <Pressable
          ref={focusRef}
          tabIndex={tabIndex}
          onPress={onPress}
          onPressIn={onPressIn}
          onFocus={() => {
            onFocus()
            setFocused(true)
          }}
          onBlur={() => setFocused(false)}
          accessibilityRole="button"
          accessibilityLabel={image.alt || l`Image ${index + 1}`}
          accessibilityHint={l`Opens full image`}
          android_ripple={{
            color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
            foreground: true,
          }}
          style={({pressed}) => [
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
            web([
              {
                cursor: 'inherit',
                outline: 0,
                border: 0,
              },
              a.transition_transform,
              {transitionDuration: '200ms'},
              pressed && {transform: [{scale: 0.99}]},
            ]),
          ]}>
          <Image
            source={{uri: image.thumb}}
            contentFit="cover"
            accessible={true}
            accessibilityLabel={image.alt}
            accessibilityHint=""
            accessibilityIgnoresInvertColors
            loading={index === 0 ? 'eager' : 'lazy'}
            style={[dims]}
            onLoad={e => {
              /*
               * Only sync from the loaded thumb if we don't already have a
               * ratio from the record. The CDN scales thumbs to integer pixel
               * dims, so its reported ratio drifts a fraction from the
               * record's - re-syncing would jiggle the gallery item widths.
               */
              if (aspectRatio === undefined) {
                const ar = getAspectRatio(e.source)
                if (ar !== undefined) {
                  setAspectRatio(ar)
                }
              }
              onThumbDims(index, {
                width: e.source.width,
                height: e.source.height,
              })
            }}
            useAppleWebpCodec
          />

          {imageCount > 1 ? (
            <View
              accessible={false}
              pointerEvents="none"
              style={[
                a.absolute,
                a.justify_center,
                a.rounded_sm,
                a.p_xs,
                t.atoms.bg_contrast_25,
                {
                  top: a.p_xs.padding,
                  right: a.p_xs.padding,
                  opacity: 0.8,
                },
                largeAltBadge && {
                  padding: 6,
                },
              ]}>
              <Text
                style={[
                  a.font_bold,
                  largeAltBadge ? a.text_xs : {fontSize: 8},
                ]}>
                <Trans
                  context="gallery-badge-image-position-numbers"
                  comment="Badge showing the current image position out of the total number of images in a gallery.">
                  {index + 1}/{imageCount}
                </Trans>
              </Text>
            </View>
          ) : null}

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
                largeAltBadge && {
                  gap: 4,
                },
              ]}>
              {isCropped && (
                <View
                  accessible={false}
                  style={[
                    a.rounded_sm,
                    a.p_xs,
                    t.atoms.bg_contrast_25,
                    {
                      opacity: 0.8,
                    },
                    largeAltBadge && {
                      padding: 6,
                    },
                  ]}>
                  <Fullscreen
                    fill={t.atoms.text_contrast_high.color}
                    width={largeAltBadge ? 18 : 12}
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
                    largeAltBadge && {
                      padding: 6,
                    },
                  ]}>
                  <Text
                    style={[
                      a.font_bold,
                      largeAltBadge ? a.text_xs : {fontSize: 8},
                    ]}>
                    <Trans>ALT</Trans>
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          <MediaInsetBorder
            style={
              focused && {
                borderWidth: 2,
              }
            }
          />
        </Pressable>
      </ImageContextMenu>
    </Animated.View>
  )
}
