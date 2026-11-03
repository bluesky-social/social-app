import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {type app} from '#/lexicons'
import {ArticleCard} from './ArticleCard'
import {ExploreGallery} from './ExploreGallery'
import {ExploreSectionHeader} from './ExploreSectionHeader'

const CARD_WIDTH = 250

export function FeaturedArticles({
  articles,
}: {
  articles: app.bsky.embed.external.ViewArticle[]
}) {
  const {t: l} = useLingui()

  if (!articles.length) return null

  return (
    <View style={[a.gap_md]}>
      <ExploreSectionHeader title={l`Featured articles`} />
      <ExploreGallery
        items={articles}
        label={l`Featured articles`}
        testID="atmosphereArticlesGallery"
        renderItem={(item, galleryFocus) => (
          <ArticleCard
            article={item}
            width={CARD_WIDTH}
            galleryFocus={galleryFocus}
          />
        )}
      />
    </View>
  )
}
