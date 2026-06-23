import {type ReactNode} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRight} from '#/components/icons/Arrow'
import {Full as Logo} from '#/components/icons/Logo'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import {VerifierCheck} from '#/components/icons/VerifierCheck'
import {Text} from '#/components/Typography'
import {BRAND} from '#/config/brand'

const ICON_SIZE = 56

/**
 * mu fork: in-app replacement for the upstream
 * `initial_verification_announcement_1.png`, which baked in the Bluesky
 * butterfly and brand blue. Rendering it from the mu logo + the live
 * verification icons keeps it on-brand (pink primary_500) and theme-aware
 * (works on light/dark/dim, unlike the PNG's hard-coded light background).
 *
 * Steps mirror the original: brand selects trusted verifiers, who in turn
 * verify individual accounts.
 */
export function VerificationAnnouncementIllustration() {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_row,
        a.align_start,
        a.justify_center,
        a.gap_sm,
        a.py_2xl,
        a.px_md,
      ]}>
      <Step labelText={BRAND.name}>
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_full,
            {
              width: ICON_SIZE,
              height: ICON_SIZE,
              backgroundColor: t.palette.primary_500,
            },
          ]}>
          <Logo width={ICON_SIZE * 0.58} markFill="#FFFFFF" />
        </View>
      </Step>

      <Arrow />

      <Step labelText={<Trans>Trusted Verifier</Trans>}>
        <VerifierCheck width={ICON_SIZE} fill={t.palette.primary_500} />
      </Step>

      <Arrow />

      <Step labelText={<Trans>Verified Account</Trans>}>
        <VerifiedCheck width={ICON_SIZE} fill={t.palette.primary_500} />
      </Step>
    </View>
  )
}

function Step({
  labelText,
  children,
}: {
  labelText: ReactNode
  children: ReactNode
}) {
  const t = useTheme()

  return (
    <View style={[a.align_center, a.gap_sm, {width: 88}]}>
      <View style={[a.justify_center, {height: ICON_SIZE}]}>{children}</View>
      <Text
        emoji
        style={[
          a.text_xs,
          a.font_semi_bold,
          a.text_center,
          a.leading_tight,
          t.atoms.text_contrast_medium,
        ]}>
        {labelText}
      </Text>
    </View>
  )
}

function Arrow() {
  const t = useTheme()

  return (
    <View style={[a.justify_center, {height: ICON_SIZE}]}>
      <ArrowRight size="sm" fill={t.palette.contrast_400} />
    </View>
  )
}
