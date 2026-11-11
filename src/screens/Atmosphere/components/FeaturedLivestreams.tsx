import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {atoms as a} from '#/alf'
import * as Gallery from '#/components/Gallery'
import {type app} from '#/lexicons'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {LivestreamCard} from './LivestreamCard'

const CARD_WIDTH = 214

export function FeaturedLivestreams({
  livestreams,
}: {
  livestreams: app.bsky.embed.external.ViewLivestream[]
}) {
  const {t: l} = useLingui()

  if (!livestreams.length) return null

  return (
    <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
      <ExploreSectionHeader title={l`Featured livestreams`} />
      <Gallery.Root
        stretch
        label={l`Featured livestreams`}
        testID="atmosphereLivestreamsGallery">
        {livestreams.map(livestream => (
          <Gallery.Item key={livestream.uri} label={livestream.title}>
            {galleryFocus => (
              <View style={[a.flex_grow]}>
                <LivestreamCard
                  livestream={livestream}
                  width={CARD_WIDTH}
                  galleryFocus={galleryFocus}
                />
              </View>
            )}
          </Gallery.Item>
        ))}
      </Gallery.Root>
    </View>
  )
}
