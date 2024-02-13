import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {LABEL_GROUPS, AppBskyModerationDefs} from '@atproto/api'
// TODO
import {ModPrefItem} from '@atproto/api/dist/client/types/app/bsky/actor/defs'

import {useLabelGroupStrings} from '#/lib/moderation/useLabelGroupStrings'
import {useModServiceLabelGroupEnableMutation} from '#/state/queries/modservice'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as Toggle from '#/components/forms/Toggle'

export function PreferenceRow({
  labelGroup,
  modservicePreferences,
}: {
  labelGroup: keyof typeof LABEL_GROUPS
  modservicePreferences?: ModPrefItem
}) {
  const t = useTheme()
  const {_} = useLingui()
  const labelGroupStrings = useLabelGroupStrings()
  const groupInfoStrings = labelGroupStrings[labelGroup]
  const {mutateAsync, variables} = useModServiceLabelGroupEnableMutation()
  const enabled =
    variables?.enabled ??
    !modservicePreferences?.disabledLabelGroups?.includes(labelGroup)

  const onToggleEnabled = React.useCallback(async () => {
    try {
      await mutateAsync({
        // @ts-ignore TODO
        did: modservicePreferences?.did,
        group: labelGroup,
        enabled: !enabled,
      })
    } catch (e: any) {
      console.error(e)
    }
  }, [mutateAsync, enabled])

  return (
    <View
      style={[
        a.flex_row,
        a.justify_between,
        a.gap_sm,
        a.py_xs,
        a.align_center,
      ]}>
      <View style={[a.gap_xs, {width: '50%'}]}>
        <Text style={[a.font_bold]}>{groupInfoStrings.name}</Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {groupInfoStrings.description}
        </Text>
      </View>
      <View style={[a.justify_center, {minHeight: 35}]}>
        {modservicePreferences && (
          <Toggle.Item
            name="enable"
            value={enabled}
            onChange={onToggleEnabled}
            label="Enable">
            <Toggle.Label>{enabled ? 'Enabled' : 'Disabled'}</Toggle.Label>
            <Toggle.Switch />
          </Toggle.Item>
        )}
      </View>
    </View>
  )
}
