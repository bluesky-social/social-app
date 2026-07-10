import {View} from 'react-native'

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
  xs: 10,
  sm: 11,
  md: 12,
  lg: 16,
  xl: 20,
} as const

const betaBadgePadding: Record<Size, number> = {
  xs: 2,
  sm: 3,
  md: 4,
  lg: 6,
  xl: 8,
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
  const hasBadges = useHasProfileBadges(profile)
  const nativeScaleMultiplier = useNativeFontScale()
  const {
    fonts: {scaleMultiplier: alfScaleMultiplier},
  } = useAlf()

  // if nothing to show, don't render the container at all
  if (!hasBadges) return null

  const isOnTheSmallSide = size === 'xs' || size === 'sm'

  const scaleMultiplier = allowFontScaling
    ? nativeScaleMultiplier * alfScaleMultiplier
    : 1

  const verificationIconWidth = verificationIconSizes[size] * scaleMultiplier
  const botIconWidth = botIconSizes[size] * scaleMultiplier
  const betaIconWidth = betaIconSizes[size] * scaleMultiplier
  const betaBadgeScaledPadding = betaBadgePadding[size] * scaleMultiplier

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        isOnTheSmallSide ? a.gap_2xs : a.gap_xs,
        style,
      ]}>
      {interactive ? (
        <>
          <BetaBadgeButton
            profile={shadowed}
            width={betaIconWidth}
            padding={betaBadgeScaledPadding}
          />
          <VerificationCheckButton
            profile={shadowed}
            width={verificationIconWidth}
          />
          <BotBadgeButton profile={shadowed} width={botIconWidth} />
        </>
      ) : (
        <>
          <BetaBadge
            profile={shadowed}
            width={betaIconWidth}
            padding={betaBadgeScaledPadding}
          />
          {verification.showBadge && (
            <VerificationCheck
              verifier={verification.role === 'verifier'}
              width={verificationIconWidth}
            />
          )}
          <BotBadge profile={shadowed} width={botIconWidth} />
        </>
      )}
    </View>
  )
}

function useHasProfileBadges(profile: bsky.profile.AnyProfileView) {
  const shadowed = useProfileShadow(profile)
  const verification = useSimpleVerificationState({profile})
  const isBetaBadgeVisible = useIsBetaBadgeVisible(profile)

  return verification.showBadge || isBotAccount(shadowed) || isBetaBadgeVisible
}
