import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTrendingSettings} from '#/state/preferences/trending'
import {atoms as a, useLayoutBreakpoints} from '#/alf'
import {Button} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {TrendingInterstitial} from '#/components/interstitials/Trending'
import * as Toast from '#/components/Toast'
import {LiveEventFeedCardWide} from '#/features/liveEvents/components/LiveEventFeedCardWide'
import {useUserPreferencedLiveEvents} from '#/features/liveEvents/context'
import {useUpdateLiveEventPreferences} from '#/features/liveEvents/preferences'
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
  const layout = feed.layouts.wide

  const {mutate: update, variables} = useUpdateLiveEventPreferences({
    feed,
    metricContext: 'discover',
    onUpdateSuccess({undoAction}) {
      Toast.show(
        <Toast.Outer>
          <Toast.Icon />
          <Toast.Text>
            {undoAction ? (
              <Trans>Live event hidden</Trans>
            ) : (
              <Trans>Live event unhidden</Trans>
            )}
          </Toast.Text>
          {undoAction && (
            <Toast.Action
              label={_(msg`Undo`)}
              onPress={() => {
                if (undoAction) {
                  update(undoAction)
                }
              }}>
              <Trans>Undo</Trans>
            </Toast.Action>
          )}
        </Toast.Outer>,
        {type: 'success'},
      )
    },
  })

  if (variables) return null

  return (
    <>
      <View style={[a.px_lg, a.pt_md, a.pb_xs]}>
        <View>
          <LiveEventFeedCardWide feed={feed} metricContext="discover" />

          <Button
            label={_(msg`Dismiss live event banner`)}
            size="tiny"
            shape="round"
            style={[a.absolute, a.z_10, {top: 6, right: 6}]}
            onPress={() => {
              update({type: 'hideFeed', id: feed.id})
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
                <CloseIcon size="xs" fill={layout.textColor} style={[a.z_20]} />
              </>
            )}
          </Button>
        </View>
      </View>
    </>
  )
}
