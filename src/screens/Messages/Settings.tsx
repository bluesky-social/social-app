import React, {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {isNative} from '#/platform/detection'
import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {useBackgroundNotificationPreferences} from '../../../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'
import {ClipClopGate} from './gate'

type AllowIncoming = 'all' | 'none' | 'following'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesSettings'>
export function MessagesSettingsScreen({}: Props) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({
    did: currentAccount!.did,
  })
  const {preferences, setPref} = useBackgroundNotificationPreferences()

  const {mutate: updateDeclaration} = useUpdateActorDeclaration({
    onError: () => {
      Toast.show(_(msg`Failed to update settings`))
    },
  })

  const onSelectItem = useCallback(
    (keys: string[]) => {
      const key = keys[0]
      if (!key) return
      updateDeclaration(key as AllowIncoming)
    },
    [updateDeclaration],
  )

  const gate = useGate()
  if (!gate('dms')) return <ClipClopGate />

  return (
    <CenteredView sideBorders style={a.h_full_vh}>
      <ViewHeader title={_(msg`Settings`)} showOnDesktop showBorder />
      <View style={[a.p_lg, a.gap_md]}>
        <Text style={[a.text_lg, a.font_bold]}>
          <Trans>Allow messages from</Trans>
        </Text>
        <Toggle.Group
          label={_(msg`Allow messages from`)}
          type="radio"
          values={[
            (profile?.associated?.chat?.allowIncoming as AllowIncoming) ??
              'following',
          ]}
          onChange={onSelectItem}>
          <View>
            <Toggle.Item
              name="all"
              label={_(msg`Everyone`)}
              style={[a.justify_between, a.py_sm]}>
              <Toggle.LabelText>
                <Trans>Everyone</Trans>
              </Toggle.LabelText>
              <Toggle.Radio />
            </Toggle.Item>
            <Toggle.Item
              name="following"
              label={_(msg`Users I follow`)}
              style={[a.justify_between, a.py_sm]}>
              <Toggle.LabelText>
                <Trans>Users I follow</Trans>
              </Toggle.LabelText>
              <Toggle.Radio />
            </Toggle.Item>
            <Toggle.Item
              name="none"
              label={_(msg`No one`)}
              style={[a.justify_between, a.py_sm]}>
              <Toggle.LabelText>
                <Trans>No one</Trans>
              </Toggle.LabelText>
              <Toggle.Radio />
            </Toggle.Item>
          </View>
        </Toggle.Group>
        {isNative && (
          <>
            <Divider style={[a.my_lg]} />
            <Toggle.Item
              name="playSoundChat"
              label={_(msg`Play notification sounds`)}
              value={preferences.playSoundChat}
              onChange={() => {
                setPref('playSoundChat', !preferences.playSoundChat)
              }}>
              <Toggle.Checkbox />
              <Toggle.LabelText>
                <Trans>Play notification sounds</Trans>
              </Toggle.LabelText>
            </Toggle.Item>
          </>
        )}
      </View>
    </CenteredView>
  )
}
