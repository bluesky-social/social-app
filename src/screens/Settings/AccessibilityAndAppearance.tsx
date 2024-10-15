import React from 'react'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {
  useInAppBrowser,
  useSetInAppBrowser,
} from '#/state/preferences/in-app-browser'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'
import {Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon} from '#/components/icons/Accessibility'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'AccessibilityAndAppearanceSettings'
>
export function AccessibilityAndAppearanceSettingsScreen({}: Props) {
  const {_} = useLingui()
  const inAppBrowserPref = useInAppBrowser()
  const setUseInAppBrowser = useSetInAppBrowser()

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Accessibility and Appearance`)} />
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.LinkItem
            to="/settings/accessibility"
            label={_(msg`Accessibility`)}>
            <SettingsList.ItemIcon icon={AccessibilityIcon} />
            <SettingsList.ItemText>
              <Trans>Accessibilty</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/appearance"
            label={_(msg`Appearance`)}>
            <SettingsList.ItemIcon icon={PaintRollerIcon} />
            <SettingsList.ItemText>
              <Trans>Appearance</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          {isNative && (
            <>
              <SettingsList.Divider />
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
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
