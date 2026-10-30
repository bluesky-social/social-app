import {useRef} from 'react'
import {View} from 'react-native'
import {type AnimatedRef} from 'react-native-reanimated'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {isSafeWebUrl} from '#/screens/Atmosphere/externalViews'
import {getGrainPhotos} from '#/screens/Atmosphere/photos'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {activityCollections} from '#/screens/Atmosphere/types'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Grain} from '#/components/icons/community/Grain'
import {Image_Stroke2_Corner2_Rounded as PhotoIcon} from '#/components/icons/Image'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {Gallery, GalleryBleed} from '#/components/images/Gallery'
import {useLightboxControls} from '#/components/Lightbox/state'
import {type Dimensions} from '#/components/Lightbox/types'
import {InlineLinkText, Link} from '#/components/Link'
import {ImageContextMenu} from '#/components/Post/Embed/ImageContextMenu'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  ActivityActorLine,
  ActivityCard,
  ActivityFootnote,
} from './ActivityPrimitives'

export function GrainGalleryActivityRenderer({
  item,
  computedItemView,
  testID,
}: ActivityRendererProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  if (!first) return null
  const images = getGrainPhotos(item)
  const gallery = bsky.isType(app.bsky.embed.external.viewGallery, first.view)
    ? first.view
    : undefined
  const href = gallery && isSafeWebUrl(gallery.uri) ? gallery.uri : undefined
  const title = gallery?.title.trim() || l`Gallery`
  const favorite = first.collection === activityCollections.grainFavorite
  const count = item.type === 'group' ? item.group.items.length : 1
  const timestamp =
    item.type === 'group' ? item.group.indexedAt : first.record.indexedAt
  const action = favorite
    ? count === 1
      ? l`favorited a gallery`
      : l`favorited ${plural(count, {one: '# gallery', other: '# galleries'})}`
    : count === 1
      ? l`posted a gallery`
      : l`posted ${plural(count, {one: '# gallery', other: '# galleries'})}`
  const metadata = (
    <ActivityActorLine
      actors={computedItemView.actors}
      action={action}
      timestamp={timestamp}
      showAvatars={images.length > 0}
    />
  )
  return (
    <View testID={testID} style={a.px_xl}>
      {images.length > 0 ? (
        <View testID="atmospherePhotoCard">
          <ActivityCard>
            <View style={[a.gap_md]}>
              <View style={[a.flex_row, a.align_center, a.justify_between]}>
                {metadata}
                <Link
                  to="https://bsky.app/profile/grain.social"
                  label={l`via Grain`}>
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    via{' '}
                  </Text>
                  <View
                    style={[
                      a.align_center,
                      a.justify_center,
                      {width: 36, height: 10},
                    ]}>
                    <Grain
                      width={36}
                      style={[a.absolute]}
                      fill={t.atoms.text_contrast_medium.color}
                    />
                  </View>
                </Link>
              </View>
              {gallery ? (
                href ? (
                  <InlineLinkText
                    to={href}
                    label={title}
                    emoji
                    style={[a.text_lg, a.font_semi_bold]}>
                    {title}
                  </InlineLinkText>
                ) : (
                  <Text emoji style={[a.text_lg, a.font_semi_bold]}>
                    {title}
                  </Text>
                )
              ) : null}
              {gallery?.description.trim() ? (
                <Text emoji style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  {gallery.description}
                </Text>
              ) : null}
              <PhotoMedia images={images} />
            </View>
          </ActivityCard>
        </View>
      ) : (
        <ActivityFootnote
          title={gallery?.title.trim() || l`Gallery unavailable`}
          to={href}
          icon={PhotoIcon}
          actors={computedItemView.actors}
          action={action}
          timestamp={timestamp}
          app={{
            name: 'Grain',
            to: 'https://bsky.app/profile/grain.social',
          }}
        />
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
