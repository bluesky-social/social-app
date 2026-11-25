import {Fragment} from 'react'
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
import {DocumentCompact} from '#/components/atmosphere/SiteStandard/DocumentCompact'
import {Divider} from '#/components/Divider'
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
      <View testID="atmosphereArticlesList">
        {articles.map((article, index) => (
          <Fragment key={article.uri}>
            {index > 0 && (
              <Divider
                style={{
                  marginHorizontal: EXPLORE_SECTION_PADDING,
                  width: 'auto',
                }}
              />
            )}
            <AtmosphereContentItem
              item={getContentMetricContextProps('article', article, {
                section: 'articles',
                position: index,
              })}>
              <AtmosphereFeedbackProvider
                value={feedback?.({type: 'article', view: article})}>
                <Article article={article} />
              </AtmosphereFeedbackProvider>
            </AtmosphereContentItem>
          </Fragment>
        ))}
      </View>
    </View>
  )
}

function Article({article}: {article: app.bsky.embed.external.ViewArticle}) {
  const logPress = useLogContentPress()
  const sendFeedback = useAtmosphereFeedback()
  return (
    <DocumentCompact
      view={article}
      containerStyle={[a.py_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}
      onPressCallback={() => {
        logPress('external')
        sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
      }}
      onShareCallback={() =>
        sendFeedback?.('app.bsky.feed.defs#interactionShare')
      }
    />
  )
}
