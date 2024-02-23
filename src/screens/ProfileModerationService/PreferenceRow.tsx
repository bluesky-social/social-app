import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {LABEL_GROUPS} from '@atproto/api'
// TODO
import {ModPrefItem} from '@atproto/api/dist/client/types/app/bsky/actor/defs'

import {useLabelGroupStrings} from '#/lib/moderation/useLabelGroupStrings'
import {useModServiceLabelGroupEnableMutation} from '#/state/queries/modservice'
import {logger} from '#/logger'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as ToggleButton from '#/components/forms/ToggleButton'

export function PreferenceRow({
  labelGroup,
  disabled,
  modservicePreferences,
}: {
  labelGroup: keyof typeof LABEL_GROUPS
  disabled?: boolean
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
      if (!modservicePreferences)
        throw new Error(`modservicePreferences not found`)

      await mutateAsync({
        did: modservicePreferences.did,
        group: labelGroup,
        enabled: !enabled,
      })
    } catch (e: any) {
      logger.error(`Failed to toggle label group enabled`, {
        message: e.message,
        labelGroup,
      })
    }
  }, [mutateAsync, enabled, modservicePreferences, labelGroup])

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
