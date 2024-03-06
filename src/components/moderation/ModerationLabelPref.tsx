import React from 'react'
import {Pressable, View} from 'react-native'
import {InterprettedLabelValueDefinition, LabelPreference} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {useGlobalLabelStrings} from '#/lib/moderation/useGlobalLabelStrings'
import {
  useLabelBehaviorDescription,
  useLabelLongBehaviorDescription,
} from '#/lib/moderation/useLabelBehaviorDescription'
import {
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences'
import {getLabelStrings} from '#/lib/moderation/useLabelInfo'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {ArrowTriangleBottom_Stroke2_Corner1_Rounded as ArrowTriangleBottom} from '../icons/ArrowTriangle'
import {Check_Stroke2_Corner0_Rounded as Check} from '../icons/Check'

export function ModerationLabelPref({
  labelValueDefinition,
  labelerDid,
  disabled,
}: {
  labelValueDefinition: InterprettedLabelValueDefinition
  labelerDid: string | undefined
  disabled?: boolean
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const {identifier} = labelValueDefinition
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const savedPref = labelerDid
    ? preferences?.moderationPrefs.mods.find(m => m.did === labelerDid)?.labels[
        identifier
      ]
    : preferences?.moderationPrefs.labels[identifier]
  const pref = variables?.visibility ?? savedPref ?? 'warn'

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
  const globalLabelStrings = useGlobalLabelStrings()
  const labelStrings = getLabelStrings(
    i18n.locale,
    globalLabelStrings,
    labelValueDefinition,
  )

  const canWarn = !(
    labelValueDefinition.blurs === 'none' &&
    labelValueDefinition.severity === 'none'
  )

  const onSelectPref = (newPref: LabelPreference) =>
    mutate({label: identifier, visibility: newPref, labelerDid})

  return (
    <>
      <Pressable
        onPress={() => control.open()}
        accessibilityLabel={settingDesc}
        accessibilityHint=""
        style={[
          a.flex_row,
          a.justify_between,
          a.gap_sm,
          a.align_center,
          t.atoms.bg_contrast_25,
          a.px_lg,
          a.py_lg,
          a.rounded_sm,
        ]}>
        <Text style={[a.font_bold]}>{labelStrings.name}</Text>

        <Text
          style={[t.atoms.text_contrast_medium, a.flex_1]}
          numberOfLines={1}>
          {labelStrings.description}
        </Text>
        {!disabled && (
          <View
            style={[
              {width: 100},
              a.flex_row,
              a.align_center,
              a.justify_end,
              a.gap_xs,
              a.rounded_2xs,
            ]}>
            {!disabled && (
              <Text style={[t.atoms.text_contrast_medium, a.font_semibold]}>
                {settingDesc}
              </Text>
            )}
            <ArrowTriangleBottom
              width={8}
              fill={t.atoms.text_contrast_medium.color}
            />
          </View>
        )}
      </Pressable>

      <Dialog.Outer control={control}>
        <Dialog.Handle />

        <Dialog.Inner
          label={_(msg`Settings: ${labelValueDefinition.identifier}`)}
          style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold, a.pb_xs, t.atoms.text]}>
            {labelStrings.name}
          </Text>
          <Text style={[a.text_md, a.pb_sm, t.atoms.text_contrast_medium]}>
            {labelStrings.description}
          </Text>
          {disabled ? (
            <Button
              label={_(msg`Close`)}
              size="large"
              variant="solid"
              color="secondary"
              onPress={() => control.close()}>
              <ButtonText style={[a.flex_1, a.text_left]}>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          ) : (
            <>
              <Button
                label={hideLabel}
                size="large"
                variant="solid"
                color={pref === 'hide' ? 'primary' : 'secondary'}
                onPress={() => {
                  onSelectPref('hide')
                  control.close()
                }}>
                <ButtonText style={[a.flex_1, a.text_left]}>
                  {hideLabel}
                </ButtonText>
                {pref === 'hide' && (
                  <ButtonIcon icon={Check} position="right" />
                )}
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
                  {pref === 'warn' && (
                    <ButtonIcon icon={Check} position="right" />
                  )}
                </Button>
              )}

              <Button
                label={ignoreLabel}
                size="large"
                variant="solid"
                color={!disabled && pref === 'ignore' ? 'primary' : 'secondary'}
                onPress={() => {
                  onSelectPref('ignore')
                  control.close()
                }}>
                <ButtonText style={[a.flex_1, a.text_left]}>
                  {ignoreLabel}
                </ButtonText>
                {pref === 'ignore' && (
                  <ButtonIcon icon={Check} position="right" />
                )}
              </Button>
            </>
          )}
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
