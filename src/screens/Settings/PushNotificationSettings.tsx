import {useCallback, useEffect} from 'react'
import {AppState, View} from 'react-native'
import * as Notifications from 'expo-notifications'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQuery} from '@tanstack/react-query'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {isWeb} from '#/platform/detection'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Bubble_Stroke2_Corner2_Rounded as BubbleIcon} from '#/components/icons/Bubble'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {PhoneHaptic_Stroke2_Corner2_Rounded as PhoneHapticIcon} from '#/components/icons/Phone'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PushNotificationSettings'
>
export function PushNotificationSettingsScreen({navigation}: Props) {
  const {_} = useLingui()

  const {data: permission, refetch} = useQuery({
    queryKey: ['notification-permission'],
    queryFn: async () => {
      return await Notifications.getPermissionsAsync()
    },
  })

  useEffect(() => {
    const sub = AppState.addEventListener('change', () => refetch())
    return () => sub.remove()
  })

  // native only screen
  useFocusEffect(
    useCallback(() => {
      if (isWeb) {
        navigation.replace('Settings')
      }
    }, [navigation]),
  )

  const permissionDenied = permission && !permission.granted

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Push Notifications</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          {permissionDenied && (
            <>
              <SettingsList.Item>
                <SettingsList.ItemIcon icon={PhoneHapticIcon} />
                <SettingsList.ItemText>
                  Push notifications are disabled. Re-enable them in your device
                  settings.
                </SettingsList.ItemText>
              </SettingsList.Item>
              <SettingsList.Divider />
            </>
          )}
          <View style={permissionDenied && [{opacity: 0.5}]}>
            <SettingsList.Group>
              <SettingsList.ItemIcon icon={BubbleIcon} />
              <SettingsList.ItemText>
                <Trans>Reply and mention notifications</Trans>
              </SettingsList.ItemText>
              <NotificationToggle
                label={_(msg`Push notifications for replies and mentions`)}
                includeFollows
              />
            </SettingsList.Group>
            <SettingsList.Group>
              <SettingsList.ItemIcon icon={RepostIcon} />
              <SettingsList.ItemText>
                <Trans>Repost notifications</Trans>
              </SettingsList.ItemText>
              <NotificationToggle
                label={_(msg`Push notifications for reposts`)}
                includeFollows
              />
            </SettingsList.Group>
            <SettingsList.Group>
              <SettingsList.ItemIcon icon={HeartIcon} />
              <SettingsList.ItemText>
                <Trans>Like notifications</Trans>
              </SettingsList.ItemText>
              <NotificationToggle
                label={_(msg`Push notifications for likes`)}
                includeFollows
              />
            </SettingsList.Group>
            <SettingsList.Group>
              <SettingsList.ItemIcon icon={PersonPlusIcon} />
              <SettingsList.ItemText>
                <Trans>New follower notifications</Trans>
              </SettingsList.ItemText>
              <NotificationToggle
                label={_(msg`Push notifications for new followers`)}
                includeFollows
              />
            </SettingsList.Group>
            <SettingsList.Group>
              <SettingsList.ItemIcon icon={MessageIcon} />
              <SettingsList.ItemText>
                <Trans>Chat notifications</Trans>
              </SettingsList.ItemText>
              <NotificationToggle
                label={_(msg`Push notifications for chats`)}
              />
            </SettingsList.Group>
          </View>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function NotificationToggle({
  label,
  includeFollows,
}: {
  label: string
  includeFollows?: boolean
}) {
  const {_} = useLingui()
  return (
    <Toggle.Group
      label={label}
      type="radio"
      values={['all']}
      onChange={() => {}}>
      <View>
        <Toggle.Item
          name="all"
          label={_(msg`All`)}
          style={[a.justify_between, a.py_sm]}>
          <Toggle.LabelText>
            <Trans>All</Trans>
          </Toggle.LabelText>
          <Toggle.Radio />
        </Toggle.Item>
        {includeFollows && (
          <Toggle.Item
            name="follows"
            label={_(msg`People I follow`)}
            style={[a.justify_between, a.py_sm]}>
            <Toggle.LabelText>
              <Trans>People I follow</Trans>
            </Toggle.LabelText>
            <Toggle.Radio />
          </Toggle.Item>
        )}
        <Toggle.Item
          name="none"
          label={_(msg`None`)}
          style={[a.justify_between, a.py_sm]}>
          <Toggle.LabelText>
            <Trans>None</Trans>
          </Toggle.LabelText>
          <Toggle.Radio />
        </Toggle.Item>
      </View>
    </Toggle.Group>
  )
}
