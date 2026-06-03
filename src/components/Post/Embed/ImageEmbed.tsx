import {useRef} from 'react'
import {InteractionManager, View} from 'react-native'
import {type AnimatedRef} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'

import {atoms as a, tokens} from '#/alf'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {Gallery} from '#/components/images/Gallery'
import {ImageLayoutGrid} from '#/components/images/ImageLayoutGrid'
import {useLightboxControls} from '#/components/Lightbox/state'
import {type Dimensions} from '#/components/Lightbox/types'
import {ImageContextMenu} from '#/components/Post/Embed/ImageContextMenu'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {useAnalytics} from '#/analytics'
import {type EmbedType} from '#/types/bsky/post'
import {type CommonProps} from './types'

const GRID_TO_CAROUSEL_THRESHOLD = 4

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
      ? embed.view.items.map(item => ({
          thumb: item.thumbnail,
          fullsize: item.fullsize,
          alt: item.alt,
          aspectRatio: item.aspectRatio,
        }))
      : embed.view.images
  const carouselEnabled =
    embed.type === 'gallery'
      ? images.length > GRID_TO_CAROUSEL_THRESHOLD
      : ax.features.enabled(ax.features.PostGalleryEmbedEnable)

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
                  : rest.viewContext ===
                      PostEmbedViewContext.FeedEmbedRecordWithMedia
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
              hideBadge={
                rest.viewContext ===
                PostEmbedViewContext.FeedEmbedRecordWithMedia
              }
            />
          </ImageContextMenu>
        </View>
      )
    }

    if (carouselEnabled) {
      return (
        <View style={[a.mt_sm, rest.style]}>
          <Gallery
            images={images}
            onPress={onPress}
            onPressIn={onPressIn}
            viewContext={rest.viewContext}
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
        />
      </View>
    )
  }
}
