import React from 'react'
import {View} from 'react-native'
import {InterpretedLabelValueDefinition, LabelPreference} from '@atproto/api'
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
import {InlineLink} from '#/components/Link'
import * as Dialog from '#/components/Dialog'
import {Button} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '../icons/CircleInfo'
import {SettingsGear2_Stroke2_Corner0_Rounded as Gear} from '../icons/Gear'
import * as Toggle from '#/components/forms/Toggle'
import {Divider} from '#/components/Divider'

export function ModerationLabelPref({
  labelValueDefinition,
  labelerDid,
  disabled,
}: {
  labelValueDefinition: InterpretedLabelValueDefinition
  labelerDid: string | undefined
  disabled?: boolean
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const isGlobalLabel = !labelValueDefinition.definedBy
  const {identifier} = labelValueDefinition
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const savedPref =
    labelerDid && !isGlobalLabel
      ? preferences?.moderationPrefs.labelers.find(l => l.did === labelerDid)
          ?.labels[identifier]
      : preferences?.moderationPrefs.labels[identifier]
  const pref =
    variables?.visibility ??
    savedPref ??
    labelValueDefinition.defaultSetting ??
    'warn'
  const [selected, setSelected] = React.useState<LabelPreference[]>([pref])

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
  const adultOnly = labelValueDefinition.flags.includes('adult')
  const adultDisabled =
    adultOnly && !preferences?.moderationPrefs.adultContentEnabled
  const cantConfigure = isGlobalLabel || adultDisabled

  const onSettingChange = React.useCallback(
    (newPrefs: LabelPreference[]) => {
      setSelected(newPrefs)
      mutate({label: identifier, visibility: newPrefs[0], labelerDid})
    },
    [mutate, labelerDid, identifier],
  )

  const settings = [
    {
      pref: 'hide',
      label: hideLabel,
    },
    canWarn && {
      pref: 'warn',
      label: warnLabel,
    },
    {
      pref: 'ignore',
      label: ignoreLabel,
    },
  ].filter(Boolean) as {
    pref: LabelPreference
    label: string
  }[]

  return (
    <>
      <Button
        onPress={() => control.open()}
        label={settingDesc}
        disabled={disabled}>
        {({hovered, focused, pressed}) => (
          <View
            style={[
              a.w_full,
              a.flex_row,
              a.justify_between,
              a.gap_sm,
              a.align_start,
              a.px_lg,
              a.py_lg,
              a.rounded_sm,
              t.atoms.bg_contrast_25,
              (hovered || focused || pressed) && [t.atoms.bg_contrast_50],
            ]}>
            <View style={[a.gap_xs]}>
              <Text style={[a.font_bold]}>{labelStrings.name}</Text>
              <Text
                style={[t.atoms.text_contrast_medium, a.leading_snug]}
                numberOfLines={1}>
                {labelStrings.description}
              </Text>
            </View>

            {!disabled && (
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.justify_end,
                  a.gap_xs,
                  a.rounded_2xs,
                ]}>
                <Text style={[t.atoms.text_contrast_medium, a.font_semibold]}>
                  {settingDesc}
                </Text>
                <Gear size="sm" fill={t.atoms.text_contrast_low.color} />
              </View>
            )}
          </View>
        )}
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />

        <Dialog.Inner
          label={_(msg`Settings for ${labelValueDefinition.identifier}`)}
          style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold, a.pb_xs, t.atoms.text]}>
            {labelStrings.name}
          </Text>
          <Text style={[a.text_md, a.pb_sm, t.atoms.text_contrast_medium]}>
            {labelStrings.description}
          </Text>

          {cantConfigure && (
            <View
              style={[
                a.flex_row,
                a.gap_xs,
                a.align_center,
                a.py_md,
                a.px_lg,
                a.rounded_sm,
                t.atoms.bg_contrast_25,
              ]}>
              <CircleInfo size="md" fill={t.atoms.text_contrast_medium.color} />

              <Text style={[t.atoms.text_contrast_medium]}>
                {adultDisabled ? (
                  <Trans>
                    Adult content must be enabled to configure this label.
                  </Trans>
                ) : isGlobalLabel ? (
                  <Trans>
                    {labelStrings.name} is configured in your{' '}
                    <InlineLink
                      to="/moderation"
                      onPress={() => control.close()}
                      style={a.text_md}>
                      global moderation settings
                    </InlineLink>
                    .
                  </Trans>
                ) : null}
              </Text>
            </View>
          )}

          {!cantConfigure && (
            <Toggle.Group<LabelPreference>
              type="radio"
              values={selected}
              onChange={onSettingChange}
              label={_(
                msg`Configure filtering settings for ${labelStrings.name}`,
              )}>
              <View
                style={[
                  a.rounded_md,
                  a.overflow_hidden,
                  t.atoms.bg_contrast_25,
                ]}>
                {settings.map((s, i) => (
                  <>
                    {i !== 0 && <Divider />}

                    <Toggle.Item name={s.pref} label={s.label}>
                      <View
                        style={[
                          a.flex_1,
                          a.flex_row,
                          a.align_center,
                          a.gap_md,
                          a.py_md,
                          a.px_lg,
                          t.atoms.bg_contrast_25,
                        ]}>
                        <Toggle.Radio />
                        <Text>{s.label}</Text>
                      </View>
                    </Toggle.Item>
                  </>
                ))}
              </View>
            </Toggle.Group>
          )}

          <Dialog.Close />
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
