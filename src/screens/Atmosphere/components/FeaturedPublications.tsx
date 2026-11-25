import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {
  AtmosphereContentItem,
  useLogContentPress,
} from '#/screens/Atmosphere/metrics/context'
import {atoms as a} from '#/alf'
import * as Gallery from '#/components/Gallery'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PublicationRailCard} from './PublicationRailCard'

const CARD_WIDTH = 220

export function FeaturedPublications({
  publications,
}: {
  publications: app.bsky.embed.external.ViewArticlePublication[]
}) {
  const {t: l} = useLingui()

  if (!publications.length) return null

  return (
    <Gallery.Bleed>
      <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
        <ExploreSectionHeader title={l`Featured publications`} />
        <Gallery.Root
          stretch
          label={l`Featured publications`}
          testID="atmospherePublicationsGallery">
          {publications.map((publication, index) => (
            <Gallery.Item key={publication.uri} label={publication.title}>
              {galleryFocus => (
                <View style={[a.flex_grow]}>
                  <AtmosphereContentItem
                    item={getContentMetricContextProps(
                      'publication',
                      publication,
                      {section: 'publications', position: index},
                    )}>
                    <Publication
                      publication={publication}
                      galleryFocus={galleryFocus}
                    />
                  </AtmosphereContentItem>
                </View>
              )}
            </Gallery.Item>
          ))}
        </Gallery.Root>
      </View>
    </Gallery.Bleed>
  )
}

function Publication({
  publication,
  galleryFocus,
}: {
  publication: app.bsky.embed.external.ViewArticlePublication
  galleryFocus: Gallery.ItemFocusProps
}) {
  const logPress = useLogContentPress()
  return (
    <PublicationRailCard
      publication={publication}
      width={CARD_WIDTH}
      galleryFocus={galleryFocus}
      onPressCallback={source => logPress('external', source)}
    />
  )
}
