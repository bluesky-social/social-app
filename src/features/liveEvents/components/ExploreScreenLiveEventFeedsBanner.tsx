import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {LiveEventFeedCardWide} from '#/features/liveEvents/components/LiveEventFeedCardWide'
import {useLiveEvents} from '#/features/liveEvents/context'

export function ExploreScreenLiveEventFeedsBanner() {
  const t = useTheme()
  const events = useLiveEvents()
  return events.feeds.map(feed => (
    <View
      key={feed.id}
      style={[a.p_lg, a.border_b, t.atoms.border_contrast_low]}>
      <LiveEventFeedCardWide feed={feed} metricContext="explore" />
    </View>
  ))
}
