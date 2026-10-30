import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type AtmospherePhotoCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a} from '#/alf'
import {ExploreGallery} from './ExploreGallery'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PhotoCard} from './PhotoCard'

const CARD_WIDTH = 225

export function FeaturedPhotos({photos}: {photos: AtmospherePhotoCardData[]}) {
  const {t: l} = useLingui()

  if (!photos.length) return null

  return (
    <View style={[a.gap_md]}>
      <ExploreSectionHeader title={l`Featured photos`} />
      <ExploreGallery
        items={photos}
        label={l`Featured photos`}
        testID="atmospherePhotosGallery"
        renderItem={(photo, galleryFocus) => (
          <View style={[a.flex_grow, {width: CARD_WIDTH}]}>
            <PhotoCard photo={photo} galleryFocus={galleryFocus} />
          </View>
        )}
      />
    </View>
  )
}
