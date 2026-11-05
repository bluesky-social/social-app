import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {atoms as a} from '#/alf'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PublicationCard} from './PublicationCard'

export function FeaturedPublications({
  publications,
}: {
  publications: app.bsky.embed.external.ViewArticlePublication[]
}) {
  const {t: l} = useLingui()

  if (!publications.length) return null

  return (
    <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
      <ExploreSectionHeader title={l`Featured publications`} />
      {publications.map(publication => (
        <PublicationCard key={publication.uri} publication={publication} />
      ))}
    </View>
  )
}
