import {View} from 'react-native'

import {HITSLOP_20} from '#/lib/constants'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {atoms as a, useAlf, type ViewStyleProp} from '#/alf'
import {useNativeFontScale} from '#/alf/util/dimensions'
import {BotBadge, BotBadgeButton, isBotAccount} from '#/components/BotBadge'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {VerificationCheckButton} from '#/components/verification/VerificationCheckButton'
import {IS_IOS} from '#/env'
import type * as bsky from '#/types/bsky'
import {BetaBadge, BetaBadgeButton, useIsBetaBadgeVisible} from './BetaBadge'

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/*
 * Cap height of Inter as a fraction of its em size, from the font's OS/2
 * table. The system font (used when the "system font" setting is on) is within
 * 0.015em of this, so a single constant covers both.
 */
const CAP_HEIGHT_RATIO = 0.7275

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
  inlineFontSize,
}: ViewStyleProp & {
  profile: bsky.profile.AnyProfileView
  interactive?: boolean
  size: Size
  allowFontScaling?: boolean
  /**
   * Unscaled `fontSize` of the text this is rendered inline within. Set this
   * when rendering inside a `<Text>` so the badges line up with the text
   * instead of hanging off its baseline - see `inlineHeight` below.
   */
  inlineFontSize?: number
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

  /*
   * A `View` nested inside a `<Text>` is laid out as a text attachment on iOS,
   * and on the new architecture the attachment box is placed at
   * `lineTop + baseline - boxHeight` (`RCTTextLayoutManager`), pinning its
   * bottom edge to the text baseline. `margin` and `top` have no effect there:
   * `ParagraphShadowNode` measures the box with `LayoutableShadowNode::measure`
   * (frame size only, margins excluded) and then overwrites its origin. The old
   * architecture folded margins into the measured box and offset it by the
   * font's descender, which is why the pre-new-arch fix was a negative
   * `marginBottom`.
   *
   * The box height is the only lever left, so constrain it to the cap height of
   * the surrounding text. That lands the box exactly over the capital letters,
   * and `align_center` then centers the badges on them - independent of which
   * badges are visible and how tall they are. Keeping the box this short also
   * keeps it inside the line's ascent, so TextKit never has to shift it to make
   * it fit, which is what the badges' full height used to force.
   */
  const inlineHeight =
    IS_IOS && inlineFontSize
      ? inlineFontSize * scaleMultiplier * CAP_HEIGHT_RATIO
      : undefined

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
    <View
      style={[a.flex_row, a.align_center, gap, {height: inlineHeight}, style]}>
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
