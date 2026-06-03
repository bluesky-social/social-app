import {useRef} from 'react'
import {InteractionManager, View} from 'react-native'
import {type AnimatedRef} from 'react-native-reanimated'
import {Image} from 'expo-image'

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

/**
 * Posts with more than this many images render the swipeable carousel
 * (Gallery) instead of the static grid (ImageLayoutGrid). Per the Photos v2
 * spec: show the grid for up to 4 photos, show the carousel for more than 4.
 * The grid only supports up to 4 images, so this is also the grid's max.
 */
const GALLERY_IMAGE_THRESHOLD = 4

export function ImageEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'images'>
}) {
  const ax = useAnalytics()
  const {openLightbox} = useLightboxControls()
  const {images} = embed.view
  // PostGalleryEmbedEnable is kept as a kill-switch for the carousel. When the
  // flag is ON (the intended state), the grid-vs-carousel choice follows
  // GALLERY_IMAGE_THRESHOLD: 2-4 images use the existing grid, >4 use the
  // carousel. The 2-4 grid is intentionally preserved (decoupled from the 4->10
  // launch) per the Photos v2 spec. When the flag is OFF, the carousel is
  // suppressed entirely and we fall back to the pre-carousel behavior: the grid
  // renders the first 4 images. NOTE: with the flag OFF, images beyond the first
  // 4 are not shown - this is the same limitation the grid always had, and only
  // matters as a deliberate kill-switch state. See OPEN QUESTIONS in the PR.
  const galleryEnabled = ax.features.enabled(ax.features.PostGalleryEmbedEnable)
  const useGallery = galleryEnabled && images.length > GALLERY_IMAGE_THRESHOLD

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

    if (useGallery) {
      return (
        <View style={[a.mt_sm, rest.style]}>
          <Gallery
            images={images}
            onPress={onPress}
            onPressIn={onPressIn}
            viewContext={rest.viewContext}
            isWithinQuote={rest.isWithinQuote}
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
