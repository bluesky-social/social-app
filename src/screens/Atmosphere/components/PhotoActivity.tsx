import {useRef} from 'react'
import {View} from 'react-native'
import {type AnimatedRef} from 'react-native-reanimated'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {getGrainPhotos} from '#/screens/Atmosphere/photos'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {atoms as a, tokens} from '#/alf'
import {Image_Stroke2_Corner2_Rounded as PhotoIcon} from '#/components/icons/Image'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {Gallery, GalleryBleed} from '#/components/images/Gallery'
import {useLightboxControls} from '#/components/Lightbox/state'
import {type Dimensions} from '#/components/Lightbox/types'
import {ImageContextMenu} from '#/components/Post/Embed/ImageContextMenu'
import {type app} from '#/lexicons'
import {
  ActivityActorLine,
  ActivityCard,
  ActivityFootnote,
} from './ActivityPrimitives'

export function GrainPhotoActivityRenderer({
  item,
  computedItemView,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  if (!first) return null
  const images = getGrainPhotos(item)
  const count = item.type === 'group' ? item.group.items.length : 1
  const timestamp =
    item.type === 'group' ? item.group.indexedAt : first.record.indexedAt
  const metadata = (
    <ActivityActorLine
      actors={computedItemView.actors}
      action={
        count === 1
          ? l`posted a photo`
          : l`posted ${plural(count, {one: '# photo', other: '# photos'})}`
      }
      timestamp={timestamp}
      showAvatars={images.length > 0}
    />
  )
  return (
    <View testID={testID} style={a.px_xl}>
      {images.length > 0 ? (
        <View testID="atmospherePhotoCard">
          <ActivityCard>
            <View style={a.gap_md}>
              {metadata}
              <PhotoMedia images={images} />
            </View>
          </ActivityCard>
        </View>
      ) : (
        <ActivityFootnote
          title={count === 1 ? l`Photo unavailable` : l`Photos unavailable`}
          icon={PhotoIcon}>
          {metadata}
        </ActivityFootnote>
      )}
    </View>
  )
}

function PhotoMedia({images}: {images: app.bsky.embed.images.ViewImage[]}) {
  const {openLightbox} = useLightboxControls()
  const singleContainerRef = useRef<AnimatedRef | null>(null)
  const singleDimsRef = useRef<Dimensions | null>(null)

  const onPress = (
    index: number,
    refs: AnimatedRef[],
    fetchedDims: (Dimensions | null)[],
  ) => {
    /* Gallery's screen-reader fallback supplies only the selected image's ref. */
    const selectedOnly = refs.length === 1 && images.length > 1
    openLightbox({
      images: images.map((image, i) => ({
        uri: image.fullsize,
        thumbUri: image.thumb,
        alt: image.alt,
        dimensions: image.aspectRatio ?? null,
        thumbRect: null,
        thumbRef: selectedOnly
          ? i === index
            ? refs[0]
            : null
          : (refs[i] ?? null),
        thumbDimensions: selectedOnly
          ? i === index
            ? (fetchedDims[0] ?? null)
            : null
          : (fetchedDims[i] ?? null),
        thumbBorderRadius: tokens.borderRadius.md,
        type: 'image',
      })),
      index,
    })
  }

  if (images.length === 1) {
    const image = images[0]
    return (
      <View testID="atmosphereSinglePhoto">
        <ImageContextMenu
          fullsizeUri={image.fullsize}
          thumbUri={image.thumb}
          aspectRatio={
            image.aspectRatio
              ? image.aspectRatio.width / image.aspectRatio.height
              : undefined
          }
          borderRadius={tokens.borderRadius.md}
          onPreviewPress={() => {
            if (singleContainerRef.current)
              onPress(0, [singleContainerRef.current], [singleDimsRef.current])
          }}>
          <AutoSizedImage
            image={image}
            crop="constrained"
            onContainerRef={ref => {
              singleContainerRef.current = ref
            }}
            onDimsChange={dims => {
              singleDimsRef.current = dims
            }}
            onPress={(ref, dims) => onPress(0, [ref], [dims])}
          />
        </ImageContextMenu>
      </View>
    )
  }

  return (
    <GalleryBleed>
      <View testID="atmospherePhotoGallery">
        <Gallery images={images} onPress={onPress} />
      </View>
    </GalleryBleed>
  )
}
