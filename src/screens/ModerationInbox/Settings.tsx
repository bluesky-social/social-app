import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  useModerationInboxNotificationPreferencesQuery,
  useUpdateModerationInboxNotificationPreferencesMutation,
} from '#/state/queries/moderation-inbox'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
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

  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)
  const preferencesQuery =
    useModerationInboxNotificationPreferencesQuery(isEnabled)
  const updatePreferences =
    useUpdateModerationInboxNotificationPreferencesMutation()
  const preferences = preferencesQuery.data?.preferences
  const isDisabled =
    !preferences || preferencesQuery.isError || updatePreferences.isPending

  const onChangePush = (push: boolean) => {
    if (isDisabled) return
    updatePreferences.mutate({push})
  }

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
          {preferencesQuery.isError ? (
            <ErrorMessage
              message={l`Failed to load notification settings.`}
              onPressTryAgain={() => void preferencesQuery.refetch()}
            />
          ) : null}
          <NotificationToggle
            name="push-notifications"
            label={l`Push notifications`}
            disabled={isDisabled}
            value={
              updatePreferences.isPending
                ? updatePreferences.variables.push
                : (preferences?.push ?? false)
            }
            onChange={onChangePush}
          />
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function NotificationToggle({
  name,
  label,
  description,
  disabled = false,
  value,
  onChange,
}: {
  name: string
  label: string
  description?: string
  disabled?: boolean
  value: boolean
  onChange: (value: boolean) => void
}) {
  const t = useTheme()

  return (
    <Toggle.Item
      testID={name}
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
            {label}
          </Text>
          {description ? (
            <Text
              style={[
                a.text_sm,
                a.leading_snug,
                disabled
                  ? t.atoms.text_contrast_low
                  : t.atoms.text_contrast_medium,
              ]}>
              {description}
            </Text>
          ) : undefined}
        </View>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}
