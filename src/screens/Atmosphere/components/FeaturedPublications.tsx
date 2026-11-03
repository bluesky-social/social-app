import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type AtmospherePublicationCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a} from '#/alf'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PublicationCard} from './PublicationCard'

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
      {publications.map(publication => (
        <PublicationCard key={publication.id} publication={publication} />
      ))}
    </View>
  )
}
