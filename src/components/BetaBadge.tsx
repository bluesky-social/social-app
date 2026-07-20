import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import * as Tooltip from '#/components/Tooltip'
import type * as bsky from '#/types/bsky'

/**
 * Whether to show the beta badge for a given profile. Only shown on the
 * viewer's own profile, and only when the viewer has opted in to beta features.
 */
export function useIsBetaBadgeVisible(
  profile: bsky.profile.AnyProfileView,
): boolean {
  const {currentAccount} = useSession()
  const {data: preferences} = usePreferencesQuery()
  const isBetaUser = preferences?.bskyAppState?.isBetaUser ?? false
  const isSelf = currentAccount?.did === profile.did

  return isSelf && isBetaUser
}

export function BetaBadge({
  profile,
  width,
  padding,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
  padding: number
}) {
  const t = useTheme()
  const isVisible = useIsBetaBadgeVisible(profile)

  if (!isVisible) return null

  return (
    <View
      style={[
        a.rounded_full,
        {backgroundColor: t.palette.primary_50, padding},
      ]}>
      <BeakerIcon width={width} fill={t.palette.primary_500} />
    </View>
  )
}

export function BetaBadgeButton({
  profile,
  width,
  padding,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
  padding: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const isVisible = useIsBetaBadgeVisible(profile)

  const [tooltipVisible, setTooltipVisible] = useState(false)

  if (!isVisible) return null

  return (
    <Tooltip.Outer
      color="primary"
      visible={tooltipVisible}
      onVisibleChange={setTooltipVisible}>
      <Tooltip.Target>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={l`Beta features enabled`}
          accessibilityHint=""
          hitSlop={HITSLOP_20}
          style={({hovered}) => [
            a.rounded_full,
            a.transition_transform,
            {
              backgroundColor: t.palette.primary_50,
              padding,
              transform: [
                {
                  scale: hovered ? 1.1 : 1,
                },
              ],
            },
          ]}
          onPress={() => setTooltipVisible(v => !v)}>
          <BeakerIcon width={width} fill={t.palette.primary_500} />
        </Pressable>
      </Tooltip.Target>
      <Tooltip.BubbleText label={l`Beta features enabled`}>
        <Trans>Beta features enabled</Trans>
      </Tooltip.BubbleText>
    </Tooltip.Outer>
  )
}
