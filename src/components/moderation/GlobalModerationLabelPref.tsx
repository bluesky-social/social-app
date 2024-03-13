import React from 'react'
import {View} from 'react-native'
import {InterpretedLabelValueDefinition, LabelPreference} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

import {useGlobalLabelStrings} from '#/lib/moderation/useGlobalLabelStrings'
import {
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as ToggleButton from '#/components/forms/ToggleButton'

export function GlobalModerationLabelPref({
  labelValueDefinition,
  disabled,
}: {
  labelValueDefinition: InterpretedLabelValueDefinition
  disabled?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  const {identifier} = labelValueDefinition
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const savedPref = preferences?.moderationPrefs.labels[identifier]
  const pref = variables?.visibility ?? savedPref ?? 'warn'

  const allLabelStrings = useGlobalLabelStrings()
  const labelStrings =
    labelValueDefinition.identifier in allLabelStrings
      ? allLabelStrings[labelValueDefinition.identifier]
      : {
          name: labelValueDefinition.identifier,
          description: `Labeled "${labelValueDefinition.identifier}"`,
        }

  const labelOptions = {
    hide: _(msg`Hide`),
    warn: _(msg`Warn`),
    ignore: _(msg`Show`),
  }

  return (
    <View
      style={[
        a.flex_row,
        a.justify_between,
        a.gap_sm,
        a.py_md,
        a.pl_lg,
        a.pr_md,
        a.align_center,
      ]}>
      <View style={[a.gap_xs, a.flex_1]}>
        <Text style={[a.font_bold]}>{labelStrings.name}</Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {labelStrings.description}
        </Text>
      </View>
      <View style={[a.justify_center, {minHeight: 35}]}>
        {!disabled && (
          <ToggleButton.Group
            label={_(
              msg`Configure content filtering setting for category: ${labelStrings.name.toLowerCase()}`,
            )}
            values={[pref]}
            onChange={newPref =>
              mutate({
                label: identifier,
                visibility: newPref[0] as LabelPreference,
                labelerDid: undefined,
              })
            }>
            <ToggleButton.Button name="ignore" label={labelOptions.ignore}>
              {labelOptions.ignore}
            </ToggleButton.Button>
            <ToggleButton.Button name="warn" label={labelOptions.warn}>
              {labelOptions.warn}
            </ToggleButton.Button>
            <ToggleButton.Button name="hide" label={labelOptions.hide}>
              {labelOptions.hide}
            </ToggleButton.Button>
          </ToggleButton.Group>
        )}
      </View>
    </View>
  )
}
