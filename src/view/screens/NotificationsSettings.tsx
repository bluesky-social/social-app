import React, {useCallback} from 'react'
import {Alert, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AllNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {CenteredView} from 'view/com/util/Views'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationsSettings'>
export function NotificationsSettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()

  const onChangePriority = useCallback((keys: string[]) => {
    const key = keys[0]
    if (!key) return
    Alert.alert('onChangePriority', key)
  }, [])

  return (
    <CenteredView sideBorders style={a.h_full_vh}>
      <ViewHeader
        title={_(msg`Notification Settings`)}
        showOnDesktop
        showBorder
      />
      <View style={[a.p_lg, a.gap_md]}>
        <Text style={[a.text_lg, a.font_bold]}>
          <Trans>Priority notifications</Trans>
        </Text>
        <Toggle.Group
          label={_(msg`Priority notifications`)}
          type="radio"
          values={['disabled']}
          onChange={onChangePriority}>
          <View>
            <Toggle.Item
              name="enabled"
              label={_(msg`Enabled`)}
              style={[a.justify_between, a.py_sm]}>
              <Toggle.LabelText>
                <Trans>Enabled</Trans>
              </Toggle.LabelText>
              <Toggle.Radio />
            </Toggle.Item>
            <Toggle.Item
              name="disabled"
              label={_(msg`Disabled`)}
              style={[a.justify_between, a.py_sm]}>
              <Toggle.LabelText>
                <Trans>Disabled</Trans>
              </Toggle.LabelText>
              <Toggle.Radio />
            </Toggle.Item>
          </View>
        </Toggle.Group>
        <View
          style={[
            a.mt_sm,
            a.px_xl,
            a.py_lg,
            a.rounded_md,
            t.atoms.bg_contrast_25,
          ]}>
          <Text style={[t.atoms.text_contrast_high]}>
            <Trans>
              You'll only recieve notifications from users you follow
            </Trans>
          </Text>
        </View>
      </View>
    </CenteredView>
  )
}
