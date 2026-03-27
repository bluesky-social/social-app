import {useEffect} from 'react'
import {Linking, View} from 'react-native'
import * as Notification from 'expo-notifications'
import {type AppBskyNotificationDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useAppState} from '#/lib/appState'
import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useNotificationSettingsQuery} from '#/state/queries/notifications/settings'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {At_Stroke2_Corner2_Rounded as AtIcon} from '#/components/icons/At'
import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import {Bubble_Stroke2_Corner2_Rounded as BubbleIcon} from '#/components/icons/Bubble'
import {Haptic_Stroke2_Corner2_Rounded as HapticIcon} from '#/components/icons/Haptic'
import {
  Heart2_Stroke2_Corner0_Rounded as HeartIcon,
  LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon,
} from '#/components/icons/Heart2'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {CloseQuote_Stroke2_Corner0_Rounded as CloseQuoteIcon} from '#/components/icons/Quote'
import {
  Repost_Stroke2_Corner2_Rounded as RepostIcon,
  RepostRepost_Stroke2_Corner2_Rounded as RepostRepostIcon,
} from '#/components/icons/Repost'
import {Shapes_Stroke2_Corner0_Rounded as ShapesIcon} from '#/components/icons/Shapes'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID, IS_IOS, IS_WEB} from '#/env'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'

const RQKEY = ['notification-permissions']

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>
export function NotificationSettingsScreen({}: Props) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const queryClient = useQueryClient()
  const {data: settings, isError} = useNotificationSettingsQuery()

  const isGroupChatEnabled = ax.features.enabled(ax.features.GroupChatsEnable)

  const {data: permissions, refetch} = useQuery({
    queryKey: RQKEY,
    queryFn: async () => {
      if (IS_WEB) return null
      return await Notification.getPermissionsAsync()
    },
  })

  const appState = useAppState()
  useEffect(() => {
    if (appState === 'active') {
      void refetch()
    }
  }, [appState, refetch])

  const onRequestPermissions = async () => {
    if (IS_WEB) return
    if (permissions?.canAskAgain) {
      const response = await Notification.requestPermissionsAsync()
      queryClient.setQueryData(RQKEY, response)
    } else {
      if (IS_ANDROID) {
        try {
          await Linking.sendIntent(
            'android.settings.APP_NOTIFICATION_SETTINGS',
            [
              {
                key: 'android.provider.extra.APP_PACKAGE',
                value: 'xyz.blueskyweb.app',
              },
            ],
          )
        } catch {
          void Linking.openSettings()
        }
      } else if (IS_IOS) {
        void Linking.openSettings()
      }
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Notifications</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          {permissions && !permissions.granted && (
            <>
              <SettingsList.PressableItem
                label={l`Enable push notifications`}
                onPress={() => void onRequestPermissions()}>
                <SettingsList.ItemIcon icon={HapticIcon} />
                <SettingsList.ItemText>
                  <Trans>Enable push notifications</Trans>
                </SettingsList.ItemText>
              </SettingsList.PressableItem>
              <SettingsList.Divider />
            </>
          )}
          {isError && (
            <View style={[a.px_lg, a.pb_md]}>
              <Admonition type="error">
                <Trans>Failed to load notification settings.</Trans>
              </Admonition>
            </View>
          )}
          <View style={[a.gap_sm]}>
            <SettingsList.LinkItem
              label={l`Settings for like notifications`}
              to={{screen: 'LikeNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={HeartIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Likes</Trans>}
                subtitleText={<SettingPreview preference={settings?.like} />}
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            <SettingsList.LinkItem
              label={l`Settings for new follower notifications`}
              to={{screen: 'NewFollowerNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={PersonPlusIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>New followers</Trans>}
                subtitleText={<SettingPreview preference={settings?.follow} />}
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            <SettingsList.LinkItem
              label={l`Settings for reply notifications`}
              to={{screen: 'ReplyNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={BubbleIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Replies</Trans>}
                subtitleText={<SettingPreview preference={settings?.reply} />}
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            <SettingsList.LinkItem
              label={l`Settings for mention notifications`}
              to={{screen: 'MentionNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={AtIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Mentions</Trans>}
                subtitleText={<SettingPreview preference={settings?.mention} />}
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            <SettingsList.LinkItem
              label={l`Settings for quote notifications`}
              to={{screen: 'QuoteNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={CloseQuoteIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Quotes</Trans>}
                subtitleText={<SettingPreview preference={settings?.quote} />}
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            <SettingsList.LinkItem
              label={l`Settings for repost notifications`}
              to={{screen: 'RepostNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={RepostIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Reposts</Trans>}
                subtitleText={<SettingPreview preference={settings?.repost} />}
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            <SettingsList.LinkItem
              label={l`Settings for activity from others`}
              to={{screen: 'ActivityNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={BellRingingIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Activity from others</Trans>}
                subtitleText={
                  <SettingPreview preference={settings?.subscribedPost} />
                }
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            <SettingsList.LinkItem
              label={l`Settings for notifications for likes of your reposts`}
              to={{screen: 'LikesOnRepostsNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={LikeRepostIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Likes of your reposts</Trans>}
                subtitleText={
                  <SettingPreview preference={settings?.likeViaRepost} />
                }
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            <SettingsList.LinkItem
              label={l`Settings for notifications for reposts of your reposts`}
              to={{screen: 'RepostsOnRepostsNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={RepostRepostIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Reposts of your reposts</Trans>}
                subtitleText={
                  <SettingPreview preference={settings?.repostViaRepost} />
                }
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
            {isGroupChatEnabled ? (
              <SettingsList.LinkItem
                label={l`Settings for notifications for new chat messages`}
                to={{screen: 'MessageNotificationSettings'}}
                contentContainerStyle={[a.align_start]}>
                <SettingsList.ItemIcon icon={MessageIcon} />
                <ItemTextWithSubtitle
                  titleText={<Trans>Chat messages</Trans>}
                  subtitleText={
                    <ChatSettingPreview preference={settings?.chat} />
                  }
                  showSkeleton={!settings}
                />
              </SettingsList.LinkItem>
            ) : null}
            <SettingsList.LinkItem
              label={l`Settings for notifications for everything else`}
              to={{screen: 'MiscellaneousNotificationSettings'}}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={ShapesIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Everything else</Trans>}
                // technically a bundle of several settings, but since they're set together
                // and are most likely in sync we'll just show the state of one of them
                subtitleText={
                  <SettingPreview preference={settings?.starterpackJoined} />
                }
                showSkeleton={!settings}
              />
            </SettingsList.LinkItem>
          </View>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function SettingPreview({
  preference,
}: {
  preference?:
    | AppBskyNotificationDefs.Preference
    | AppBskyNotificationDefs.FilterablePreference
}) {
  const {t: l} = useLingui()
  if (!preference) {
    return null
  } else {
    if ('include' in preference) {
      if (preference.include === 'all') {
        if (preference.list && preference.push) {
          return l`In-app, Push, Everyone`
        } else if (preference.list) {
          return l`In-app, Everyone`
        } else if (preference.push) {
          return l`Push, Everyone`
        }
      } else if (preference.include === 'follows') {
        if (preference.list && preference.push) {
          return l`In-app, Push, People you follow`
        } else if (preference.list) {
          return l`In-app, People you follow`
        } else if (preference.push) {
          return l`Push, People you follow`
        }
      }
    } else {
      if (preference.list && preference.push) {
        return l`In-app, Push`
      } else if (preference.list) {
        return l`In-app`
      } else if (preference.push) {
        return l`Push`
      }
    }
  }

  return l`Off`
}

function ChatSettingPreview({
  preference,
}: {
  preference?: AppBskyNotificationDefs.ChatPreference
}) {
  const {t: l} = useLingui()
  if (!preference) {
    return null
  }
  if (preference.push) {
    if (preference.include === 'all') {
      return l`Push, Everyone`
    } else if (preference.include === 'accepted') {
      return l`Push, Accepted`
    }
    return l`Push`
  }
  return l`Off`
}
