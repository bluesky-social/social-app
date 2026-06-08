import {useEffect, useRef} from 'react'
import {InteractionManager, View} from 'react-native'
import {type AnimatedRef} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {AppBskyEmbedGallery, type AppBskyEmbedImages} from '@atproto/api'

import {atoms as a, tokens} from '#/alf'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {Gallery} from '#/components/images/Gallery'
import {ImageLayoutGrid} from '#/components/images/ImageLayoutGrid'
import {
  type LightboxMetricsContext,
  useLightboxControls,
} from '#/components/Lightbox/state'
import {type Dimensions} from '#/components/Lightbox/types'
import {ImageContextMenu} from '#/components/Post/Embed/ImageContextMenu'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {useAnalytics} from '#/analytics'
import {type EmbedType} from '#/types/bsky/post'
import {type CommonProps} from './types'

const MAX_GRID_IMAGES = 4

export function ImageEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'images'> | EmbedType<'gallery'>
}) {
  const ax = useAnalytics()
  const {openLightbox} = useLightboxControls()
  const images: AppBskyEmbedImages.ViewImage[] =
    embed.type === 'gallery'
      ? embed.view.items.filter(AppBskyEmbedGallery.isViewImage).map(item => ({
          thumb: item.thumbnail,
          fullsize: item.fullsize,
          alt: item.alt,
          aspectRatio: item.aspectRatio,
        }))
      : embed.view.images
  const useExpandedLayout =
    embed.type === 'gallery'
      ? images.length > MAX_GRID_IMAGES
      : ax.features.enabled(ax.features.PostGalleryEmbedEnable)

  const layout: 'single' | 'grid' | 'carousel' =
    images.length === 1 ? 'single' : useExpandedLayout ? 'carousel' : 'grid'

  const postContext =
    rest.uri && rest.authorDid
      ? {
          uri: rest.uri,
          authorDid: rest.authorDid,
          feedDescriptor: rest.feedDescriptor,
        }
      : undefined
  const metricsContext: LightboxMetricsContext | undefined = postContext
    ? {layout, ...postContext}
    : undefined

  // Impression: one per mount of a post photo embed. Covers all three layouts
  // identically so the opens/impressions CTR is unbiased by layout.
  useEffect(() => {
    if (images.length > 0 && postContext) {
      ax.metric('post:photoEmbed:impression', {
        layout,
        totalImages: images.length,
        ...postContext,
      })
    }
    // Fire once per mount; intentionally not reactive to post context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Captured from AutoSizedImage so the peek-commit handler can reuse the same
  // ref + dims that a tap would — keeps the lightbox's return animation intact.
  const singleContainerRef = useRef<AnimatedRef<any> | null>(null)
  const singleDimsRef = useRef<Dimensions | null>(null)

  if (images.length > 0) {
    const items = images.map(img => ({
      uri: img.fullsize,
      thumbUri: img.thumb,
      alt: img.alt,
      dimensions: img.aspectRatio ?? null,
    }))
    const onPress = (
      index: number,
      refs: AnimatedRef<any>[],
      fetchedDims: (Dimensions | null)[],
    ) => {
      if (postContext) {
        ax.metric('post:photoEmbed:open', {
          layout,
          fromImage: index + 1,
          totalImages: images.length,
          ...postContext,
        })
      }
      openLightbox({
        images: items.map((item, i) => ({
          ...item,
          thumbRect: null,
          thumbRef: refs[i] ?? null,
          thumbDimensions: fetchedDims[i] ?? null,
          thumbBorderRadius: tokens.borderRadius.md,
          type: 'image',
        })),
        index,
        metricsContext,
      })
    }
    const onPressIn = (_: number) => {
      InteractionManager.runAfterInteractions(() => {
        Image.prefetch(
          items.map(i => i.uri),
          'memory',
        )
      })
    }

    if (images.length === 1) {
      const image = images[0]
      const aspect =
        image.aspectRatio && image.aspectRatio.height > 0
          ? image.aspectRatio.width / image.aspectRatio.height
          : undefined
      const openFromSingle = () => {
        if (singleContainerRef.current) {
          onPress(0, [singleContainerRef.current], [singleDimsRef.current])
        }
      }
      return (
        <View style={[a.mt_sm, rest.style]}>
          <ImageContextMenu
            fullsizeUri={image.fullsize}
            thumbUri={image.thumb}
            aspectRatio={aspect}
            borderRadius={tokens.borderRadius.md}
            onPreviewPress={openFromSingle}>
            <AutoSizedImage
              crop={
                rest.viewContext === PostEmbedViewContext.ThreadHighlighted
                  ? 'none'
                  : rest.isWithinQuote
                    ? 'square'
                    : 'constrained'
              }
              image={image}
              onContainerRef={ref => {
                singleContainerRef.current = ref
              }}
              onDimsChange={dims => {
                singleDimsRef.current = dims
              }}
              onPress={(containerRef, dims) =>
                onPress(0, [containerRef], [dims])
              }
              onPressIn={() => onPressIn(0)}
              hideBadge={rest.isWithinQuote}
            />
          </ImageContextMenu>
        </View>
      )
    }

    if (useExpandedLayout) {
      return (
        <View style={[a.mt_sm, rest.style]}>
          <Gallery
            images={images}
            onPress={onPress}
            onPressIn={onPressIn}
            viewContext={rest.viewContext}
            isWithinQuote={rest.isWithinQuote}
            metricsPostContext={postContext}
          />
        </View>
      )
    }

    return (
      <View style={[a.mt_sm, rest.style]}>
        <ImageLayoutGrid
          images={images}
          onPress={onPress}
          onPressIn={onPressIn}
          viewContext={rest.viewContext}
          isWithinQuote={rest.isWithinQuote}
        />
      </View>
    )
  }
}
