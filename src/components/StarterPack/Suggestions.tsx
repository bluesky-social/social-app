import {View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {AppBskyGraphDefs} from '@atproto/api'

import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useBreakpoints, web} from '#/alf'
import {Embed} from './StarterPackCard'

const DESKTOP_CARD_WIDTH = 400
const MOBILE_CARD_WIDTH = 300

export function Grid({
  isSuggestionsLoading,
  error,
  starterPacks,
}: {
  isSuggestionsLoading: boolean
  starterPacks: AppBskyGraphDefs.StarterPackViewBasic[]
  error: Error | null
}) {
  const moderationOpts = useModerationOpts()
  const {gtMobile} = useBreakpoints()
  const width = gtMobile ? DESKTOP_CARD_WIDTH : MOBILE_CARD_WIDTH
  const isLoading = isSuggestionsLoading || !moderationOpts
  const maxLength = gtMobile ? 4 : 6

  const content = isLoading ? (
    Array(maxLength)
      .fill(0)
      .map((_, i) => (
        <View
          key={i}
          style={[gtMobile && web([a.flex_0, {width: 'calc(50% - 6px)'}])]}>
          {/* TODO <SuggestedFollowPlaceholder /> */}
        </View>
      ))
  ) : error || !starterPacks.length ? null : (
    <>
      {starterPacks.slice(0, maxLength).map(starterPack => (
        <View key={starterPack.uri} style={[{width}]}>
          <Embed starterPack={starterPack} />
        </View>
      ))}
    </>
  )

  if (error || (!isLoading && !starterPacks.length)) {
    logger.debug(`Not enough starter packs to show suggested starter packs`)
    return null
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={width + a.gap_md.gap}
      decelerationRate="fast">
      <View style={[a.px_md, a.pt_sm, a.pb_lg, a.flex_row, a.gap_md]}>
        {content}
      </View>
    </ScrollView>
  )
}
