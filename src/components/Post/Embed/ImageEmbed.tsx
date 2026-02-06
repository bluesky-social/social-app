import {InteractionManager, View} from 'react-native'
import {
  type AnimatedRef,
  measure,
  type MeasuredDimensions,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {AtUri} from '@atproto/api'
import { format, parseISO } from "date-fns";

import {useLightboxControls} from '#/state/lightbox'
import {type Dimensions} from '#/view/com/lightbox/ImageViewing/@types'
import {atoms as a} from '#/alf'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {ImageLayoutGrid} from '#/components/images/ImageLayoutGrid'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {type EmbedType} from '#/types/bsky/post'
import {type CommonProps, type PostContextProps} from './types'

export function ImageEmbed({
  embed,
  ...rest
}: CommonProps &
  PostContextProps & {
  embed: EmbedType<'images'>
}) {
  const {openLightbox} = useLightboxControls()
  const {images} = embed.view

  const postRkey = rest?.postUri ? new AtUri(rest.postUri).rkey : undefined
  const handle = rest.postAuthorHandle
  // Filename-safe ISO 8601-compliant timestamp
  const timestamp = rest?.postCreatedAt
    ? format(parseISO(rest.postCreatedAt), "yyyy-MM-dd'T'HHmmss")
    : undefined
  // We need at least a handle and rkey to have
  // a meaningful filename for a saved image
  const canName = !!(handle && postRkey)

  if (images.length > 0) {
    const items = images.map((img, idx) => ({
      uri: img.fullsize,
      thumbUri: img.thumb,
      alt: img.alt,
      dimensions: img.aspectRatio ?? null,
      baseSaveName: canName
        ? (() => {
            const base = `${handle}_${postRkey}_img${idx + 1}`
            return timestamp ? `${base}_${timestamp}` : base
          })()
        : undefined,
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
      refs: AnimatedRef<any>[],
      fetchedDims: (Dimensions | null)[],
    ) => {
      runOnUI(() => {
        'worklet'
        const rects: (MeasuredDimensions | null)[] = []
        for (const r of refs) {
          rects.push(measure(r))
        }
        runOnJS(_openLightbox)(index, rects, fetchedDims)
      })()
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
