import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useAutoplayDisabled, useSetAutoplayDisabled} from '#/state/preferences'
import {
  useInAppBrowser,
  useSetInAppBrowser,
} from '#/state/preferences/in-app-browser'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {Hashtag_Stroke2_Corner0_Rounded as HashtagIcon} from '#/components/icons/Hashtag'
import {Home_Stroke2_Corner2_Rounded as HomeIcon} from '#/components/icons/Home'
import {Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon} from '#/components/icons/Macintosh'
import {Play_Stroke2_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ContentAndMediaSettings'
>
export function ContentAndMediaSettingsScreen({}: Props) {
  const {_} = useLingui()
  const autoplayDisabledPref = useAutoplayDisabled()
  const setAutoplayDisabledPref = useSetAutoplayDisabled()
  const inAppBrowserPref = useInAppBrowser()
  const setUseInAppBrowser = useSetInAppBrowser()

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Content and Media`)} />
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.LinkItem
            to="/settings/saved-feeds"
            label={_(msg`Manage saved feeds`)}>
            <SettingsList.ItemIcon icon={HashtagIcon} />
            <SettingsList.ItemText>
              <Trans>Manage saved feeds</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/threads"
            label={_(msg`Thread preferences`)}>
            <SettingsList.ItemIcon icon={BubblesIcon} />
            <SettingsList.ItemText>
              <Trans>Thread preferences</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/following-feed"
            label={_(msg`Following feed preferences`)}>
            <SettingsList.ItemIcon icon={HomeIcon} />
            <SettingsList.ItemText>
              <Trans>Following feed preferences</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/external-embeds"
            label={_(msg`External media`)}>
            <SettingsList.ItemIcon icon={MacintoshIcon} />
            <SettingsList.ItemText>
              <Trans>External media</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.Divider />
          {isNative && (
            <Toggle.Item
              name="use_in_app_browser"
              label={_(msg`Use in-app browser to open links`)}
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
            label={_(msg`Autoplay videos and GIFs`)}
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
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
