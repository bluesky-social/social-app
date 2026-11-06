import {Fragment} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {atoms as a} from '#/alf'
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
            <DocumentCompact
              view={article}
              containerStyle={[
                a.py_md,
                {paddingHorizontal: EXPLORE_SECTION_PADDING},
              ]}
            />
          </Fragment>
        ))}
      </View>
    </View>
  )
}
