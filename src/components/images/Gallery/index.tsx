import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  isValidElement,
} from 'react'
import {FlatList, Pressable, useWindowDimensions, View} from 'react-native'
import Animated, {type AnimatedRef, useAnimatedRef} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'
import {utils} from '@bsky.app/alf'
import {Trans, useLingui} from '@lingui/react/macro'

import {mergeRefs} from '#/lib/merge-refs'
import {type Dimensions} from '#/lib/media/types'
import {useA11y} from '#/state/a11y'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {useKeyboardHandlers} from '#/components/images/Gallery/useKeyboardHandlers'
import {usePointerHandlers} from '#/components/images/Gallery/usePointerHandlers'
import {ITEM_GAP} from '#/components/images/Gallery/const'
import {IS_WEB} from '#/env'

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
  const ax = useAnalytics()
  const {screenReaderEnabled} = useA11y()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const bps = useBreakpoints()
  const window = useWindowDimensions()
  const contentHeight = useMemo(() => {
    if (bps.gtMobile) {
      return 300
    } else if (bps.gtPhone) {
      return 260
    } else {
      return 200
    }
  }, [bps])
  const isWithinQuote =
    viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
  const hideBadges = isWithinQuote

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
  const insetLeft = contentDims?.x ?? 0
  const insetRight =
    bleedWidth - (contentDims?.x ?? 0) - (contentDims?.width ?? 0) || 0
  const width = bleedWidth || Math.min(600, window.width)
  /* End container overflow styles */

  const flatListRef = useRef<FlatList>(null)
  const itemWidthsRef = useRef<Map<number, number>>(new Map())
  const itemRefsRef = useRef<Map<number, View>>(new Map())
  const containerRefsRef = useRef<Map<number, AnimatedRef<any>>>(new Map())
  const thumbDimsRef = useRef<Map<number, Dimensions>>(new Map())
  const currentIndexRef = useRef(0)

  const setCurrentIndex = (index: number) => {
    const prev = currentIndexRef.current
    if (prev !== index) {
      currentIndexRef.current = index
      ax.metric('post:gallery:swipe', {
        fromIndex: prev,
        toIndex: index,
        totalImages: images.length,
      })
    }
  }

  const scrollTo = (offset: number) => {
    flatListRef.current?.scrollToOffset({offset, animated: false})
  }

  const onSettle = (index: number) => {
    setCurrentIndex(index)
    if (!IS_WEB) return
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
            key={image.thumb}
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
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          decelerationRate={0.993}
          directionalLockEnabled
          nestedScrollEnabled
          alwaysBounceVertical={false}
          scrollEventThrottle={16}
          data={images}
          keyExtractor={item => item.thumb}
          renderItem={({item, index}) => {
            return (
              <GalleryImage
                hideBadges={hideBadges}
                largeAltBadge={largeAltBadge}
                image={item}
                contentHeight={contentHeight}
                index={index}
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
                          imageIndex: index,
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

function getAspectRatio({
  width,
  height,
}: {width?: number; height?: number} = {}) {
  if (width && width > 0 && height && height > 0) {
    return width / height
  }
  return undefined
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
   */
  const width = Math.floor(height * (aspectRatio ?? 1))
  return {width, height, aspectRatio}
}

function GalleryImage({
  contentHeight: height,
  image,
  index,
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
  const containerRef = useAnimatedRef()
  const [aspectRatio, setAspectRatio] = useState(() =>
    getAspectRatio(image.aspectRatio),
  )
  const dims = computeDims({height, aspectRatio})

  useEffect(() => {
    onWidthChange(index, dims.width)
  }, [index, dims.width, onWidthChange])

  useEffect(() => {
    onContainerRef(index, containerRef)
  }, [index, containerRef, onContainerRef])

  return (
    <Animated.View ref={containerRef} collapsable={false}>
      <Pressable
        ref={itemRef}
        onPress={onPress}
        onPressIn={onPressIn}
        accessibilityRole="button"
        accessibilityLabel={
          image.alt || l`Image ${index + 1}`
        }
        accessibilityHint={l`Opens full image`}
        android_ripple={{
          color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
          foreground: true,
        }}
        style={[a.rounded_md, a.overflow_hidden, t.atoms.bg_contrast_25]}>
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

        {image.alt && !hideBadges ? (
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
              largeAltBadge && {
                gap: 4,
                padding: 5,
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
        ) : null}

        <MediaInsetBorder />
      </Pressable>
    </Animated.View>
  )
}
