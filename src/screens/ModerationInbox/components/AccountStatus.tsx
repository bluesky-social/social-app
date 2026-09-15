import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
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

  if (status === 'good') {
    return null
  }

  const Icon = status === 'atRisk' ? ExclamationCircleIcon : CircleInfoIcon
  const iconColor =
    status === 'atRisk' ? t.palette.negative_500 : t.palette.yellow

  const title =
    status === 'atRisk'
      ? l`Your account is at risk of permanent suspension`
      : l`Your account has strikes on record`
  const description =
    status === 'atRisk'
      ? l`Your account has repeated violations of our Community Guidelines. Another violation may result in your account being permanently suspended.`
      : l`Bluesky has taken action on your account or content for violating our community guidelines. Further violations will lead to stronger enforcement, including suspension.`

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
            <Trans>
              Nothing on your account is restricted right now. Strikes from
              violations come off your record over time.
            </Trans>
          </Prompt.DescriptionText>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action cta={l`Done`} onPress={() => control.close()} />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
