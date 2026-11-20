import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {
  AtmosphereContentItem,
  useLogContentPress,
} from '#/screens/Atmosphere/metrics/context'
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
      {publications.map((publication, index) => (
        <AtmosphereContentItem
          key={publication.uri}
          item={getContentMetricContextProps('publication', publication, {
            section: 'publications',
            position: index,
          })}>
          <Publication publication={publication} />
        </AtmosphereContentItem>
      ))}
    </View>
  )
}

function Publication({
  publication,
}: {
  publication: app.bsky.embed.external.ViewArticlePublication
}) {
  const logPress = useLogContentPress()
  return (
    <PublicationCard
      view={publication}
      onEmbedInteractionCallback={() => logPress('external')}
    />
  )
}
