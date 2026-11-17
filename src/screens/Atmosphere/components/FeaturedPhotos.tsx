import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {AtmosphereContentItem} from '#/screens/Atmosphere/metrics/context'
import {atoms as a} from '#/alf'
import * as Gallery from '#/components/Gallery'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PhotoCard} from './PhotoCard'

const CARD_WIDTH = 225

export function FeaturedPhotos({
  photos,
}: {
  photos: app.bsky.embed.external.ViewGallery[]
}) {
  const {t: l} = useLingui()

  if (!photos.length) return null

  return (
    <View
      style={[a.gap_md, a.pb_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
      <ExploreSectionHeader title={l`Featured photos`} />
      <Gallery.Root
        stretch
        label={l`Featured photos`}
        testID="atmospherePhotosGallery">
        {photos.map((photo, index) => (
          <Gallery.Item key={photo.uri} label={photo.title}>
            {galleryFocus => (
              <AtmosphereContentItem
                style={[a.flex_grow]}
                contentType="gallery"
                contentId={photo.uri}
                section="photos"
                position={index}>
                <View style={[a.flex_grow, {width: CARD_WIDTH}]}>
                  <PhotoCard photo={photo} galleryFocus={galleryFocus} />
                </View>
              </AtmosphereContentItem>
            )}
          </Gallery.Item>
        ))}
      </Gallery.Root>
    </View>
  )
}
