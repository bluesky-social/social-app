import {InteractionManager, View} from 'react-native'
import {MeasuredDimensions, runOnJS, runOnUI} from 'react-native-reanimated'
import {Image} from 'expo-image'

import {HandleRef, measureHandle} from '#/lib/hooks/useHandleRef'
import {useLightboxControls} from '#/state/lightbox'
import {Dimensions} from '#/view/com/lightbox/ImageViewing/@types'
import {AutoSizedImage} from '#/view/com/util/images/AutoSizedImage'
import {ImageLayoutGrid} from '#/view/com/util/images/ImageLayoutGrid'
import {PostEmbedViewContext} from '#/view/com/util/post-embeds/types'
import {atoms as a} from '#/alf'
import {EmbedType} from '#/types/bsky/post'
import {CommonProps} from './types'

export function ImageEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'images'>
}) {
  const {openLightbox} = useLightboxControls()
  const {images} = embed.view

  if (images.length > 0) {
    const items = images.map(img => ({
      uri: img.fullsize,
      thumbUri: img.thumb,
      alt: img.alt,
      dimensions: img.aspectRatio ?? null,
    }))
    const _openLightbox = (
      index: number,
      thumbRects: (MeasuredDimensions | null)[],
      fetchedDims: (Dimensions | null)[],
    ) => {
      openLightbox({
        images: items.map((item, i) => ({
          ...item,
          thumbRect: thumbRects[i] ?? null,
          thumbDimensions: fetchedDims[i] ?? null,
          type: 'image',
        })),
        index,
      })
    }
    const onPress = (
      index: number,
      refs: HandleRef[],
      fetchedDims: (Dimensions | null)[],
    ) => {
      const handles = refs.map(r => r.current)
      runOnUI(() => {
        'worklet'
        const rects = handles.map(measureHandle)
        runOnJS(_openLightbox)(index, rects, fetchedDims)
      })()
    }
    const onPressIn = (_: number) => {
      InteractionManager.runAfterInteractions(() => {
        Image.prefetch(items.map(i => i.uri))
      })
    }

    if (images.length === 1) {
      const image = images[0]
      return (
        <View style={[a.mt_sm, rest.style]}>
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
            onPress={(containerRef, dims) => onPress(0, [containerRef], [dims])}
            onPressIn={() => onPressIn(0)}
            hideBadge={
              rest.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
            }
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
