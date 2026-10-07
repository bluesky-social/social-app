import {ScrollView, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens} from '#/alf'
import {type AtmosphereLivestreamCardData} from '../exploreData'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {LivestreamCard} from './LivestreamCard'

const CARD_WIDTH = 214

export function FeaturedLivestreams({
  livestreams,
}: {
  livestreams: AtmosphereLivestreamCardData[]
}) {
  const {t: l} = useLingui()

  if (!livestreams.length) return null

  return (
    <View style={[a.gap_md]}>
      <ExploreSectionHeader
        title={l`Featured livestreams`}
        label={l`See more livestreams`}
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
          {livestreams.map(livestream => (
            <LivestreamCard
              key={livestream.id}
              livestream={livestream}
              width={CARD_WIDTH}
            />
          ))}
        </ScrollView>
      </BlockDrawerGesture>
    </View>
  )
}
