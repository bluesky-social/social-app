import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type AtmosphereLivestreamCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a} from '#/alf'
import {ExploreGallery} from './ExploreGallery'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {LivestreamCard} from './LivestreamCard'

const CARD_WIDTH = 214

export function FeaturedLivestreams({
  livestreams,
}: {
  livestreams: AtmosphereLivestreamCardData[]
}) {
  const {t: l} = useLingui()

  if (!livestreams.length) return null

  return (
    <View style={[a.gap_md]}>
      <ExploreSectionHeader
        title={l`Featured livestreams`}
        label={l`See more livestreams`}
      />
      <ExploreGallery
        items={livestreams}
        label={l`Featured livestreams`}
        testID="atmosphereLivestreamsGallery"
        renderItem={(item, galleryFocus) => (
          <LivestreamCard
            livestream={item}
            width={CARD_WIDTH}
            galleryFocus={galleryFocus}
          />
        )}
      />
    </View>
  )
}
