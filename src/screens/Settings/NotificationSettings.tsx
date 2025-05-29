import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {Bubble_Stroke2_Corner2_Rounded as BubbleIcon} from '#/components/icons/Bubble'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {Shapes_Stroke2_Corner0_Rounded as ShapesIcon} from '#/components/icons/Shapes'
import * as Layout from '#/components/Layout'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>
export function NotificationSettingsScreen({}: Props) {
  const {_} = useLingui()
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
          <SettingsList.LinkItem
            label={_(msg`Settings for reply, mention, and quote notifications`)}
            to="/settings/notifications/replies">
            <SettingsList.ItemIcon icon={BubbleIcon} />
            <SettingsList.ItemText>
              <Trans>Replies, mentions, and quotes</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for like notifications`)}
            to="/settings/notifications/likes">
            <SettingsList.ItemIcon icon={HeartIcon} />
            <SettingsList.ItemText>
              <Trans>Likes</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for repost notifications`)}
            to="/settings/notifications/reposts">
            <SettingsList.ItemIcon icon={RepostIcon} />
            <SettingsList.ItemText>
              <Trans>Reposts</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for new follower notifications`)}
            to="/settings/notifications/new-followers">
            <SettingsList.ItemIcon icon={PersonPlusIcon} />
            <SettingsList.ItemText>
              <Trans>New followers</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for notifications for likes on your reposts`)}
            to="/settings/notifications/likes-on-reposts">
            <SettingsList.ItemIcon icon={HeartIcon} />
            <SettingsList.ItemText>
              <Trans>Likes on your reposts</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(
              msg`Settings for notifications for reposts on your reposts`,
            )}
            to="/settings/notifications/reposts-on-reposts">
            <SettingsList.ItemIcon icon={RepostIcon} />
            <SettingsList.ItemText>
              <Trans>Reposts on your reposts</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for account subscription notifications`)}
            to="/settings/notifications/account-subscriptions">
            <SettingsList.ItemIcon icon={BellIcon} />
            <SettingsList.ItemText>
              <Trans>Account subscriptions</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for notifications for everything else`)}
            to="/settings/notifications/miscellaneous">
            <SettingsList.ItemIcon icon={ShapesIcon} />
            <SettingsList.ItemText>
              <Trans>Everything else</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
