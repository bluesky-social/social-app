import {
  CONFIGURABLE_LABEL_GROUPS,
  ConfigurableLabelGroup,
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from 'state/queries/preferences'
import {atoms as a, useTheme} from '#/alf'
import React from 'react'
import {LabelPreference} from '@atproto/api'
import {View} from 'react-native'
import {Text} from '#/components/Typography'
import {isNative} from 'platform/detection'
import * as ToggleButton from '#/components/forms/ToggleButton'

export function ModerationOption({
  labelGroup,
}: {
  labelGroup: ConfigurableLabelGroup
}) {
  const t = useTheme()
  const groupInfo = CONFIGURABLE_LABEL_GROUPS[labelGroup]
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const visibility =
    variables?.visibility ?? preferences?.contentLabels?.[labelGroup]

  const onChange = React.useCallback(
    (vis: string[]) => {
      mutate({labelGroup, visibility: vis[0] as LabelPreference})
    },
    [mutate, labelGroup],
  )

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
        <Text style={[a.font_bold]}>{groupInfo.title}</Text>
        <Text style={[t.atoms.text_contrast_700]}>{groupInfo.subtitle}</Text>
      </View>
      <View style={[a.justify_center, {minHeight: 35}]}>
        {(isNative || !preferences?.adultContentEnabled) &&
        groupInfo.isAdultImagery ? (
          <Text style={[a.font_bold]}>Hide</Text>
        ) : (
          <ToggleButton.Group
            label="Preferences"
            values={[visibility ?? 'hide']}
            onChange={onChange}>
            <ToggleButton.Button name="hide" label="Hide">
              Hide
            </ToggleButton.Button>
            <ToggleButton.Button name="warn" label="Warn">
              Warn
            </ToggleButton.Button>
            <ToggleButton.Button name="show" label="Show">
              Show
            </ToggleButton.Button>
          </ToggleButton.Group>
        )}
      </View>
    </View>
  )
}
