import {View} from 'react-native'
import {type AppBskyNotificationDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useNotificationSettingsQuery} from '#/state/queries/notifications/settings'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {At_Stroke2_Corner2_Rounded as AtIcon} from '#/components/icons/At'
// import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import {Bubble_Stroke2_Corner2_Rounded as BubbleIcon} from '#/components/icons/Bubble'
import {
  Heart2_Stroke2_Corner0_Rounded as HeartIcon,
  LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon,
} from '#/components/icons/Heart2'
import {PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {CloseQuote_Stroke2_Corner0_Rounded as CloseQuoteIcon} from '#/components/icons/Quote'
import {
  Repost_Stroke2_Corner2_Rounded as RepostIcon,
  RepostRepost_Stroke2_Corner2_Rounded as RepostRepostIcon,
} from '#/components/icons/Repost'
import {Shapes_Stroke2_Corner0_Rounded as ShapesIcon} from '#/components/icons/Shapes'
import * as Layout from '#/components/Layout'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>
export function NotificationSettingsScreen({}: Props) {
  const {_} = useLingui()

  const {data: settings, isError} = useNotificationSettingsQuery()

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
          {isError && (
            <View style={[a.px_lg, a.pb_md]}>
              <Admonition type="error">
                <Trans>Failed to load notification settings.</Trans>
              </Admonition>
            </View>
          )}
          <SettingsList.LinkItem
            label={_(msg`Settings for reply notifications`)}
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
            label={_(msg`Settings for mention notifications`)}
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
            label={_(msg`Settings for quote notifications`)}
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
            label={_(msg`Settings for like notifications`)}
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
            label={_(msg`Settings for repost notifications`)}
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
            label={_(msg`Settings for new follower notifications`)}
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
            label={_(msg`Settings for notifications for likes on your reposts`)}
            to={{screen: 'LikesOnRepostsNotificationSettings'}}
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={LikeRepostIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>Likes on your reposts</Trans>}
              subtitleText={
                <SettingPreview preference={settings?.likeViaRepost} />
              }
              showSkeleton={!settings}
            />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(
              msg`Settings for notifications for reposts on your reposts`,
            )}
            to={{screen: 'RepostsOnRepostsNotificationSettings'}}
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={RepostRepostIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>Reposts on your reposts</Trans>}
              subtitleText={
                <SettingPreview preference={settings?.repostViaRepost} />
              }
              showSkeleton={!settings}
            />
          </SettingsList.LinkItem>
          {/* <SettingsList.LinkItem
            label={_(msg`Settings for other's activity`)}
            to={{screen: 'AccountSubscriptionSettings'}}
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={BellRingingIcon} />

            <ItemTextWithSubtitle
              titleText={<Trans>Other's activity</Trans>}
              subtitleText={<SettingPreview preference={settings?.subscribedPost} />}
              showSkeleton={!settings}
            />
          </SettingsList.LinkItem> */}
          <SettingsList.LinkItem
            label={_(msg`Settings for notifications for everything else`)}
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
  const {_} = useLingui()
  if (!preference) {
    return null
  } else {
    if (!preference.$type) throw new Error('Preference lacks $type')

    if (preference.$type === 'app.bsky.notification.defs#preference') {
      if (preference.list && preference.push) {
        return _(msg`In-app, Push`)
      } else if (preference.list) {
        return _(msg`In-app`)
      } else if (preference.push) {
        return _(msg`Push`)
      }
    } else if (
      preference.$type === 'app.bsky.notification.defs#filterablePreference'
    ) {
      if (preference.filter === 'all') {
        if (preference.list && preference.push) {
          return _(msg`In-app, Push, Everyone`)
        } else if (preference.list) {
          return _(msg`In-app, Everyone`)
        } else if (preference.push) {
          return _(msg`Push, Everyone`)
        }
      } else if (preference.filter === 'follows') {
        if (preference.list && preference.push) {
          return _(msg`In-app, Push, People you follow`)
        } else if (preference.list) {
          return _(msg`In-app, People you follow`)
        } else if (preference.push) {
          return _(msg`Push, People you follow`)
        }
      }
    }
  }

  return _(msg`Disabled`)
}
