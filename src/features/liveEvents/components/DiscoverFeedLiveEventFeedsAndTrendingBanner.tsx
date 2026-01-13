import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTrendingSettings} from '#/state/preferences/trending'
import {atoms as a, useLayoutBreakpoints, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {TrendingInterstitial} from '#/components/interstitials/Trending'
import * as Prompt from '#/components/Prompt'
import {LiveEventFeedCardWide} from '#/features/liveEvents/components/LiveEventFeedCardWide'
import {useLiveEvents} from '#/features/liveEvents/context'
import {device, useStorage} from '#/storage'

export function DiscoverFeedLiveEventFeedsAndTrendingBanner() {
  const t = useTheme()
  const {_} = useLingui()
  const events = useLiveEvents()
  const {rightNavVisible} = useLayoutBreakpoints()
  const {trendingDisabled} = useTrendingSettings()
  const promptControl = Prompt.usePromptControl()
  const [bannerDisabled, setBannerDisabled] = useStorage(device, [
    'liveEventFeedsBannerDisabled',
  ])

  const feed = events.feeds.at(0)

  if (!feed || bannerDisabled) {
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
              promptControl.open()
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
                <CloseIcon
                  size="xs"
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

      <Prompt.Basic
        control={promptControl}
        title={_(msg`Disable the live event banner?`)}
        description={_(
          msg`Live events appear occasionally when something exciting is happening that we think you might like. You can always re-enable this banner from your Content & Media settings page.`,
        )}
        confirmButtonCta={_(msg`Disable banner`)}
        onConfirm={() => {
          setBannerDisabled(true)
        }}
      />
    </>
  )
}
