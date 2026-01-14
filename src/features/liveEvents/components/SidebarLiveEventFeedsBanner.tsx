import {LiveEventFeedCardCompact} from '#/features/liveEvents/components/LiveEventFeedCardCompact'
import {useLiveEvents} from '#/features/liveEvents/context'

export function SidebarLiveEventFeedsBanner() {
  const events = useLiveEvents()
  return events.feeds.map(feed => (
    <LiveEventFeedCardCompact
      key={feed.id}
      feed={feed}
      metricContext="sidebar"
    />
  ))
}
