import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {
  type AtmosphereFeedbackForContent,
  AtmosphereFeedbackProvider,
  useAtmosphereFeedback,
} from '#/screens/Atmosphere/feedback'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {
  AtmosphereContentItem,
  useLogContentPress,
} from '#/screens/Atmosphere/metrics/context'
import {atoms as a} from '#/alf'
import {Document} from '#/components/atmosphere/SiteStandard/Document'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'

export function FeaturedArticles({
  articles,
  feedback,
}: {
  articles: app.bsky.embed.external.ViewArticle[]
  feedback?: AtmosphereFeedbackForContent
}) {
  const {t: l} = useLingui()

  if (!articles.length) return null

  return (
    <View>
      <View style={[a.pb_sm, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
        <ExploreSectionHeader title={l`Featured articles`} />
      </View>
      <View
        testID="atmosphereArticlesList"
        style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
        {articles.map((article, index) => (
          <AtmosphereContentItem
            key={article.uri}
            item={getContentMetricContextProps('article', article, {
              section: 'articles',
              position: index,
            })}>
            <AtmosphereFeedbackProvider
              value={feedback?.({type: 'article', view: article})}>
              <Article article={article} />
            </AtmosphereFeedbackProvider>
          </AtmosphereContentItem>
        ))}
      </View>
    </View>
  )
}

function Article({article}: {article: app.bsky.embed.external.ViewArticle}) {
  const logPress = useLogContentPress()
  const sendFeedback = useAtmosphereFeedback()
  return (
    <Document
      variant="compact"
      hideMeta
      view={article}
      onPressCallback={source => {
        logPress('external', source)
        sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
      }}
      onShareCallback={() =>
        sendFeedback?.('app.bsky.feed.defs#interactionShare')
      }
    />
  )
}
