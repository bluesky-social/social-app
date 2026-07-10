import {View} from 'react-native'

import {hasKnownBadge} from '#/lib/badges'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {atoms as a, useAlf, type ViewStyleProp} from '#/alf'
import {useNativeFontScale} from '#/alf/util/dimensions'
import {ActorBadgeButtons, ActorBadges} from '#/components/badges'
import {BotBadge, BotBadgeButton, isBotAccount} from '#/components/BotBadge'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {VerificationCheckButton} from '#/components/verification/VerificationCheckButton'
import type * as bsky from '#/types/bsky'

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

const badgeIconSizes: Record<Size, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
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
  const nativeScaleMultiplier = useNativeFontScale()
  const {
    fonts: {scaleMultiplier: alfScaleMultiplier},
  } = useAlf()

  const hasBadges = hasKnownBadge(shadowed)

  if (!verification.showBadge && !isBotAccount(shadowed) && !hasBadges)
    return null

  const isOnTheSmallSide = size === 'xs' || size === 'sm'

  const scaleMultiplier = allowFontScaling
    ? nativeScaleMultiplier * alfScaleMultiplier
    : 1

  const verificationIconWidth = verificationIconSizes[size] * scaleMultiplier
  const botIconWidth = botIconSizes[size] * scaleMultiplier
  const badgeIconWidth = badgeIconSizes[size] * scaleMultiplier

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
          <VerificationCheckButton
            profile={shadowed}
            width={verificationIconWidth}
          />
          <ActorBadgeButtons profile={shadowed} width={badgeIconWidth} />
          <BotBadgeButton profile={shadowed} width={botIconWidth} />
        </>
      ) : (
        <>
          {verification.showBadge && (
            <VerificationCheck
              verifier={verification.role === 'verifier'}
              width={verificationIconWidth}
            />
          )}
          <ActorBadges profile={shadowed} width={badgeIconWidth} />
          <BotBadge profile={shadowed} width={botIconWidth} />
        </>
      )}
    </View>
  )
}
