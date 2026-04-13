import {useCallback, useEffect, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import {type AnimatedRef, useAnimatedRef} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import useEmblaCarousel from 'embla-carousel-react'

import {type Dimensions} from '#/lib/media/types'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme} from '#/alf'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

const CONTAINER_ASPECT_RATIO = 3 / 2
const ITEM_GAP = 8
const MIN_PEEK = 40

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

export function Gallery({
  images,
  onPress,
  onPressIn,
  viewContext,
}: GalleryProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const currentPageRef = useRef(0)
  const containerRef = useRef<View>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [insetLeft, setInsetLeft] = useState(0)
  const [insetRight, setInsetRight] = useState(0)
  const insetLeftRef = useRef(0)

  const containerRefs = useRef<AnimatedRef<any>[]>([]).current
  const thumbDimsRef = useRef<(Dimensions | null)[]>([])

  const ref0 = useAnimatedRef()
  const ref1 = useAnimatedRef()
  const ref2 = useAnimatedRef()
  const ref3 = useAnimatedRef()
  const refs = [ref0, ref1, ref2, ref3]
  for (let i = 0; i < images.length; i++) {
    containerRefs[i] = refs[i]
  }

  const isWithinQuote =
    viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
  const hideBadges = isWithinQuote

  const QUOTE_PADDING = 12
  const containerHeight =
    containerWidth > 0 ? containerWidth / CONTAINER_ASPECT_RATIO : 0

  const getItemWidth = (image: AppBskyEmbedImages.ViewImage, index: number) => {
    const ar = image.aspectRatio
    let width = containerHeight
    if (ar && ar.width > 0 && ar.height > 0) {
      const ratio = ar.width / ar.height
      const clamped = Math.max(2 / 3, Math.min(ratio, 3 / 2))
      width = containerHeight * clamped
    }
    // Ensure the first image leaves room for a peek of the next
    if (index === 0 && images.length > 1) {
      width = Math.min(width, containerWidth - MIN_PEEK)
    }
    return width
  }

  // Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: () => insetLeftRef.current,
    containScroll: 'trimSnaps',
    dragFree: true,
  })

  // Track page changes for analytics
  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      const page = emblaApi.selectedScrollSnap()
      if (page !== currentPageRef.current) {
        ax.metric('post:gallery:swipe', {
          fromIndex: currentPageRef.current,
          toIndex: page,
          totalImages: images.length,
        })
        currentPageRef.current = page
      }
    }
    const onDragStart = () => setIsDragging(true)
    const onDragEnd = () => setIsDragging(false)
    emblaApi.on('select', onSelect)
    emblaApi.on('pointerDown', onDragStart)
    emblaApi.on('pointerUp', onDragEnd)
    emblaApi.on('settle', onDragEnd)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('pointerDown', onDragStart)
      emblaApi.off('pointerUp', onDragEnd)
      emblaApi.off('settle', onDragEnd)
    }
  }, [emblaApi, ax, images.length])

  // Re-initialize Embla when bleed measurements change
  useEffect(() => {
    if (emblaApi) emblaApi.reInit()
  }, [emblaApi, insetLeft, insetRight])

  // Suppress click after drag
  const pointerDown = useRef(false)
  const dragged = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!emblaApi) return
    const root = emblaApi.rootNode()

    const onPointerDown = () => {
      pointerDown.current = true
      dragged.current = false
    }
    const onPointerMove = () => {
      if (pointerDown.current) dragged.current = true
    }
    const onPointerUp = () => {
      pointerDown.current = false
    }
    const onClick = (e: MouseEvent) => {
      if (dragged.current) {
        e.stopPropagation()
        e.preventDefault()
      }
    }

    root.addEventListener('pointerdown', onPointerDown)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerup', onPointerUp)
    root.addEventListener('click', onClick, true)
    return () => {
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', onPointerUp)
      root.removeEventListener('click', onClick, true)
    }
  }, [emblaApi])

  // Bleed measurement
  const measureBleed = useCallback(() => {
    if (isWithinQuote) return
    requestAnimationFrame(() => {
      const el = containerRef.current as unknown as HTMLElement
      if (!el) return
      const galleryRect = el.getBoundingClientRect()
      let parent: HTMLElement | null = el.parentElement
      while (parent) {
        const ps = window.getComputedStyle(parent)
        const pl = parseFloat(ps.paddingLeft)
        const pr = parseFloat(ps.paddingRight)
        if (pl >= 8 && pr >= 8) {
          const parentRect = parent.getBoundingClientRect()
          const il = galleryRect.left - parentRect.left
          insetLeftRef.current = il
          setInsetLeft(il)
          setInsetRight(parentRect.right - galleryRect.right)
          break
        }
        parent = parent.parentElement
      }
    })
  }, [isWithinQuote])

  const isBleed = !isWithinQuote && (insetLeft > 0 || insetRight > 0)

  return (
    <View
      style={
        containerWidth > 0
          ? isWithinQuote
            ? {
                height: containerHeight,
                overflow: 'hidden' as const,
                width: containerWidth + QUOTE_PADDING * 2,
                marginLeft: -QUOTE_PADDING,
              }
            : {height: containerHeight, overflow: 'visible' as const}
          : {aspectRatio: CONTAINER_ASPECT_RATIO}
      }
      ref={containerRef}
      onLayout={e => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && containerWidth === 0) setContainerWidth(w)
        measureBleed()
      }}
      role="group"
      aria-roledescription="carousel"
      aria-label={l`Image gallery, ${images.length} images`}>
      {containerWidth > 0 && (
        <div
          style={{
            overflow: 'hidden',
            width: isBleed ? containerWidth + insetLeft + insetRight : '100%',
            marginLeft: isBleed ? -insetLeft : 0,
            height: containerHeight,
          }}>
          <div
            ref={emblaRef}
            style={{
              overflow: 'visible',
              width: isBleed ? containerWidth + insetLeft + insetRight : '100%',
              height: containerHeight,
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}>
            <div
              style={{
                display: 'flex',
                gap: ITEM_GAP,
                paddingLeft: isWithinQuote ? QUOTE_PADDING : insetLeft,
                paddingRight: isWithinQuote ? QUOTE_PADDING : 0,
                height: containerHeight,
              }}>
              {images.map((image, index) => (
                <Slide
                  key={index}
                  width={getItemWidth(image, index)}
                  height={containerHeight}>
                  <View
                    ref={containerRefs[index]}
                    collapsable={false}
                    style={[
                      {
                        width: getItemWidth(image, index),
                        height: containerHeight,
                      },
                    ]}
                    aria-roledescription="slide"
                    aria-label={
                      image.alt || l`Image ${index + 1} of ${images.length}`
                    }>
                    <Pressable
                      onPress={
                        onPress
                          ? () => {
                              if (dragged.current) return
                              ax.metric('post:gallery:openLightbox', {
                                imageIndex: index,
                                totalImages: images.length,
                              })
                              onPress(
                                index,
                                containerRefs.slice(0, images.length),
                                thumbDimsRef.current.slice(),
                              )
                            }
                          : undefined
                      }
                      onPressIn={onPressIn ? () => onPressIn(index) : undefined}
                      accessibilityRole="button"
                      accessibilityLabel={
                        image.alt || l`Image ${index + 1} of ${images.length}`
                      }
                      accessibilityHint={l`Opens full image`}
                      style={[
                        a.flex_1,
                        a.rounded_md,
                        a.overflow_hidden,
                        t.atoms.bg_contrast_25,
                      ]}>
                      <Image
                        source={{uri: image.thumb}}
                        style={[a.flex_1]}
                        contentFit="cover"
                        accessible={true}
                        accessibilityLabel={image.alt}
                        accessibilityHint=""
                        accessibilityIgnoresInvertColors
                        onLoad={e => {
                          thumbDimsRef.current[index] = {
                            width: e.source.width,
                            height: e.source.height,
                          }
                        }}
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                      <MediaInsetBorder />
                    </Pressable>
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
                  </View>
                </Slide>
              ))}
              {(isBleed ? insetRight > 0 : isWithinQuote) && (
                <div
                  aria-hidden
                  style={{
                    flex: `0 0 ${Math.max(0, (isBleed ? insetRight : QUOTE_PADDING) - ITEM_GAP)}px`,
                    minWidth: 0,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </View>
  )
}

function Slide({
  width,
  height,
  children,
}: {
  width: number
  height: number
  children: React.ReactNode
}) {
  const [pressed, setPressed] = useState(false)
  return (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerMove={() => setPressed(false)}
      style={{
        flex: `0 0 ${width}px`,
        minWidth: 0,
        height,
        transition: 'transform 0.15s ease-out',
        transform: pressed ? 'scale(0.975)' : undefined,
      }}>
      {children}
    </div>
  )
}
