/**
 * RecapScreen (S15) — full-screen route for "Your week on Bluesky".
 *
 * Renders three metric tiles (posts, new followers, top post) for the week
 * referenced by `route.params.weekId`. Top post renders via the existing
 * `Post` component which inherits moderation filtering (B10). On fetch
 * error, surfaces a manual "Try again" button — manual retry bypasses the
 * 2/hr automatic budget enforced in `retryBudget.ts` (B8).
 *
 * Hidden when the feature flag is off (X6).
 */

import {View} from 'react-native'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {RecapMetricTile} from '#/features/activityAndRecap/components/RecapMetricTile'
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'
import {resetAutoRetry} from '#/features/activityAndRecap/queries/retryBudget'
import {useWeeklyRecapQuery} from '#/features/activityAndRecap/queries/weeklyRecap'
import {weekWindowForIso} from '#/features/activityAndRecap/reducer/isoWeek'
import {RecapHeader} from './components/RecapHeader'
import {TopPostEmbed} from './components/TopPostEmbed'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Recap'>

export function RecapScreen({route}: Props) {
  const featureOn = useStreaksAndRecapEnabled()
  const weekIso = route.params?.weekId ?? null

  return (
    <Layout.Screen testID="recapScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Recap</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        {featureOn && weekIso ? (
          <RecapBody weekIso={weekIso} />
        ) : (
          <View style={[a.p_lg]}>
            <Text>
              <Trans>This recap isn't available right now.</Trans>
            </Text>
          </View>
        )}
      </Layout.Content>
    </Layout.Screen>
  )
}

function RecapBody({weekIso}: {weekIso: string}) {
  const {_} = useLingui()
  const t = useTheme()
  const window = weekWindowForIso(weekIso)
  const {data, isLoading, isError, refetch} = useWeeklyRecapQuery({weekIso})

  if (!window) {
    return (
      <View style={[a.p_lg]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>This recap isn't available right now.</Trans>
        </Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={[a.p_lg]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Computing your week…</Trans>
        </Text>
      </View>
    )
  }

  if (isError || !data) {
    return (
      <View style={[a.p_lg, a.gap_md]}>
        <Text style={[t.atoms.text]}>
          <Trans>We couldn't load this recap.</Trans>
        </Text>
        <Button
          label={_(msg`Try again`)}
          color="primary"
          size="small"
          onPress={() => {
            // B8 manual-retry bypass: clear the per-week auto-retry counter
            // before refetching so the queryFn isn't short-circuited.
            resetAutoRetry(weekIso)
            refetch()
          }}>
          <ButtonText>
            <Trans>Try again</Trans>
          </ButtonText>
        </Button>
      </View>
    )
  }

  const postsLabel = _(
    msg`${plural(data.postsCount, {one: '# post', other: '# posts'})}`,
  )
  const followersLabel = _(
    msg`${plural(data.followerDelta, {
      one: '# new follower',
      other: '# new followers',
    })}`,
  )

  // B10: prefer topPostCandidates so we can promote past tombstones at
  // render time. Fall back to the singleton topPost when present.
  const candidates =
    data.topPostCandidates && data.topPostCandidates.length > 0
      ? data.topPostCandidates
      : data.topPost
        ? [data.topPost]
        : []

  return (
    <View>
      <RecapHeader windowStart={window.start} windowEnd={window.end} />

      <View style={[a.flex_row, a.gap_sm, a.px_lg, a.pb_md]}>
        <RecapMetricTile
          testID="recapScreen-posts"
          label={_(msg`Posts`)}
          value={postsLabel}
        />
        <RecapMetricTile
          testID="recapScreen-followers"
          label={_(msg`Followers`)}
          value={followersLabel}
        />
      </View>

      <View style={[a.px_lg, a.pt_sm]}>
        <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
          <Trans>Top post</Trans>
        </Text>
      </View>
      <TopPostEmbed candidates={candidates} />
    </View>
  )
}
