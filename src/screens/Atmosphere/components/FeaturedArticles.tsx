import {ScrollView, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens} from '#/alf'
import {type AtmosphereArticleCardData} from '../exploreData'
import {ArticleCard} from './ArticleCard'
import {ExploreSectionHeader} from './ExploreSectionHeader'

const CARD_WIDTH = 214

export function FeaturedArticles({
  articles,
}: {
  articles: AtmosphereArticleCardData[]
}) {
  const {t: l} = useLingui()

  if (!articles.length) return null

  return (
    <View style={[a.gap_md]}>
      <ExploreSectionHeader
        title={l`Featured articles`}
        label={l`See more articles`}
      />
      <BlockDrawerGesture>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginHorizontal: -tokens.space.lg}}
          contentContainerStyle={[
            a.flex_row,
            a.flex_nowrap,
            a.align_stretch,
            a.gap_md,
            {
              paddingLeft: tokens.space.lg,
              paddingRight: tokens.space.lg,
              paddingBottom: tokens.space.md,
            },
          ]}>
          {articles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              width={CARD_WIDTH}
            />
          ))}
        </ScrollView>
      </BlockDrawerGesture>
    </View>
  )
}
