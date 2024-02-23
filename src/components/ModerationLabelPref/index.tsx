import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {LABEL_GROUPS} from '@atproto/api'

import {useLabelGroupStrings} from '#/lib/moderation/useLabelGroupStrings'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as ToggleButton from '#/components/forms/ToggleButton'

export function ModerationLabelPref({
  labelGroup,
  disabled,
}: {
  labelGroup: keyof typeof LABEL_GROUPS
  disabled?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const labelGroupStrings = useLabelGroupStrings()
  const groupInfoStrings = labelGroupStrings[labelGroup]

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
        <Text style={[a.font_bold]}>{groupInfoStrings.name}</Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {groupInfoStrings.description}
        </Text>
      </View>
      <View style={[a.justify_center, {minHeight: 35}]}>
        {!disabled && (
          <ToggleButton.Group
            label={_(
              msg`Configure content filtering setting for category: ${groupInfoStrings.name.toLowerCase()}`,
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
