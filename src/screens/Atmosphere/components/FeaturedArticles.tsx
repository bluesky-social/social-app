import {Fragment} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, tokens} from '#/alf'
import {DocumentCompact} from '#/components/atmosphere/SiteStandard/DocumentCompact'
import {Divider} from '#/components/Divider'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'

export function FeaturedArticles({
  articles,
}: {
  articles: app.bsky.embed.external.ViewArticle[]
}) {
  const {t: l} = useLingui()

  if (!articles.length) return null

  return (
    <View>
      <ExploreSectionHeader title={l`Featured articles`} />
      {/* Bleed through ExploreTab's px_lg so links include the page gutter. */}
      <View
        testID="atmosphereArticlesList"
        style={{marginHorizontal: -tokens.space.lg}}>
        {articles.map((article, index) => (
          <Fragment key={article.uri}>
            {index > 0 && <Divider style={[a.mx_lg, {width: 'auto'}]} />}
            <DocumentCompact
              view={article}
              containerStyle={[a.px_lg, a.py_md]}
            />
          </Fragment>
        ))}
      </View>
    </View>
  )
}
