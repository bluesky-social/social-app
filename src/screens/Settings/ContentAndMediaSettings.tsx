import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useAutoplayDisabled,
  useFeedShowMoreBatchSize,
  useFeedShowMoreEnabled,
  useSetAutoplayDisabled,
  useSetFeedShowMoreBatchSize,
  useSetFeedShowMoreEnabled,
} from '#/state/preferences'
import {
  FEED_SHOW_MORE_BATCH_SIZES,
  isFeedShowMoreBatchSize,
} from '#/state/preferences/feed-show-more'
import {
  useInAppBrowser,
  useSetInAppBrowser,
} from '#/state/preferences/in-app-browser'
import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {useTrendingConfig} from '#/state/service-config'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as Toggle from '#/components/forms/Toggle'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Hashtag_Stroke2_Corner0_Rounded as HashtagIcon} from '#/components/icons/Hashtag'
import {Home_Stroke2_Corner2_Rounded as HomeIcon} from '#/components/icons/Home'
import {Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon} from '#/components/icons/Macintosh'
import {Play_Stroke2_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {Scroll_Stroke2_Corner0_Rounded as ScrollIcon} from '#/components/icons/Scroll'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ContentAndMediaSettings'
>
export function ContentAndMediaSettingsScreen({}: Props) {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const autoplayDisabledPref = useAutoplayDisabled()
  const setAutoplayDisabledPref = useSetAutoplayDisabled()
  const showMoreEnabled = useFeedShowMoreEnabled()
  const setShowMoreEnabled = useSetFeedShowMoreEnabled()
  const showMoreBatchSize = useFeedShowMoreBatchSize()
  const setShowMoreBatchSize = useSetFeedShowMoreBatchSize()
  const inAppBrowserPref = useInAppBrowser()
  const setUseInAppBrowser = useSetInAppBrowser()
  const {enabled: trendingEnabled} = useTrendingConfig()
  const {trendingDisabled, trendingVideoDisabled} = useTrendingSettings()
  const {setTrendingDisabled, setTrendingVideoDisabled} =
    useTrendingSettingsApi()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Content & Media</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.LinkItem
            to="/settings/saved-feeds"
            label={l`Manage saved feeds`}>
            <SettingsList.ItemIcon icon={HashtagIcon} />
            <SettingsList.ItemText>
              <Trans>Manage saved feeds</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/threads"
            label={l`Thread preferences`}>
            <SettingsList.ItemIcon icon={BubblesIcon} />
            <SettingsList.ItemText>
              <Trans>Thread preferences</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/following-feed"
            label={l`Following feed preferences`}>
            <SettingsList.ItemIcon icon={HomeIcon} />
            <SettingsList.ItemText>
              <Trans>Following feed preferences</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/external-embeds"
            label={l`External media`}>
            <SettingsList.ItemIcon icon={MacintoshIcon} />
            <SettingsList.ItemText>
              <Trans>External media</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/interests"
            label={l`Your interests`}>
            <SettingsList.ItemIcon icon={CircleInfo} />
            <SettingsList.ItemText>
              <Trans>Your interests</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.Divider />
          {IS_NATIVE && (
            <Toggle.Item
              name="use_in_app_browser"
              label={l`Use in-app browser to open links`}
              value={inAppBrowserPref ?? false}
              onChange={value => setUseInAppBrowser(value)}>
              <SettingsList.Item>
                <SettingsList.ItemIcon icon={WindowIcon} />
                <SettingsList.ItemText>
                  <Trans>Use in-app browser to open links</Trans>
                </SettingsList.ItemText>
                <Toggle.Platform />
              </SettingsList.Item>
            </Toggle.Item>
          )}
          <Toggle.Item
            name="disable_autoplay"
            label={l`Autoplay videos and GIFs`}
            value={!autoplayDisabledPref}
            onChange={value => setAutoplayDisabledPref(!value)}>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={PlayIcon} />
              <SettingsList.ItemText>
                <Trans>Autoplay videos and GIFs</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <SettingsList.Divider />
          <Toggle.Item
            testID="feedShowMoreToggle"
            name="feed_show_more"
            label={l`Enable infinite scroll`}
            value={!showMoreEnabled}
            onChange={value => setShowMoreEnabled(!value)}>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={ScrollIcon} />
              <SettingsList.ItemText>
                <Trans>Enable infinite scroll</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          {showMoreEnabled && (
            <View style={[a.w_full, a.px_xl, a.pt_2xs, a.pb_sm, a.gap_sm]}>
              <Text
                style={[
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                  a.w_full,
                ]}>
                <Trans>Number of posts shown at a time</Trans>
              </Text>
              <SegmentedControl.Root
                type="radio"
                label={l`Number of posts shown at a time`}
                value={String(showMoreBatchSize)}
                onChange={value => {
                  const nextBatchSize = Number(value)
                  if (isFeedShowMoreBatchSize(nextBatchSize)) {
                    setShowMoreBatchSize(nextBatchSize)
                  }
                }}>
                {FEED_SHOW_MORE_BATCH_SIZES.map(size => (
                  <SegmentedControl.Item
                    key={size}
                    label={String(size)}
                    value={String(size)}>
                    <SegmentedControl.ItemText>
                      {size}
                    </SegmentedControl.ItemText>
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </View>
          )}
          {trendingEnabled ? (
            <>
              <SettingsList.Divider />
              <Toggle.Item
                name="show_trending_topics"
                label={l`Enable trending topics`}
                value={!trendingDisabled}
                onChange={value => {
                  const hide = Boolean(!value)
                  if (hide) {
                    ax.metric('trendingTopics:hide', {context: 'settings'})
                  } else {
                    ax.metric('trendingTopics:show', {context: 'settings'})
                  }
                  setTrendingDisabled(hide)
                }}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={Graph} />
                  <SettingsList.ItemText>
                    <Trans>Enable trending topics</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
              <Toggle.Item
                name="show_trending_videos"
                label={l`Enable trending videos in your Discover feed`}
                value={!trendingVideoDisabled}
                onChange={value => {
                  const hide = Boolean(!value)
                  if (hide) {
                    ax.metric('trendingVideos:hide', {context: 'settings'})
                  } else {
                    ax.metric('trendingVideos:show', {context: 'settings'})
                  }
                  setTrendingVideoDisabled(hide)
                }}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={Graph} />
                  <SettingsList.ItemText>
                    <Trans>Enable trending videos in your Discover feed</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
            </>
          ) : null}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
