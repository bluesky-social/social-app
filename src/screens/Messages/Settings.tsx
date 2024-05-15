import React, {useCallback} from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {UseQueryResult} from '@tanstack/react-query'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {RadioGroup} from '#/components/RadioGroup'
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
  }) as UseQueryResult<AppBskyActorDefs.ProfileViewDetailed, Error>
  const {preferences, setPref} = useBackgroundNotificationPreferences()

  const {mutate: updateDeclaration} = useUpdateActorDeclaration({
    onError: () => {
      Toast.show(_(msg`Failed to update settings`))
    },
  })

  const onSelectItem = useCallback(
    (key: string) => {
      updateDeclaration(key as AllowIncoming)
    },
    [updateDeclaration],
  )

  const gate = useGate()
  if (!gate('dms')) return <ClipClopGate />

  return (
    <CenteredView sideBorders style={a.h_full_vh}>
      <ViewHeader title={_(msg`Settings`)} showOnDesktop showBorder />
      <View style={[a.px_md, a.py_lg, a.gap_md]}>
        <Text style={[a.text_xl, a.font_bold, a.px_sm]}>
          <Trans>Allow messages from</Trans>
        </Text>
        <RadioGroup<AllowIncoming>
          value={
            (profile?.associated?.chat?.allowIncoming as AllowIncoming) ??
            'following'
          }
          items={[
            {label: _(msg`Everyone`), value: 'all'},
            {label: _(msg`People I Follow`), value: 'following'},
            {label: _(msg`No one`), value: 'none'},
          ]}
          onSelect={onSelectItem}
        />
      </View>
      <View style={[a.px_md, a.py_lg, a.gap_md]}>
        <Toggle.Item
          name="a"
          label="Click me"
          value={preferences.playSoundChat}
          onChange={() => {
            setPref('playSoundChat', !preferences.playSoundChat)
          }}>
          <Toggle.Checkbox />
          <Toggle.LabelText>Notification Sounds</Toggle.LabelText>
        </Toggle.Item>
      </View>
    </CenteredView>
  )
}
