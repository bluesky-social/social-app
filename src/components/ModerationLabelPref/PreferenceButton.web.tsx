import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {InterprettedLabelValueDefinition, LabelPreference} from '@atproto/api'

import {useLabelBehaviorDescription} from '#/lib/moderation/useLabelBehaviorDescription'
import {
  NativeDropdown,
  DropdownItem,
} from '#/view/com/util/forms/NativeDropdown'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {ArrowTriangleBottom_Stroke2_Corner1_Rounded as ArrowTriangleBottom} from '../icons/ArrowTriangle'
import {useInteractionState} from '#/components/hooks/useInteractionState'

const CHECK_ICON: DropdownItem['icon'] = {
  web: ['fas', 'check'],
  ios: {name: 'trash'}, //doesnt matter
  android: '',
}

export function PreferenceButton({
  pref,
  labelValueDefinition,
  onSelectPref,
}: {
  pref: LabelPreference
  labelValueDefinition: InterprettedLabelValueDefinition
  onSelectPref: (pref: LabelPreference) => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  const settingDesc = useLabelBehaviorDescription(labelValueDefinition, pref)
  const hideLabel = useLabelBehaviorDescription(labelValueDefinition, 'hide')
  const warnLabel = useLabelBehaviorDescription(labelValueDefinition, 'warn')
  const ignoreLabel = useLabelBehaviorDescription(
    labelValueDefinition,
    'ignore',
  )
  const canWarn = !(
    labelValueDefinition.blurs === 'none' &&
    labelValueDefinition.severity === 'none'
  )

  const dropdownItems: DropdownItem[] = []
  dropdownItems.push({
    icon: pref === 'hide' ? CHECK_ICON : undefined,
    label: hideLabel,
    onPress: () => onSelectPref('hide'),
  })
  if (canWarn) {
    dropdownItems.push({
      icon: pref === 'warn' ? CHECK_ICON : undefined,
      label: warnLabel,
      onPress: () => onSelectPref('warn'),
    })
  }
  dropdownItems.push({
    icon: pref === 'ignore' ? CHECK_ICON : undefined,
    label: ignoreLabel,
    onPress: () => onSelectPref('ignore'),
  })

  return (
    <NativeDropdown
      items={dropdownItems}
      accessibilityLabel={_(msg`More post options`)}
      accessibilityHint="">
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_end,
          a.gap_xs,
          a.py_xs,
          a.rounded_2xs,
          hovered && {
            // @ts-ignore
            textDecorationLine: 'underline',
            textDecorationColor: t.palette.primary_500,
          },
        ]}
        // @ts-ignore
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}>
        <Text style={[{color: t.palette.primary_500}, a.font_semibold]}>
          {settingDesc}
        </Text>
        <ArrowTriangleBottom width={8} fill={t.palette.primary_500} />
      </View>
    </NativeDropdown>
  )
}
