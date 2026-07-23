import {View} from 'react-native'

import {HITSLOP_20} from '#/lib/constants'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {atoms as a, useAlf, type ViewStyleProp} from '#/alf'
import {useNativeFontScale} from '#/alf/util/dimensions'
import {BotBadge, BotBadgeButton, isBotAccount} from '#/components/BotBadge'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {VerificationCheckButton} from '#/components/verification/VerificationCheckButton'
import type * as bsky from '#/types/bsky'
import {BetaBadge, BetaBadgeButton, useIsBetaBadgeVisible} from './BetaBadge'

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const verificationIconSizes: Record<Size, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 22,
} as const

const botIconSizes: Record<Size, number> = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 19,
  xl: 23,
} as const

const betaIconSizes: Record<Size, number> = {
  xs: 8,
  sm: 8,
  md: 8,
  lg: 10,
  xl: 12,
} as const

const betaBadgePadding: Record<Size, number> = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
} as const

export function ProfileBadges({
  profile,
  interactive = false,
  size,
  style,
  allowFontScaling = true,
}: ViewStyleProp & {
  profile: bsky.profile.AnyProfileView
  interactive?: boolean
  size: Size
  allowFontScaling?: boolean
}) {
  const shadowed = useProfileShadow(profile)
  const verification = useSimpleVerificationState({profile})
  const badgeVisibility = [
    verification.showBadge,
    useIsBetaBadgeVisible(profile),
    isBotAccount(shadowed),
  ]
  const badgeCount = badgeVisibility.filter(Boolean).length
  const nativeScaleMultiplier = useNativeFontScale()
  const {
    fonts: {scaleMultiplier: alfScaleMultiplier},
  } = useAlf()

  // if nothing to show, don't render the container at all
  if (badgeCount < 1) return null

  const isOnTheSmallSide = size === 'xs' || size === 'sm'

  const scaleMultiplier = allowFontScaling
    ? nativeScaleMultiplier * alfScaleMultiplier
    : 1

  const verificationIconWidth = verificationIconSizes[size] * scaleMultiplier
  const botIconWidth = botIconSizes[size] * scaleMultiplier
  const betaIconWidth = betaIconSizes[size] * scaleMultiplier
  const betaBadgeScaledPadding = betaBadgePadding[size] * scaleMultiplier

  const gap = isOnTheSmallSide ? a.gap_2xs : a.gap_xs
  const padding = gap.gap / 2
  let visibleBadgeIndex = 0
  const hitSlops = badgeVisibility.map(isVisible => {
    if (!isVisible) return HITSLOP_20

    const index = visibleBadgeIndex++
    return {
      ...HITSLOP_20,
      left: index === 0 ? HITSLOP_20.left : padding,
      right: index === badgeCount - 1 ? HITSLOP_20.right : padding,
    }
  })

  return (
    <View style={[a.flex_row, a.align_center, gap, style]}>
      {interactive ? (
        <>
          <VerificationCheckButton
            profile={shadowed}
            width={verificationIconWidth}
            hitSlop={hitSlops[0]}
          />
          <BetaBadgeButton
            profile={shadowed}
            width={betaIconWidth}
            padding={betaBadgeScaledPadding}
            hitSlop={hitSlops[1]}
          />
          <BotBadgeButton
            profile={shadowed}
            width={botIconWidth}
            hitSlop={hitSlops[2]}
          />
        </>
      ) : (
        <>
          {verification.showBadge ? (
            <VerificationCheck
              verifier={verification.role === 'verifier'}
              width={verificationIconWidth}
            />
          ) : null}
          <BetaBadge
            profile={shadowed}
            width={betaIconWidth}
            padding={betaBadgeScaledPadding}
          />
          <BotBadge profile={shadowed} width={botIconWidth} />
        </>
      )}
    </View>
  )
}
