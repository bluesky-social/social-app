/**
 * Activity & Recap settings sub-screen (S17, ticket i9KLo7kw).
 *
 * Two toggles: "Show daily streak" and "Show weekly recap" — both default
 * ON (X1). Past recaps link below. Fires the streak:optIn/Out and
 * recap:optIn/Out analytics events on toggle changes (B12 booleans-only
 * payloads). No re-prompt logic (G10).
 *
 * Hidden from the Content & Media list when the feature flag is off
 * (handled by ContentAndMediaSettings via useStreaksAndRecapEnabled).
 */

import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'
import {Flame_Stroke2_Corner1_Rounded as FlameIcon} from '#/components/icons/Flame'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkleIcon} from '#/components/icons/ListSparkle'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'
import {
  recapOptIn,
  recapOptOut,
  streakOptIn,
  streakOptOut,
} from '#/features/activityAndRecap/analytics/events'
import {useShowRecapPreference} from '#/features/activityAndRecap/hooks/useShowRecapPreference'
import {useShowStreakPreference} from '#/features/activityAndRecap/hooks/useShowStreakPreference'
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ActivityAndRecap'>
export function ActivityAndRecapSettingsScreen({}: Props) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const featureOn = useStreaksAndRecapEnabled()
  const [showStreak, setShowStreak] = useShowStreakPreference()
  const [showRecap, setShowRecap] = useShowRecapPreference()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Activity & Recap</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        {featureOn ? (
          <SettingsList.Container>
            <Toggle.Item
              name="show_daily_streak"
              label={_(msg`Show daily streak`)}
              value={showStreak}
              onChange={(value: boolean) => {
                setShowStreak(value)
                if (value) ax.metric(...streakOptIn())
                else ax.metric(...streakOptOut())
              }}>
              <SettingsList.Item>
                <SettingsList.ItemIcon icon={FlameIcon} />
                <SettingsList.ItemText>
                  <Trans>Show daily streak</Trans>
                </SettingsList.ItemText>
                <Toggle.Platform />
              </SettingsList.Item>
            </Toggle.Item>
            <Toggle.Item
              name="show_weekly_recap"
              label={_(msg`Show weekly recap`)}
              value={showRecap}
              onChange={(value: boolean) => {
                setShowRecap(value)
                if (value) ax.metric(...recapOptIn())
                else ax.metric(...recapOptOut())
              }}>
              <SettingsList.Item>
                <SettingsList.ItemIcon icon={SparkleIcon} />
                <SettingsList.ItemText>
                  <Trans>Show weekly recap</Trans>
                </SettingsList.ItemText>
                <Toggle.Platform />
              </SettingsList.Item>
            </Toggle.Item>
            <SettingsList.Divider />
            <SettingsList.LinkItem to="/recaps" label={_(msg`Past recaps`)}>
              <SettingsList.ItemIcon icon={ListSparkleIcon} />
              <SettingsList.ItemText>
                <Trans>Past recaps</Trans>
              </SettingsList.ItemText>
            </SettingsList.LinkItem>
          </SettingsList.Container>
        ) : null}
      </Layout.Content>
    </Layout.Screen>
  )
}
