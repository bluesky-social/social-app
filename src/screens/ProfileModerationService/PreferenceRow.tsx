import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

import {useLabelGroupStrings} from '#/lib/moderation/useLabelGroupStrings'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as ToggleButton from '#/components/forms/ToggleButton'

export function PreferenceRow({labelGroup}: {labelGroup: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const labelGroupStrings = useLabelGroupStrings()
  const groupInfoStrings = labelGroupStrings[labelGroup]

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
      <View style={[a.gap_xs, {width: '50%'}]}>
        <Text style={[a.font_bold]}>{groupInfoStrings.name}</Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {groupInfoStrings.description}
        </Text>
      </View>
      <View style={[a.justify_center, {minHeight: 35}]}>
        <ToggleButton.Group
          label={_(
            msg`Configure content filtering setting for category: ${groupInfoStrings.name.toLowerCase()}`,
          )}
          values={['warn']}
          onChange={() => {}}>
          <ToggleButton.Button name="hide" label={labels.hide}>
            {labels.hide}
          </ToggleButton.Button>
          <ToggleButton.Button name="warn" label={labels.warn}>
            {labels.warn}
          </ToggleButton.Button>
          <ToggleButton.Button name="ignore" label={labels.show}>
            {labels.show}
          </ToggleButton.Button>
        </ToggleButton.Group>
      </View>
    </View>
  )
}
