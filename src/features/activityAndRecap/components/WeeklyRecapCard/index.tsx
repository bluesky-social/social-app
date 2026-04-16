/**
 * WeeklyRecapCard (S13) — compact dismissible card mounted in the
 * Notifications header (S19).
 *
 * Behavior:
 *   - Visibility resolved by useRecapCardVisibility (B1, B5, B6, G7). When
 *     null, the card returns null (no XRPC, no render).
 *   - Renders three preview lines: posts count, follower delta, top post.
 *     Zero-posts copy is the EXACT string from RECAP_ZERO_POSTS_COPY (B4).
 *   - Tap navigates to the Recap route with weekId (B3).
 *   - Dedicated focusable dismiss button (a11y, B9). Dismiss callback writes
 *     to account MMKV via useDismissRecapCard.
 *   - Stamps firstShownAt on first render (B6 anchor).
 *   - Fires recap:cardShown / recap:cardTapped / recap:cardDismissed
 *     analytics with booleans-only payloads (B12).
 *   - opacity-only transition gated on useReducedMotion (B9).
 *
 * The card NEVER reads `useWeeklyRecapQuery` itself when invisible (B11).
 */

import React from 'react'
import {Pressable, View} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as TimesIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {
  recapCardDismissed,
  recapCardShown,
  recapCardTapped,
} from '#/features/activityAndRecap/analytics/events'
import {RecapMetricTile} from '#/features/activityAndRecap/components/RecapMetricTile'
import {RECAP_ZERO_POSTS_COPY} from '#/features/activityAndRecap/constants'
import {useDismissRecapCard} from '#/features/activityAndRecap/hooks/useDismissRecapCard'
import {useRecapCardVisibility} from '#/features/activityAndRecap/hooks/useRecapCardVisibility'
import {useWeeklyRecapQuery} from '#/features/activityAndRecap/queries/weeklyRecap'
import {markRecapCardFirstShown} from '#/features/activityAndRecap/storage'

export function WeeklyRecapCard(): React.ReactElement | null {
  const weekIso = useRecapCardVisibility()
  // Hard early-return BEFORE any XRPC/storage reads (B11, X6).
  if (!weekIso) return null
  return <WeeklyRecapCardInner weekIso={weekIso} />
}

function WeeklyRecapCardInner({
  weekIso,
}: {
  weekIso: string
}): React.ReactElement | null {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()
  const dismiss = useDismissRecapCard()
  const reducedMotion = useReducedMotion()
  const did = currentAccount?.did

  const {data, isLoading, isError} = useWeeklyRecapQuery({weekIso})

  // B6: stamp firstShownAt on first paint so the 7-day expiry anchor begins
  // even before the user interacts. We only need this once per (did,weekIso).
  const stampedRef = React.useRef(false)
  React.useEffect(() => {
    if (stampedRef.current) return
    if (!did) return
    stampedRef.current = true
    markRecapCardFirstShown(did, weekIso, Date.now())
  }, [did, weekIso])

  // B12: emit recap:cardShown ONCE on first successful load (booleans only).
  const shownEmittedRef = React.useRef(false)
  React.useEffect(() => {
    if (shownEmittedRef.current) return
    if (!data) return
    shownEmittedRef.current = true
    ax.metric(...recapCardShown(data))
  }, [ax, data])

  if (isLoading) {
    // Render a low-noise placeholder so the slot doesn't pop when data lands.
    return (
      <View
        testID="weeklyRecapCard"
        style={[
          a.p_md,
          a.mx_md,
          a.my_sm,
          a.rounded_md,
          t.atoms.bg_contrast_25,
        ]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Loading your week on Bluesky…</Trans>
        </Text>
      </View>
    )
  }

  // R3 / B8: surface as silent if errored — manual retry lives on RecapScreen.
  if (isError || !data) return null

  const onTap = () => {
    ax.metric(...recapCardTapped())
    navigation.navigate('Recap', {weekId: weekIso})
  }

  const onDismiss = () => {
    ax.metric(...recapCardDismissed())
    dismiss(weekIso)
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
  const opacityStyle = reducedMotion ? null : web({transition: 'opacity 200ms'})

  return (
    <Pressable
      testID="weeklyRecapCard"
      accessibilityRole="button"
      accessibilityLabel={_(msg`Your week on Bluesky`)}
      accessibilityHint={_(msg`Opens this week's recap`)}
      onPress={onTap}
      style={[
        a.p_md,
        a.mx_md,
        a.my_sm,
        a.rounded_md,
        a.gap_sm,
        t.atoms.bg_contrast_25,
        opacityStyle,
      ]}>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
          <Trans>Your week on Bluesky</Trans>
        </Text>
        <Button
          label={_(msg`Dismiss recap`)}
          size="tiny"
          color="secondary"
          shape="round"
          onPress={onDismiss}>
          <ButtonIcon icon={TimesIcon} />
        </Button>
      </View>

      {data.postsCount === 0 ? (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {/*
            B4: zero-posts copy MUST be exactly RECAP_ZERO_POSTS_COPY.
            We pass it through Lingui's `_` so it still gets translated, but
            the source string is the literal constant.
          */}
          {_(msg`${RECAP_ZERO_POSTS_COPY}`)}
        </Text>
      ) : (
        <View style={[a.flex_row, a.gap_sm]}>
          <RecapMetricTile
            testID="weeklyRecapCard-posts"
            label={_(msg`Posts`)}
            value={postsLabel}
          />
          <RecapMetricTile
            testID="weeklyRecapCard-followers"
            label={_(msg`Followers`)}
            value={followersLabel}
          />
          <RecapMetricTile
            testID="weeklyRecapCard-topPost"
            label={_(msg`Top post`)}
            value={data.topPost ? _(msg`Tap to view`) : _(msg`—`)}
          />
        </View>
      )}
    </Pressable>
  )
}
