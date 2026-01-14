import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTrendingSettings} from '#/state/preferences/trending'
import {atoms as a, useLayoutBreakpoints, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {DotGrid_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {TrendingInterstitial} from '#/components/interstitials/Trending'
import {LiveEventFeedCardWide} from '#/features/liveEvents/components/LiveEventFeedCardWide'
import {
  LiveEventFeedOptionsMenu,
  useDialogControl,
} from '#/features/liveEvents/components/LiveEventFeedOptionsMenu'
import {useLiveEvents} from '#/features/liveEvents/context'
import {useLiveEventPreferences} from '#/features/liveEvents/preferences'

export function DiscoverFeedLiveEventFeedsAndTrendingBanner() {
  const t = useTheme()
  const {_} = useLingui()
  const events = useLiveEvents()
  const {rightNavVisible} = useLayoutBreakpoints()
  const {trendingDisabled} = useTrendingSettings()
  const optionsMenuControl = useDialogControl()
  const {data, isLoading} = useLiveEventPreferences()

  // user prefs should be loaded by now, but for TS-sake
  if (isLoading) return null

  const {hideAllFeeds, hiddenFeedIds} = data
  const feed = events.feeds.at(0)
  const feedHidden = feed?.id ? hiddenFeedIds.includes(feed?.id || '') : false

  if (!feed || hideAllFeeds || feedHidden) {
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

  const image = feed.images.wide

  return (
    <>
      <View style={[a.px_lg, a.pt_md, a.pb_xs]}>
        <View>
          <LiveEventFeedCardWide feed={feed} />

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
                      backgroundColor: feed.images.wide.overlayColor,
                      opacity: hovered || pressed ? 0.8 : 0.6,
                    },
                  ]}
                />
                <EllipsisIcon
                  size="sm"
                  fill={
                    image.textColor === 'light'
                      ? t.palette.white
                      : t.palette.black
                  }
                  style={[a.z_20]}
                />
              </>
            )}
          </Button>
        </View>
      </View>

      <LiveEventFeedOptionsMenu feed={feed} control={optionsMenuControl} />
    </>
  )
}
