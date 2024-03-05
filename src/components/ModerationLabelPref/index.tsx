import React from 'react'
import {View} from 'react-native'
import {InterprettedLabelValueDefinition} from '@atproto/api'

import {useLabelStrings} from '#/lib/moderation/useLabelStrings'
import {useLabelBehaviorDescription} from '#/lib/moderation/useLabelBehaviorDescription'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {ArrowTriangleBottom_Stroke2_Corner1_Rounded as ArrowTriangleBottom} from '../icons/ArrowTriangle'

export function ModerationLabelPref({
  labelValueDefinition,
  disabled,
}: {
  labelValueDefinition: InterprettedLabelValueDefinition
  disabled?: boolean
}) {
  console.log({labelValueDefinition})
  const t = useTheme()
  const allLabelStrings = useLabelStrings()
  const labelStrings = labelValueDefinition.locales[0] // TODO look up locale
    ? labelValueDefinition.locales[0]
    : labelValueDefinition.identifier in allLabelStrings
    ? allLabelStrings[labelValueDefinition.identifier].general
    : {
        name: labelValueDefinition.identifier,
        description: `Labeled "${labelValueDefinition.identifier}"`,
      }
  const settingDesc = useLabelBehaviorDescription(labelValueDefinition, 'hide')

  // TODO add onChange behavior when mod prefs are updated

  return (
    <View style={[a.flex_row, a.justify_between, a.gap_lg, a.align_center]}>
      <View style={[a.gap_xs, a.flex_1]}>
        <Text style={[a.font_bold]}>{labelStrings.name}</Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
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
            {width: 125},
          ]}>
          <Text style={[{color: t.palette.primary_500}, a.font_semibold]}>
            {settingDesc}
          </Text>
          <ArrowTriangleBottom width={8} fill={t.palette.primary_500} />
        </View>
      )}
    </View>
  )
}
