import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useDmImageAlwaysBlur,
  useDmImageBlurFromNonFollows,
  useSetDmImageAlwaysBlur,
  useSetDmImageBlurFromNonFollows,
} from '#/state/preferences'
import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {useBackgroundNotificationPreferences} from '../../../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

type AllowIncoming = 'all' | 'none' | 'following'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesSettings'>

export function MessagesSettingsScreen(props: Props) {
  return <MessagesSettingsScreenInner {...props} />
}

export function MessagesSettingsScreenInner({}: Props) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({
    did: currentAccount!.did,
  })
  const {preferences, setPref} = useBackgroundNotificationPreferences()
  const blurFromNonFollows = useDmImageBlurFromNonFollows()
  const setBlurFromNonFollows = useSetDmImageBlurFromNonFollows()
  const alwaysBlur = useDmImageAlwaysBlur()
  const setAlwaysBlur = useSetDmImageAlwaysBlur()

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
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Chat Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.p_lg, a.gap_md]}>
          <Text style={[a.text_lg, a.font_semi_bold]}>
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
          {IS_NATIVE && (
            <>
              <Divider style={a.my_md} />
              <Text style={[a.text_lg, a.font_semi_bold]}>
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
          <Divider style={a.my_md} />
          <Text style={[a.text_lg, a.font_semi_bold]}>
            <Trans>Image Privacy</Trans>
          </Text>
          <Text style={[a.text_sm, a.pb_md, a.leading_snug]}>
            <Trans>
              Control when images in messages are blurred. Your own images are
              never blurred.
            </Trans>
          </Text>
          <View>
            <Toggle.Item
              name="dmImageBlurFromNonFollows"
              label={_(msg`Blur images from accounts you don't follow`)}
              value={blurFromNonFollows ?? false}
              onChange={setBlurFromNonFollows}
              style={[a.justify_between, a.py_sm]}>
              <Toggle.LabelText>
                <Trans>Blur images from accounts you don't follow</Trans>
              </Toggle.LabelText>
              <Toggle.Checkbox />
            </Toggle.Item>
            <Toggle.Item
              name="dmImageAlwaysBlur"
              label={_(msg`Always blur images in messages`)}
              value={alwaysBlur ?? false}
              onChange={setAlwaysBlur}
              style={[a.justify_between, a.py_sm]}>
              <Toggle.LabelText>
                <Trans>Always blur images in messages</Trans>
              </Toggle.LabelText>
              <Toggle.Checkbox />
            </Toggle.Item>
          </View>
          <Admonition type="tip" style={[a.mt_md]}>
            <Trans>
              When available, platform moderation will also apply to message
              images based on your content filter preferences.
            </Trans>
          </Admonition>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
