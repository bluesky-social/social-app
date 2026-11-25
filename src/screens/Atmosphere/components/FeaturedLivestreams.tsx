import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {AtmosphereContentItem} from '#/screens/Atmosphere/metrics/context'
import {atoms as a} from '#/alf'
import * as Gallery from '#/components/Gallery'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {LivestreamCard} from './LivestreamCard'

const CARD_WIDTH = 214

export function FeaturedLivestreams({
  livestreams,
  title,
}: {
  livestreams: app.bsky.embed.external.ViewLivestream[]
  /** Defaults to "Featured livestreams". */
  title?: string
}) {
  const {t: l} = useLingui()
  const sectionTitle = title ?? l`Featured livestreams`

  if (!livestreams.length) return null

  return (
    <Gallery.Bleed>
      <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
        <ExploreSectionHeader title={sectionTitle} />
        <Gallery.Root
          stretch
          label={sectionTitle}
          testID="atmosphereLivestreamsGallery">
          {livestreams.map((livestream, index) => (
            <Gallery.Item key={livestream.uri} label={livestream.title}>
              {galleryFocus => (
                <View style={[a.flex_grow]}>
                  <AtmosphereContentItem
                    item={getContentMetricContextProps(
                      'livestream',
                      livestream,
                      {
                        section: 'livestreams',
                        position: index,
                      },
                    )}>
                    <LivestreamCard
                      livestream={livestream}
                      width={CARD_WIDTH}
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
