import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {FlatList, Pressable, useWindowDimensions, View} from 'react-native'
import Animated, {
  type AnimatedRef,
  useAnimatedRef,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'
import {utils} from '@bsky.app/alf'
import {Trans, useLingui} from '@lingui/react/macro'
import debounce from 'lodash.debounce'

import {type Dimensions} from '#/lib/media/types'
import {mergeRefs} from '#/lib/merge-refs'
import {useA11y} from '#/state/a11y'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as Fullscreen} from '#/components/icons/ArrowsDiagonal'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {
  ITEM_GAP,
  MAX_ASPECT_RATIO,
  MIN_ASPECT_RATIO,
} from '#/components/images/Gallery/const'
import {useKeyboardHandlers} from '#/components/images/Gallery/useKeyboardHandlers'
import {usePointerHandlers} from '#/components/images/Gallery/usePointerHandlers'
import {getAspectRatio} from '#/components/images/Gallery/utils'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'

export * from './const'
export * from './maybeApplyGalleryOffsetStyles'

interface GalleryProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (
    index: number,
    containerRefs: AnimatedRef<any>[],
    fetchedDims: (Dimensions | null)[],
  ) => void
  onPressIn?: (index: number) => void
  viewContext?: PostEmbedViewContext
}

const Context = createContext<{
  bleedRef: React.RefObject<View | null>
  bleedWidth: number
}>({
  bleedRef: {current: null},
  bleedWidth: 0,
})

export function GalleryBleed({children}: {children: React.ReactNode}) {
  const ref = useRef<View>(null)
  const [bleedWidth, setBleedWidth] = useState(0)

  if (!isValidElement(children)) {
    throw new Error('GalleryBleed children must be a single React element')
  }

  const node = children as React.ReactElement<any>

  return (
    <Context.Provider value={{bleedRef: ref, bleedWidth}}>
      {cloneElement(node, {
        ref: mergeRefs([ref, node?.props?.ref]),
        onLayout: (e: {nativeEvent: {layout: {width: number}}}) => {
          setBleedWidth(e.nativeEvent.layout.width)
          node.props.onLayout?.(e)
        },
        style: [node.props.style, a.overflow_hidden],
      })}
    </Context.Provider>
  )
}

export function useGalleryBleed() {
  return useContext(Context)
}

export function Gallery({
  images,
  onPress,
  onPressIn,
  viewContext,
}: GalleryProps) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {screenReaderEnabled} = useA11y()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const bps = useBreakpoints()
  const window = useWindowDimensions()
  const isWithinQuote =
    viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
  const isWithinChat = viewContext === PostEmbedViewContext.ChatMessage
  const hideBadges = isWithinQuote
  const contentHeight = useMemo(() => {
    if (isWithinChat) {
      return 120
    }
    if (bps.gtMobile) {
      return 300
    } else if (bps.gtPhone) {
      return 260
    } else {
      return 200
    }
  }, [bps, isWithinChat])

  /*
   * Container overflow styles
   *
   * Uses measureLayout to get the Gallery's offset relative to the GalleryBleed
   * ancestor. This is a layout-relative measurement that doesn't depend on
   * scroll position, so it works correctly for off-screen FlatList items.
   */
  const {bleedRef, bleedWidth} = useGalleryBleed()
  const contentRef = useRef<View>(null)
  const [contentDims, setContentDims] = useState<{x: number; width: number}>()
  const measure = () => {
    if (contentRef.current && bleedRef.current) {
      contentRef.current.measureLayout(
        bleedRef.current,
        (x, _y, w) => {
          setContentDims({x, width: w})
        },
        () => {},
      )
    }
  }
  const width = bleedWidth || Math.min(600, window.width)
  const insetLeft = contentDims?.x ?? 0
  const insetRight =
    bleedWidth > 0
      ? bleedWidth - (contentDims?.x ?? 0) - (contentDims?.width ?? 0)
      : 0
  /* End container overflow styles */

  const flatListRef = useRef<FlatList>(null)
  const itemWidthsRef = useRef<Map<number, number>>(new Map())
  const itemRefsRef = useRef<Map<number, View>>(new Map())
  const containerRefsRef = useRef<Map<number, AnimatedRef<any>>>(new Map())
  const thumbDimsRef = useRef<Map<number, Dimensions>>(new Map())
  const currentIndexRef = useRef(0)

  const emitSwipeMetric = useMemo(
    () =>
      debounce((fromIndex: number, toIndex: number) => {
        ax.metric('post:gallery:swipe', {
          fromImage: fromIndex + 1, // convert to 1-based index for easier analysis
          toImage: toIndex + 1, // convert to 1-based index for easier analysis
          totalImages: images.length,
        })
      }, 200),
    [ax, images.length],
  )

  const setCurrentIndex = (index: number) => {
    const prev = currentIndexRef.current
    if (prev !== index) {
      currentIndexRef.current = index
      emitSwipeMetric(prev, index)
    }
  }

  const scrollTo = (offset: number) => {
    flatListRef.current?.scrollToOffset({offset, animated: false})
  }

  const onSettle = (index: number) => {
    setCurrentIndex(index)
    if (!IS_WEB) return
    // Update tabIndex: only the active image is tab-focusable
    itemRefsRef.current.forEach((node, i) => {
      const el = node as unknown as HTMLElement
      el.tabIndex = i === index ? 0 : -1
    })
    const el = itemRefsRef.current.get(index) as unknown as HTMLElement | null
    el?.focus({preventScroll: true})
  }

  useKeyboardHandlers({
    flatListRef,
    itemWidthsRef,
    currentIndexRef,
    scrollTo,
    onSettle,
    imageCount: images.length,
  })

  usePointerHandlers({
    flatListRef,
    itemWidthsRef,
    currentIndexRef,
    scrollTo,
    onSettle,
    imageCount: images.length,
  })

  if (screenReaderEnabled) {
    return (
      <View style={[a.relative, a.gap_sm]}>
        {images.map((image, index) => (
          <AutoSizedImage
            key={image.thumb + index}
            crop={
              viewContext === PostEmbedViewContext.ThreadHighlighted
                ? 'none'
                : viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
                  ? 'square'
                  : 'constrained'
            }
            image={image}
            onPress={(containerRef, dims) =>
              onPress?.(index, [containerRef], [dims])
            }
            onPressIn={() => onPressIn?.(index)}
            hideBadge={
              viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
            }
          />
        ))}
      </View>
    )
  }

  return (
    <View
      ref={contentRef}
      style={[
        a.w_full,
        {
          height: contentHeight,
          overflow: 'visible',
        },
      ]}
      onLayout={measure}>
      <BlockDrawerGesture>
        <FlatList
          ref={flatListRef}
          role="group"
          aria-roledescription={l`carousel`}
          aria-label={l`Image gallery, ${images.length} images`}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          directionalLockEnabled
          nestedScrollEnabled
          alwaysBounceVertical={false}
          scrollEventThrottle={16}
          data={images}
          keyExtractor={(item, index) => item.thumb + index}
          renderItem={({item, index}) => {
            return (
              <GalleryImage
                hideBadges={hideBadges}
                largeAltBadge={largeAltBadge}
                image={item}
                contentHeight={contentHeight}
                index={index}
                imageCount={images.length}
                onWidthChange={(i, w) => {
                  itemWidthsRef.current.set(i, w)
                }}
                itemRef={node => {
                  if (node) {
                    itemRefsRef.current.set(index, node)
                  } else {
                    itemRefsRef.current.delete(index)
                  }
                }}
                onContainerRef={(i, ref) => {
                  containerRefsRef.current.set(i, ref)
                }}
                onThumbDims={(i, dims) => {
                  thumbDimsRef.current.set(i, dims)
                }}
                onPress={
                  onPress
                    ? () => {
                        ax.metric('post:gallery:openLightbox', {
                          fromImage: index + 1, // convert to 1-based index for easier analysis
                          totalImages: images.length,
                        })
                        const refs: AnimatedRef<any>[] = []
                        const dims: (Dimensions | null)[] = []
                        for (let i = 0; i < images.length; i++) {
                          refs.push(containerRefsRef.current.get(i)!)
                          dims.push(thumbDimsRef.current.get(i) ?? null)
                        }
                        onPress(index, refs, dims)
                      }
                    : undefined
                }
                onPressIn={onPressIn ? () => onPressIn(index) : undefined}
              />
            )
          }}
          onScroll={e => {
            // web handles via onSettle in the web hooks
            if (IS_WEB) return
            const offsetX = e.nativeEvent.contentOffset.x
            let accumulated = 0
            for (let i = 0; i < images.length; i++) {
              const w = (itemWidthsRef.current.get(i) ?? 0) + ITEM_GAP
              if (offsetX < accumulated + w / 2) {
                setCurrentIndex(i)
                break
              }
              accumulated += w
              if (i === images.length - 1) {
                setCurrentIndex(i)
              }
            }
          }}
          style={[
            {
              height: contentHeight,
              marginLeft: -insetLeft,
              width,
            },
          ]}
          contentContainerStyle={{
            gap: ITEM_GAP,
            paddingLeft: insetLeft,
            paddingRight: insetRight,
          }}
        />
      </BlockDrawerGesture>
    </View>
  )
}

function computeDims({
  height,
  aspectRatio,
}: {
  height: number
  aspectRatio?: number
}) {
  /*
   * Old images, or images from other clients can sometimes not have
   * aspectRatio populated. In these cases, default to square and we'll
   * resize once the image loads.
   *
   * Clamp between MIN_ASPECT_RATIO (portrait) and MAX_ASPECT_RATIO
   * (landscape) so items stay a reasonable size in the carousel.
   */
  const raw = aspectRatio ?? 1
  const clamped = Math.max(MIN_ASPECT_RATIO, Math.min(raw, MAX_ASPECT_RATIO))
  const width = Math.floor(height * clamped)
  return {width, height, aspectRatio: clamped, isCropped: raw !== clamped}
}

function GalleryImage({
  contentHeight: height,
  image,
  index,
  imageCount,
  onWidthChange,
  itemRef,
  hideBadges,
  largeAltBadge,
  onContainerRef,
  onThumbDims,
  onPress,
  onPressIn,
}: {
  contentHeight: number
  image: AppBskyEmbedImages.ViewImage
  index: number
  imageCount: number
  onWidthChange: (index: number, width: number) => void
  itemRef: (node: View | null) => void
  hideBadges?: boolean
  largeAltBadge?: boolean
  onContainerRef: (index: number, ref: AnimatedRef<any>) => void
  onThumbDims: (index: number, dims: Dimensions) => void
  onPress?: () => void
  onPressIn?: () => void
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
    onWidthChange(index, dims.width)
  }, [index, dims.width, onWidthChange])

  useEffect(() => {
    onContainerRef(index, containerRef)
  }, [index, containerRef, onContainerRef])

  return (
    <Animated.View
      ref={containerRef}
      collapsable={false}
      aria-roledescription={l`slide`}
      aria-label={image.alt || l`Image ${index + 1} of ${imageCount}`}>
      <Pressable
        ref={itemRef}
        tabIndex={index === 0 ? 0 : -1}
        onPress={onPress}
        onPressIn={onPressIn}
        onFocus={() => setFocused(true)}
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
            const ar = getAspectRatio(e.source)
            if (ar && ar !== aspectRatio) {
              setAspectRatio(ar)
            }
            onThumbDims(index, {
              width: e.source.width,
              height: e.source.height,
            })
          }}
        />

        {(hasAlt || isCropped) && !hideBadges ? (
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
    </Animated.View>
  )
}
