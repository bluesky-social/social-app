/**
 * PastRecapsScreen (S16) — list of the last `PAST_RECAPS_WINDOW` ISO weeks
 * (default 4) (B5). Each row navigates to the Recap route, where the
 * existing weeklyRecap query handles cache hit / refetch.
 *
 * No separate storage; this screen is a pure index into the existing
 * weeklyRecap query keyspace.
 */

import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkleIcon} from '#/components/icons/ListSparkle'
import * as Layout from '#/components/Layout'
import {PAST_RECAPS_WINDOW} from '#/features/activityAndRecap/constants'
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'
import {
  lastNWeekIsos,
  weekWindowForIso,
} from '#/features/activityAndRecap/reducer/isoWeek'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PastRecaps'>

export function PastRecapsScreen({}: Props) {
  const {_, i18n} = useLingui()
  const featureOn = useStreaksAndRecapEnabled()

  // Stable list per render — recompute only when the day changes (cheap).
  const weekIds = useMemo(
    () => lastNWeekIsos(new Date(), PAST_RECAPS_WINDOW),
    [],
  )

  return (
    <Layout.Screen testID="pastRecapsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Past recaps</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        {featureOn ? (
          <SettingsList.Container>
            {weekIds.map(weekIso => {
              const window = weekWindowForIso(weekIso)
              const startStr = window
                ? i18n.date(window.start, {month: 'short', day: 'numeric'})
                : weekIso
              const endStr = window
                ? i18n.date(window.end, {month: 'short', day: 'numeric'})
                : ''
              const rangeLabel = window
                ? _(msg`${startStr} – ${endStr}`)
                : weekIso
              return (
                <SettingsList.LinkItem
                  key={weekIso}
                  to={`/recap/${weekIso}`}
                  label={_(msg`Week of ${startStr}`)}>
                  <SettingsList.ItemIcon icon={ListSparkleIcon} />
                  <SettingsList.ItemText>{rangeLabel}</SettingsList.ItemText>
                </SettingsList.LinkItem>
              )
            })}
          </SettingsList.Container>
        ) : null}
      </Layout.Content>
    </Layout.Screen>
  )
}
