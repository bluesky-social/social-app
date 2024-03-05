import React from 'react'
import {View} from 'react-native'
import {InterprettedLabelValueDefinition, LabelPreference} from '@atproto/api'

import {useLabelStrings} from '#/lib/moderation/useLabelStrings'
import {
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {PreferenceButton} from './PreferenceButton'

export function ModerationLabelPref({
  labelValueDefinition,
  labelerDid,
  disabled,
}: {
  labelValueDefinition: InterprettedLabelValueDefinition
  labelerDid: string | undefined
  disabled?: boolean
}) {
  const t = useTheme()
  const allLabelStrings = useLabelStrings()
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()

  const {identifier} = labelValueDefinition
  const labelStrings = labelValueDefinition.locales[0] // TODO look up locale
    ? labelValueDefinition.locales[0]
    : labelValueDefinition.identifier in allLabelStrings
    ? allLabelStrings[labelValueDefinition.identifier].general
    : {
        name: labelValueDefinition.identifier,
        description: `Labeled "${labelValueDefinition.identifier}"`,
      }

  const savedPref = labelerDid
    ? preferences?.moderationPrefs.mods.find(m => m.did === labelerDid)?.labels[
        identifier
      ]
    : preferences?.moderationPrefs.labels[identifier]
  const pref = variables?.visibility ?? savedPref ?? 'warn'

  const onSelectPref = (newPref: LabelPreference) =>
    mutate({label: identifier, visibility: newPref, labelerDid})

  return (
    <View style={[a.flex_row, a.justify_between, a.gap_lg, a.align_center]}>
      <View style={[a.gap_xs, a.flex_1]}>
        <Text style={[a.font_bold]}>{labelStrings.name}</Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {labelStrings.description}
        </Text>
      </View>
      <View style={[{width: 110}]}>
        {!disabled && (
          <PreferenceButton
            name={labelStrings.name}
            pref={pref}
            labelValueDefinition={labelValueDefinition}
            onSelectPref={onSelectPref}
          />
        )}
      </View>
    </View>
  )
}
