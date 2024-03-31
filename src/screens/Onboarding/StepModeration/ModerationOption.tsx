import React from 'react'
import {View} from 'react-native'
import {InterpretedLabelValueDefinition, LabelPreference} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGlobalLabelStrings} from '#/lib/moderation/useGlobalLabelStrings'
import {
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences'
import {atoms as a, useTheme} from '#/alf'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Text} from '#/components/Typography'

export function ModerationOption({
  labelValueDefinition,
  disabled,
}: {
  labelValueDefinition: InterpretedLabelValueDefinition
  disabled?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const label = labelValueDefinition.identifier
  const visibility =
    variables?.visibility ?? preferences?.moderationPrefs.labels?.[label]

  const allLabelStrings = useGlobalLabelStrings()
  const labelStrings =
    labelValueDefinition.identifier in allLabelStrings
      ? allLabelStrings[labelValueDefinition.identifier]
      : {
          name: labelValueDefinition.identifier,
          description: `Labeled "${labelValueDefinition.identifier}"`,
        }

  const onChange = React.useCallback(
    (vis: string[]) => {
      mutate({
        label,
        visibility: vis[0] as LabelPreference,
        labelerDid: undefined,
      })
    },
    [mutate, label],
  )

  const labels = {
    hide: _(msg`Hide`),
    warn: _(msg`Warn`),
    show: _(msg`Show`),
  }

  return (
    <View
      style={[
        a.flex_row,
        a.justify_between,
        a.gap_sm,
        a.py_xs,
        a.px_xs,
        a.align_center,
      ]}>
      <View style={[a.gap_xs, a.flex_1]}>
        <Text style={[a.font_bold]}>{labelStrings.name}</Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {labelStrings.description}
        </Text>
      </View>
      <View style={[a.justify_center, {minHeight: 40}]}>
        {disabled ? (
          <Text style={[a.font_bold]}>
            <Trans>Hide</Trans>
          </Text>
        ) : (
          <ToggleButton.Group
            label={_(
              msg`Configure content filtering setting for category: ${labelStrings.name.toLowerCase()}`,
            )}
            values={[visibility ?? 'hide']}
            onChange={onChange}>
            <ToggleButton.Button name="ignore" label={labels.show}>
              {labels.show}
            </ToggleButton.Button>
            <ToggleButton.Button name="warn" label={labels.warn}>
              {labels.warn}
            </ToggleButton.Button>
            <ToggleButton.Button name="hide" label={labels.hide}>
              {labels.hide}
            </ToggleButton.Button>
          </ToggleButton.Group>
        )}
      </View>
    </View>
  )
}
