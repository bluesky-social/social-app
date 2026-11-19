import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {
  type AtmosphereFeedbackForContent,
  AtmosphereFeedbackProvider,
} from '#/screens/Atmosphere/feedback'
import {AtmosphereContentItem} from '#/screens/Atmosphere/metrics/context'
import {atoms as a} from '#/alf'
import * as Gallery from '#/components/Gallery'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PhotoCard} from './PhotoCard'

const CARD_WIDTH = 225

export function FeaturedPhotos({
  photos,
  feedback,
}: {
  photos: app.bsky.embed.external.ViewGallery[]
  feedback?: AtmosphereFeedbackForContent
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
              <View style={[a.flex_grow]}>
                <AtmosphereContentItem
                  contentType="gallery"
                  contentId={photo.uri}
                  section="photos"
                  position={index}>
                  <View style={[a.flex_grow, {width: CARD_WIDTH}]}>
                    <AtmosphereFeedbackProvider
                      value={feedback?.({type: 'gallery', view: photo})}>
                      <PhotoCard photo={photo} galleryFocus={galleryFocus} />
                    </AtmosphereFeedbackProvider>
                  </View>
                </AtmosphereContentItem>
              </View>
            )}
          </Gallery.Item>
        ))}
      </Gallery.Root>
    </View>
  )
}
