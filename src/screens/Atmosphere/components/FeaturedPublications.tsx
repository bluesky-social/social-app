import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type AtmospherePublicationCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a} from '#/alf'
import {ExploreGallery} from './ExploreGallery'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PublicationCard} from './PublicationCard'

const CARD_WIDTH = 320

export function FeaturedPublications({
  publications,
}: {
  publications: AtmospherePublicationCardData[]
}) {
  const {t: l} = useLingui()

  if (!publications.length) return null

  return (
    <View style={[a.gap_md]}>
      <ExploreSectionHeader title={l`Featured publications`} />
      <ExploreGallery
        items={publications}
        label={l`Featured publications`}
        testID="atmospherePublicationsGallery"
        renderItem={(publication, galleryFocus) => (
          <PublicationCard
            publication={publication}
            width={CARD_WIDTH}
            galleryFocus={galleryFocus}
          />
        )}
      />
    </View>
  )
}
