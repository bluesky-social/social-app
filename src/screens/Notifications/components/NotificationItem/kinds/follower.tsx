import {View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {type NotificationView} from '#/state/queries/notifications/grouped/types'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import * as Item from '../Item'
import {type NotificationOf} from '../types'

/**
 * A notification that the Followers tab shows as people rather than as a
 * notification row.
 */
export type FollowerNotificationView = NotificationOf<'follow' | 'followBack'>

export function isFollowerNotification(
  notification: NotificationView,
): notification is FollowerNotificationView {
  return notification.type === 'follow' || notification.type === 'followBack'
}

/**
 * Everyone a follow or follow-back notification is about. In the Followers
 * tab each of them gets their own `FollowerNotification` row.
 */
export function getFollowers(notification: FollowerNotificationView) {
  return notification.type === 'follow'
    ? notification.actors
    : [notification.actor]
}

/**
 * The Followers tab's only section header. Unlike the other tabs, it isn't
 * split into "Today" and "Earlier".
 */
export function FollowedYouHeader() {
  const {t: l} = useLingui()

  return (
    <View style={[a.px_lg, a.py_md]}>
      <Text accessibilityRole="header" style={[a.text_md, a.font_bold]}>
        {l({
          message: 'Followed you',
          context: 'Notifications section header',
          comment:
            'Heading of the Followers tab of notifications, above the list of people who followed you',
        })}
      </Text>
    </View>
  )
}

/**
 * One person in the Followers tab: a compact profile row with how they found
 * you (a starter pack), who you have in common, or their handle, and a
 * follow button. There's no timestamp or unread tint, since the tab is a list
 * of people rather than a feed. Someone you already follow, e.g. from a
 * follow-back, still shows up, with the button reading "Following". Pressing
 * the row opens their profile.
 */
export function FollowerNotification({
  notification,
  profile,
}: {
  notification: FollowerNotificationView
  /**
   * One of `getFollowers(notification)`.
   */
  profile: bsky.profile.AnyProfileView
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const queryClient = useQueryClient()
  const name = Item.useDisplayName(profile)

  const {starterPack} = notification
  const viaStarterPack =
    starterPack && Item.getStarterPackName(starterPack)
      ? starterPack
      : undefined
  const showSocialProof = !viaStarterPack && Item.hasSocialProof(profile)

  let secondLine: React.ReactNode
  if (viaStarterPack) {
    secondLine = <Item.ViaStarterPack starterPack={viaStarterPack} />
  } else if (showSocialProof) {
    secondLine = (
      <Item.SocialProof
        profile={profile}
        variant={gtMobile ? 'long' : 'short'}
      />
    )
  } else {
    secondLine = (
      <Text
        emoji
        numberOfLines={1}
        style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
        {sanitizeHandle(profile.handle, '@')}
      </Text>
    )
  }

  return (
    <Item.Root
      href={makeProfileLink(profile)}
      isRead
      // Lets screen readers reach the follow button
      accessible={false}
      onBeforePress={() => unstableCacheProfileView(queryClient, profile)}
      style={[a.align_center, a.py_sm]}
      testID={`notification-${notification.type}-${notification.id}`}>
      {gtMobile ? (
        <Item.Avatar profile={profile} icon={PersonPlusIcon} tone="follow" />
      ) : (
        <PlainAvatar profile={profile} />
      )}
      <Item.Content
        // The avatar stack is taller than a line of text, so give it room
        style={showSocialProof ? a.gap_2xs : a.gap_0}>
        <View style={[a.flex_row, a.align_center]}>
          <Text
            emoji
            numberOfLines={1}
            style={[
              a.flex_shrink,
              a.text_sm,
              a.font_semi_bold,
              a.leading_snug,
              t.atoms.text,
            ]}>
            {name}
          </Text>
          <ProfileBadges profile={profile} size="sm" style={[a.pl_2xs]} />
        </View>
        {secondLine}
      </Item.Content>
      <Item.Trailing>
        <Item.FollowButton profile={profile} />
      </Item.Trailing>
    </Item.Root>
  )
}

/**
 * The bare avatar the designs use on mobile, where the rows drop the follow
 * badge that `Item.Avatar` makes room for.
 */
function PlainAvatar({profile}: {profile: bsky.profile.AnyProfileView}) {
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts)
    : undefined

  return (
    <PreviewableUserAvatar
      size={36}
      profile={profile}
      moderation={moderation?.ui('avatar')}
      type={profile.associated?.labeler ? 'labeler' : 'user'}
    />
  )
}
