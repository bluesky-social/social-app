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
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type tools} from '#/lexicons'

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
  const displayedPreferences = updatePreferences.isPending
    ? {...preferences, ...updatePreferences.variables}
    : preferences

  const onChangePreference = (
    key: keyof tools.ozone.inbox.putNotificationPreferences.$InputBody,
    value: boolean,
  ) => {
    if (isDisabled) return
    updatePreferences.mutate({[key]: value})
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
            <Trans>Moderation inbox settings</Trans>
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
            name="reports-notifications"
            label={l({
              context: 'moderation-inbox-setting',
              message: 'Your reports notifications',
            })}
            description={l({
              context: 'moderation-inbox-setting',
              message: 'Get notified about your report outcomes.',
            })}
            disabled={isDisabled}
            loading={preferencesQuery.isLoading}
            value={displayedPreferences?.reports ?? false}
            onChange={value => onChangePreference('reports', value)}
          />
          <NotificationToggle
            name="account-notifications"
            label={l({
              context: 'moderation-inbox-setting',
              message: 'Your account notifications',
            })}
            description={l({
              context: 'moderation-inbox-setting',
              message: 'Get notified about actions taken against you.',
            })}
            disabled={isDisabled}
            loading={preferencesQuery.isLoading}
            value={displayedPreferences?.account ?? false}
            onChange={value => onChangePreference('account', value)}
          />
          <NotificationToggle
            name="labels-notifications"
            label={l({
              context: 'moderation-inbox-setting',
              message: 'Account labeling notifications',
            })}
            description={l({
              context: 'moderation-inbox-setting',
              message:
                'Get notified when a label is added to your account and posts.',
            })}
            disabled={isDisabled}
            loading={preferencesQuery.isLoading}
            value={displayedPreferences?.labels ?? false}
            onChange={value => onChangePreference('labels', value)}
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
  loading = false,
  value,
  onChange,
}: {
  name: string
  label: string
  description?: string
  disabled?: boolean
  loading?: boolean
  value: boolean
  onChange: (value: boolean) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const accessibilityLabel = description ? l`${label}. ${description}` : label
  const content = (
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
      {loading ? <Loader /> : <Toggle.Platform />}
    </SettingsList.Item>
  )

  if (loading) {
    return (
      <View
        testID={name}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={l`Loading notification settings`}
        accessibilityState={{busy: true}}>
        {content}
      </View>
    )
  }

  return (
    <Toggle.Item
      testID={name}
      type="checkbox"
      name={name}
      label={accessibilityLabel}
      value={value}
      disabled={disabled}
      onChange={onChange}>
      {content}
    </Toggle.Item>
  )
}
