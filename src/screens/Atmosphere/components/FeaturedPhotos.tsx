import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type AtmospherePhotoCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a} from '#/alf'
import {ExploreGallery} from './ExploreGallery'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PhotoCard} from './PhotoCard'

const CARD_WIDTH = 160

export function FeaturedPhotos({photos}: {photos: AtmospherePhotoCardData[]}) {
  const {t: l} = useLingui()

  if (!photos.length) return null

  return (
    <View style={[a.gap_md]}>
      <ExploreSectionHeader
        title={l`Featured photos`}
        label={l`See more photos`}
      />
      <ExploreGallery
        items={photos}
        label={l`Featured photos`}
        testID="atmospherePhotosGallery"
        renderItem={(photo, galleryFocus) => (
          <View style={{width: CARD_WIDTH}}>
            <PhotoCard photo={photo} galleryFocus={galleryFocus} />
          </View>
        )}
      />
    </View>
  )
}
