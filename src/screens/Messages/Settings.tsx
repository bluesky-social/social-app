import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useBackgroundNotificationPreferences} from '../../../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

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
      Toast.show(_(msg`Failed to update settings`), 'xmark')
    },
  })

  const onSelectMessagesFrom = useCallback(
    (keys: string[]) => {
      const key = keys[0]
      if (!key) return
      updateDeclaration(key as AllowIncoming)
    },
    [updateDeclaration],
  )

  const onSelectSoundSetting = useCallback(
    (keys: string[]) => {
      const key = keys[0]
      if (!key) return
      setPref('playSoundChat', key === 'enabled')
    },
    [setPref],
  )

  return (
    <Layout.Screen testID="messagesSettingsScreen">
      <ScrollView stickyHeaderIndices={[0]}>
        <ViewHeader title={_(msg`Chat Settings`)} showOnDesktop showBorder />
        <View style={[a.p_lg, a.gap_md]}>
          <Text style={[a.text_lg, a.font_bold]}>
            <Trans>Allow new messages from</Trans>
          </Text>
          <Toggle.Group
            label={_(msg`Allow new messages from`)}
            type="radio"
            values={[
              (profile?.associated?.chat?.allowIncoming as AllowIncoming) ??
                'following',
            ]}
            onChange={onSelectMessagesFrom}>
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
          <Admonition type="tip">
            <Trans>
              You can continue ongoing conversations regardless of which setting
              you choose.
            </Trans>
          </Admonition>
          {isNative && (
            <>
              <Divider style={a.my_md} />
              <Text style={[a.text_lg, a.font_bold]}>
                <Trans>Notification Sounds</Trans>
              </Text>
              <Toggle.Group
                label={_(msg`Notification sounds`)}
                type="radio"
                values={[preferences.playSoundChat ? 'enabled' : 'disabled']}
                onChange={onSelectSoundSetting}>
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
            </>
          )}
        </View>
      </ScrollView>
    </Layout.Screen>
  )
}
