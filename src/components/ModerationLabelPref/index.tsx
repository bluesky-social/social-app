import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {InterprettedLabelValueDefinition} from '@atproto/api'

import {useLabelStrings} from '#/lib/moderation/useLabelStrings'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as ToggleButton from '#/components/forms/ToggleButton'

export function ModerationLabelPref({
  labelValueDefinition,
  disabled,
}: {
  labelValueDefinition: InterprettedLabelValueDefinition
  disabled?: boolean
}) {
  console.log({labelValueDefinition})
  const t = useTheme()
  const {_} = useLingui()
  const allLabelStrings = useLabelStrings()
  const labelStrings = labelValueDefinition.locales[0] // TODO look up locale
    ? labelValueDefinition.locales[0]
    : labelValueDefinition.identifier in allLabelStrings
    ? allLabelStrings[labelValueDefinition.identifier].general
    : {
        general: {
          name: labelValueDefinition.identifier,
          description: `Labeled "${labelValueDefinition.identifier}"`,
        },
      }

  // TODO add onChange behavior when mod prefs are updated

  const labelOptions = {
    hide: _(msg`Hide`),
    warn: _(msg`Warn`),
    show: _(msg`Ignore`),
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
      <View style={[a.gap_xs, {width: '50%'}]}>
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
            values={['hide']}
            onChange={() => {}}>
            <ToggleButton.Button name="show" label={labelOptions.show}>
              {labelOptions.show}
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
