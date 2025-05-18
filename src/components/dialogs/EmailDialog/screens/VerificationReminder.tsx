import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, platform, tokens, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogContext} from '#/components/Dialog'
import {
  ScreenID,
  type ScreenProps,
} from '#/components/dialogs/EmailDialog/types'
import {Divider} from '#/components/Divider'
import {GradientFill} from '#/components/GradientFill'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {Text} from '#/components/Typography'

export function VerificationReminder({
  showScreen,
}: ScreenProps<ScreenID.VerificationReminder>) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtPhone, gtMobile} = useBreakpoints()
  const control = useDialogContext()

  const dialogPadding = gtMobile ? a.p_2xl.padding : a.p_xl.padding

  return (
    <View style={[a.gap_lg]}>
      <View
        style={[
          a.absolute,
          {
            top: platform({web: dialogPadding, default: a.p_2xl.padding}) * -1,
            left: dialogPadding * -1,
            right: dialogPadding * -1,
            height: 150,
          },
        ]}>
        <View
          style={[
            a.absolute,
            a.inset_0,
            a.align_center,
            a.justify_center,
            a.overflow_hidden,
            a.pt_md,
            t.atoms.bg_contrast_100,
            {
              borderTopLeftRadius: a.rounded_md.borderRadius,
              borderTopRightRadius: a.rounded_md.borderRadius,
            },
          ]}>
          <GradientFill gradient={tokens.gradients.primary} />
          <ShieldIcon width={64} fill="white" style={[a.z_10]} />
        </View>
      </View>

      <View style={[a.mb_xs, {height: 150 - dialogPadding}]} />

      <View style={[a.gap_sm]}>
        <Text style={[a.text_xl, a.font_heavy]}>
          <Trans>Please verify your email</Trans>
        </Text>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Your email has not yet been verified. Please verify your email in
            order to enjoy all the features of Bluesky.
          </Trans>
        </Text>
      </View>

      <Divider />

      <View style={[a.gap_sm, gtPhone && [a.flex_row_reverse]]}>
        <Button
          label={_(msg`Get started`)}
          variant="solid"
          color="primary"
          size="large"
          onPress={() =>
            showScreen({
              id: ScreenID.Verify,
            })
          }>
          <ButtonText>
            <Trans>Get started</Trans>
          </ButtonText>
        </Button>
        <Button
          label={_(msg`Maybe later`)}
          accessibilityHint={_(msg`Snoozes the reminder`)}
          variant="ghost"
          color="secondary"
          size="large"
          onPress={() => control.close()}>
          <ButtonText>
            <Trans>Maybe later</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
