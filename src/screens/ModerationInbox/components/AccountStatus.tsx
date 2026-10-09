import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/Circle'
import {ExclamationCircle_Stroke2_Corner0_Rounded as ExclamationCircleIcon} from '#/components/icons/ExclamationCircle'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

export function AccountStatus({
  status,
}: {
  status: 'good' | 'warning' | 'atRisk'
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const control = Prompt.usePromptControl()

  if (status === 'good') return null

  const Icon = status === 'atRisk' ? ExclamationCircleIcon : CircleInfoIcon
  const iconColor =
    status === 'atRisk' ? t.palette.negative_500 : t.palette.yellow

  const title =
    status === 'atRisk'
      ? l`Your account is at risk of permanent suspension`
      : l`Your account has strikes against it`
  const description =
    status === 'atRisk' ? (
      <Trans>
        We’ve taken action on your account for violating our Community
        Guidelines. Your record now carries enough strikes that another
        violation could lead to permanent suspension.
      </Trans>
    ) : (
      <Trans>
        We’ve taken action on your account for violating our Community
        Guidelines, and strikes have been added to your record. More violations
        will lead to stronger enforcement, including suspension.
      </Trans>
    )
  const disclaimer =
    status === 'atRisk' ? (
      <Trans>
        Your standing may restrict certain features on your account. Strikes
        come off your record over time.
      </Trans>
    ) : (
      <Trans>
        Your standing doesn’t restrict your account right now, and strikes come
        off your record over time.
      </Trans>
    )

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={l`Show account status`}
        accessibilityHint=""
        onPress={control.open}
        style={[
          a.p_lg,
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_sm,
          a.border_b,
          t.atoms.border_contrast_low,
        ]}>
        <Icon size="md" style={{color: iconColor}} />
        <Text style={[a.flex_1, a.text_sm, a.font_semi_bold]}>{title}</Text>
        <ChevronRightIcon size="md" style={[t.atoms.text_contrast_medium]} />
      </Pressable>

      <Prompt.Outer control={control}>
        <Prompt.Content>
          <View style={[a.py_lg, a.align_center, a.justify_center]}>
            <Icon size="4xl" style={{color: iconColor}} />
          </View>
          <Prompt.TitleText>{title}</Prompt.TitleText>
          <Prompt.DescriptionText>{description}</Prompt.DescriptionText>
          <Prompt.DescriptionText>
            <Trans>{disclaimer}</Trans>
          </Prompt.DescriptionText>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action cta={l`Done`} onPress={() => control.close()} />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
