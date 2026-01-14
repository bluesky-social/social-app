import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTrendingSettings} from '#/state/preferences/trending'
import {atoms as a, useLayoutBreakpoints} from '#/alf'
import {Button} from '#/components/Button'
import {DotGrid_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {TrendingInterstitial} from '#/components/interstitials/Trending'
import {LiveEventFeedCardWide} from '#/features/liveEvents/components/LiveEventFeedCardWide'
import {
  LiveEventFeedOptionsMenu,
  useDialogControl,
} from '#/features/liveEvents/components/LiveEventFeedOptionsMenu'
import {useUserPreferencedLiveEvents} from '#/features/liveEvents/context'
import {type LiveEventFeed} from '#/features/liveEvents/types'

export function DiscoverFeedLiveEventFeedsAndTrendingBanner() {
  const events = useUserPreferencedLiveEvents()
  const {rightNavVisible} = useLayoutBreakpoints()
  const {trendingDisabled} = useTrendingSettings()

  if (!events.feeds.length) {
    if (!rightNavVisible && !trendingDisabled) {
      // only show trending on mobile when live event banner is not shown
      return <TrendingInterstitial />
    } else {
      // no feed, no trending
      return null
    }
  }

  // On desktop, we show in the sidebar
  if (rightNavVisible) return null

  return events.feeds.map(feed => <Inner feed={feed} key={feed.id} />)
}

function Inner({feed}: {feed: LiveEventFeed}) {
  const {_} = useLingui()
  const optionsMenuControl = useDialogControl()
  const layout = feed.layouts.wide

  return (
    <>
      <View style={[a.px_lg, a.pt_md, a.pb_xs]}>
        <View>
          <LiveEventFeedCardWide feed={feed} metricContext="discover" />

          <Button
            label={_(msg`Configure live event banner`)}
            size="tiny"
            shape="round"
            style={[a.absolute, a.z_10, {top: 6, right: 6}]}
            onPress={() => {
              optionsMenuControl.open()
            }}>
            {({hovered, pressed}) => (
              <>
                <View
                  style={[
                    a.absolute,
                    a.inset_0,
                    a.rounded_full,
                    {
                      backgroundColor: layout.overlayColor,
                      opacity: hovered || pressed ? 0.8 : 0.6,
                    },
                  ]}
                />
                <EllipsisIcon
                  size="sm"
                  fill={layout.textColor}
                  style={[a.z_20]}
                />
              </>
            )}
          </Button>
        </View>
      </View>

      <LiveEventFeedOptionsMenu
        feed={feed}
        control={optionsMenuControl}
        metricContext="discover"
      />
    </>
  )
}
