import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {atoms as a} from '#/alf'
import {PublicationCard} from '#/components/atmosphere/SiteStandard/Publication'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'

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
        <PublicationCard key={publication.uri} view={publication} />
      ))}
    </View>
  )
}
