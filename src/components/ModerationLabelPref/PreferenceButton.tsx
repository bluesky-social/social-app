import React from 'react'
import {Pressable} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import {InterprettedLabelValueDefinition, LabelPreference} from '@atproto/api'

import {
  useLabelBehaviorDescription,
  useLabelLongBehaviorDescription,
} from '#/lib/moderation/useLabelBehaviorDescription'

import {useTheme, atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {ArrowTriangleBottom_Stroke2_Corner1_Rounded as ArrowTriangleBottom} from '../icons/ArrowTriangle'
import {Check_Stroke2_Corner0_Rounded as Check} from '../icons/Check'

export function PreferenceButton({
  name,
  pref,
  labelValueDefinition,
  onSelectPref,
}: {
  name: string
  pref: LabelPreference
  labelValueDefinition: InterprettedLabelValueDefinition
  onSelectPref: (pref: LabelPreference) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const settingDesc = useLabelBehaviorDescription(labelValueDefinition, pref)
  const hideLabel = useLabelLongBehaviorDescription(
    labelValueDefinition,
    'hide',
  )
  const warnLabel = useLabelLongBehaviorDescription(
    labelValueDefinition,
    'warn',
  )
  const ignoreLabel = useLabelLongBehaviorDescription(
    labelValueDefinition,
    'ignore',
  )
  const canWarn = !(
    labelValueDefinition.blurs === 'none' &&
    labelValueDefinition.severity === 'none'
  )

  return (
    <>
      <Pressable
        onPress={() => control.open()}
        accessibilityLabel={settingDesc}
        accessibilityHint=""
        style={[
          a.flex_row,
          a.align_center,
          a.justify_end,
          a.gap_xs,
          a.py_xs,
          a.rounded_2xs,
        ]}>
        <Text style={[{color: t.palette.primary_500}, a.font_semibold]}>
          {settingDesc}
        </Text>
        <ArrowTriangleBottom width={8} fill={t.palette.primary_500} />
      </Pressable>

      <Dialog.Outer control={control}>
        <Dialog.Handle />

        <Dialog.Inner
          label={_(msg`Settings: ${labelValueDefinition.identifier}`)}
          style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold, a.pb_xs, t.atoms.text]}>
            {name}
          </Text>
          <Text style={[a.text_md, a.pb_sm, t.atoms.text_contrast_medium]}>
            <Trans>Choose how this label should be handled.</Trans>
          </Text>

          <Button
            label={hideLabel}
            size="large"
            variant="solid"
            color={pref === 'hide' ? 'primary' : 'secondary'}
            onPress={() => {
              onSelectPref('hide')
              control.close()
            }}>
            <ButtonText style={[a.flex_1, a.text_left]}>{hideLabel}</ButtonText>
            {pref === 'hide' && <ButtonIcon icon={Check} position="right" />}
          </Button>

          {canWarn && (
            <Button
              label={warnLabel}
              size="large"
              variant="solid"
              color={pref === 'warn' ? 'primary' : 'secondary'}
              onPress={() => {
                onSelectPref('warn')
                control.close()
              }}>
              <ButtonText style={[a.flex_1, a.text_left]}>
                {warnLabel}
              </ButtonText>
              {pref === 'warn' && <ButtonIcon icon={Check} position="right" />}
            </Button>
          )}

          <Button
            label={ignoreLabel}
            size="large"
            variant="solid"
            color={pref === 'ignore' ? 'primary' : 'secondary'}
            onPress={() => {
              onSelectPref('ignore')
              control.close()
            }}>
            <ButtonText style={[a.flex_1, a.text_left]}>
              {ignoreLabel}
            </ButtonText>
            {pref === 'ignore' && <ButtonIcon icon={Check} position="right" />}
          </Button>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
