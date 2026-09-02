import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {NotFoundScreen} from '#/view/screens/NotFound'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function ModerationInboxSettingsScreen() {
  const {t: l} = useLingui()
  const ax = useAnalytics()

  // TODO Local state is a placeholder. -dsb
  const [reportNotifications, setReportNotifications] = useState(false)
  const [accountNotifications, setAccountNotifications] = useState(false)
  const [labelingNotifications, setLabelingNotifications] = useState(false)

  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)

  if (!isEnabled) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="moderationInboxSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans comment="Moderation inbox settings">
              Mod inbox settings
            </Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <NotificationToggle
            name="report-notifications"
            label={l({
              context: 'moderation-inbox-setting',
              message: 'Your reports notifications',
            })}
            titleText={
              <Trans context="moderation-inbox-setting">
                Your reports notifications
              </Trans>
            }
            descriptionText={
              <Trans context="moderation-inbox-setting">
                Get notified about your report outcomes.
              </Trans>
            }
            value={reportNotifications}
            onChange={setReportNotifications}
          />
          <NotificationToggle
            name="account-notifications"
            label={l({
              context: 'moderation-inbox-setting',
              message: 'Your account notifications',
            })}
            titleText={
              <Trans context="moderation-inbox-setting">
                Your account notifications
              </Trans>
            }
            descriptionText={
              <Trans context="moderation-inbox-setting">
                Get notified about actions taken against you.
              </Trans>
            }
            value={accountNotifications}
            onChange={setAccountNotifications}
          />
          <NotificationToggle
            name="labeling-notifications"
            label={l({
              context: 'moderation-inbox-setting',
              message: 'Account labeling notifications',
            })}
            titleText={
              <Trans context="moderation-inbox-setting">
                Account labeling notifications
              </Trans>
            }
            descriptionText={
              <Trans context="moderation-inbox-setting">
                Get notified when a label is added to your account and posts.
              </Trans>
            }
            disabled
            value={labelingNotifications}
            onChange={setLabelingNotifications}
          />
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function NotificationToggle({
  name,
  label,
  titleText,
  descriptionText,
  disabled = false,
  value,
  onChange,
}: {
  name: string
  label: string
  titleText: React.ReactNode
  descriptionText: React.ReactNode
  disabled?: boolean
  value: boolean
  onChange: (value: boolean) => void
}) {
  const t = useTheme()

  return (
    <Toggle.Item
      type="checkbox"
      name={name}
      label={label}
      value={value}
      disabled={disabled}
      onChange={onChange}>
      <SettingsList.Item>
        <View style={[a.flex_1, a.gap_2xs]}>
          <Text
            style={[
              a.text_md,
              a.font_medium,
              disabled ? t.atoms.text_contrast_low : undefined,
            ]}>
            {titleText}
          </Text>
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              disabled
                ? t.atoms.text_contrast_low
                : t.atoms.text_contrast_medium,
            ]}>
            {descriptionText}
          </Text>
        </View>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}
