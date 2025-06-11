import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import {Bubble_Stroke2_Corner2_Rounded as BubbleIcon} from '#/components/icons/Bubble'
import {
  Heart2_Stroke2_Corner0_Rounded as HeartIcon,
  LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon,
} from '#/components/icons/Heart2'
import {PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {
  Repost_Stroke2_Corner2_Rounded as RepostIcon,
  RepostRepost_Stroke2_Corner2_Rounded as RepostRepostIcon,
} from '#/components/icons/Repost'
import {Shapes_Stroke2_Corner0_Rounded as ShapesIcon} from '#/components/icons/Shapes'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>
export function NotificationSettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
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
            to="/settings/notifications/replies"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={BubbleIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>Replies, Mentions, and Quotes</Trans>}
              subtitleText={<Trans>In-app, Push, Everyone</Trans>}
            />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for like notifications`)}
            to="/settings/notifications/likes"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={HeartIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>Likes</Trans>}
              subtitleText={<Trans>In-app, Push, Everyone</Trans>}
            />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for repost notifications`)}
            to="/settings/notifications/reposts"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={RepostIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>Reposts</Trans>}
              subtitleText={<Trans>In-app, Push, Everyone</Trans>}
            />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for new follower notifications`)}
            to="/settings/notifications/new-followers"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={PersonPlusIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>New followers</Trans>}
              subtitleText={<Trans>In-app, Push, Everyone</Trans>}
            />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for notifications for likes on your reposts`)}
            to="/settings/notifications/likes-on-reposts"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={LikeRepostIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>Likes on your reposts</Trans>}
              subtitleText={<Trans>In-app, Push, Everyone</Trans>}
            />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(
              msg`Settings for notifications for reposts on your reposts`,
            )}
            to="/settings/notifications/reposts-on-reposts"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={RepostRepostIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>Reposts on your reposts</Trans>}
              subtitleText={<Trans>In-app, Push, Everyone</Trans>}
            />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for other's activity`)}
            to="/settings/notifications/account-subscriptions"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={BellRingingIcon} />

            <ItemTextWithSubtitle
              titleText={<Trans>Other's activity</Trans>}
              subtitleText={<Trans>In-app, Push, Everyone</Trans>}
            />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            label={_(msg`Settings for notifications for everything else`)}
            to="/settings/notifications/miscellaneous"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={ShapesIcon} />
            <View style={[a.flex_1]}>
              <SettingsList.ItemText>
                <Trans>Everything else</Trans>
              </SettingsList.ItemText>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                In-app, Push, Everyone
              </Text>
            </View>
          </SettingsList.LinkItem>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function ItemTextWithSubtitle({
  titleText,
  subtitleText,
}: {
  titleText: React.ReactNode
  subtitleText: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View style={[a.flex_1, a.gap_2xs]}>
      <SettingsList.ItemText>
        <Trans>{titleText}</Trans>
      </SettingsList.ItemText>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>{subtitleText}</Trans>
      </Text>
    </View>
  )
}
