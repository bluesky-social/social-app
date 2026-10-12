import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {
  NotificationFollowSmall_Filled_Corner0_Rounded as PersonPlusIcon,
  NotificationStarterPackSmall_Filled_Corner0_Rounded as StarterPackIcon,
  NotificationVerifiedSmall_Filled_Corner0_Rounded as CheckIcon,
} from '#/components/icons/Notification'
import type * as bsky from '#/types/bsky'
import * as Item from '../Item'
import {type NotificationOf} from '../types'

/**
 * Caches a profile view before navigating to it, so the profile screen can
 * render immediately.
 */
function useCacheProfile(profile: bsky.profile.AnyProfileView) {
  const queryClient = useQueryClient()
  return () => unstableCacheProfileView(queryClient, profile)
}

/**
 * Someone, or a group of people, followed the viewer.
 */
export function FollowNotification({
  notification,
}: {
  notification: NotificationOf<'follow'>
}) {
  return notification.count > 1 ? (
    <GroupedFollowNotification notification={notification} />
  ) : (
    <SingleFollowNotification notification={notification} />
  )
}

/**
 * One follow: who it was, how they found you (a starter pack, or who you have
 * in common), and a button to follow them back. Pressing the row opens their
 * profile.
 */
function SingleFollowNotification({
  notification,
}: {
  notification: NotificationOf<'follow'>
}) {
  const {starterPack} = notification
  const [actor] = notification.actors
  const cacheProfile = useCacheProfile(actor)

  return (
    <Item.Root
      href={makeProfileLink(actor)}
      isRead={notification.isRead}
      // Lets screen readers reach the follow button
      accessible={false}
      onBeforePress={cacheProfile}
      testID={`notification-follow-${notification.id}`}>
      <Item.Avatar profile={actor} icon={PersonPlusIcon} tone="follow" />
      <Item.Content>
        <View style={[a.gap_xs]}>
          <Item.PrimaryText>
            <Trans>
              <Item.Name profile={actor} /> followed you
            </Trans>
          </Item.PrimaryText>
          {starterPack && Item.getStarterPackName(starterPack) ? (
            <Item.ViaStarterPack starterPack={starterPack} />
          ) : (
            <Item.SocialProof profile={actor} variant="long" />
          )}
        </View>
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
      <Item.Trailing>
        <Item.FollowButton profile={actor} logContext="NotificationFollowRow" />
      </Item.Trailing>
    </Item.Root>
  )
}

/**
 * Several follows. Pressing the row expands a list of the followers, each
 * with their own follow button. The list starts with those the API resolved,
 * and "Show more" loads the rest, though the group may still hold fewer than
 * `count`.
 *
 * The row's own link goes to the viewer's followers list, since that shows
 * everyone. It's reached by a screen reader action on the row.
 */
function GroupedFollowNotification({
  notification,
}: {
  notification: NotificationOf<'follow'>
}) {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const {actor, name, second, secondName, others} =
    Item.useGroupNames(notification)

  return (
    <Item.GroupRoot
      notification={notification}
      href={
        currentAccount
          ? makeProfileLink(currentAccount, 'followers')
          : makeProfileLink(actor)
      }
      label={
        second
          ? l`${name} and ${secondName} followed you`
          : l`${name} and ${plural(others, {
              one: '# other',
              other: '# others',
            })} followed you`
      }
      toggleOnPress
      accessibilityActions={
        currentAccount
          ? [{name: 'viewFollowers', label: l`View all followers`}]
          : undefined
      }
      onAccessibilityAction={event => {
        if (
          event.nativeEvent.actionName === 'viewFollowers' &&
          currentAccount
        ) {
          navigation.push('ProfileFollowers', {name: currentAccount.did})
        }
      }}
      testID={`notification-follow-${notification.id}`}>
      <Item.Avatar profile={actor} icon={PersonPlusIcon} tone="follow" />
      <Item.Content>
        <Item.AvatarRow />
        <Item.PrimaryText>
          {second ? (
            <Trans>
              <Item.Name profile={actor} /> and <Item.Name profile={second} />{' '}
              followed you
            </Trans>
          ) : (
            <Trans>
              <Item.Name profile={actor} /> and{' '}
              <Item.Strong>
                <Plural value={others} one="# other" other="# others" />
              </Item.Strong>{' '}
              followed you
            </Trans>
          )}
        </Item.PrimaryText>
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
    </Item.GroupRoot>
  )
}

/**
 * Someone the viewer follows followed them back. Pressing the row opens their
 * profile.
 */
export function FollowBackNotification({
  notification,
}: {
  notification: NotificationOf<'followBack'>
}) {
  const {t: l} = useLingui()
  const {actor, starterPack} = notification
  const name = Item.useDisplayName(actor)
  const cacheProfile = useCacheProfile(actor)
  const starterPackName = starterPack
    ? Item.getStarterPackName(starterPack)
    : undefined

  return (
    <Item.Root
      href={makeProfileLink(actor)}
      isRead={notification.isRead}
      label={
        starterPackName
          ? l`${name} followed you back via starter pack ${starterPackName}`
          : l`${name} followed you back`
      }
      onBeforePress={cacheProfile}
      style={a.align_center}
      testID={`notification-followBack-${notification.id}`}>
      <Item.Avatar profile={actor} icon={PersonPlusIcon} tone="follow" />
      <Item.Content style={a.gap_2xs}>
        <Item.PrimaryText>
          <Trans>
            <Item.Name profile={actor} /> followed you back! 🎉
          </Trans>
        </Item.PrimaryText>
        {starterPack && <Item.ViaStarterPack starterPack={starterPack} />}
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
    </Item.Root>
  )
}

/**
 * A trusted verifier verified the viewer. Pressing the row opens the
 * verifier's profile.
 */
export function VerifiedNotification({
  notification,
}: {
  notification: NotificationOf<'verified'>
}) {
  const {t: l} = useLingui()
  const {actor} = notification
  const name = Item.useDisplayName(actor)
  const cacheProfile = useCacheProfile(actor)

  return (
    <Item.Root
      href={makeProfileLink(actor)}
      isRead={notification.isRead}
      label={l`${name} verified you`}
      onBeforePress={cacheProfile}
      style={a.align_center}
      testID={`notification-verified-${notification.id}`}>
      <Item.Avatar profile={actor} icon={CheckIcon} tone="follow" />
      <Item.Content>
        <Item.PrimaryText>
          <Trans>
            <Item.Name profile={actor} /> verified you
          </Trans>
        </Item.PrimaryText>
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
    </Item.Root>
  )
}

/**
 * A verifier removed their verification of the viewer. Pressing the row
 * opens the verifier's profile.
 */
export function UnverifiedNotification({
  notification,
}: {
  notification: NotificationOf<'unverified'>
}) {
  const {t: l} = useLingui()
  const {actor} = notification
  const name = Item.useDisplayName(actor)
  const cacheProfile = useCacheProfile(actor)

  return (
    <Item.Root
      href={makeProfileLink(actor)}
      isRead={notification.isRead}
      label={l`${name} removed their verification from your account`}
      onBeforePress={cacheProfile}
      style={a.align_center}
      testID={`notification-unverified-${notification.id}`}>
      <Item.Avatar profile={actor} icon={CheckIcon} tone="neutral" />
      <Item.Content>
        <Item.PrimaryText>
          <Trans>
            <Item.Name profile={actor} /> removed their verification from your
            account
          </Trans>
        </Item.PrimaryText>
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
    </Item.Root>
  )
}

/**
 * Someone signed up for Bluesky with one of the viewer's starter packs.
 * Pressing the row opens their profile.
 */
export function StarterPackJoinedNotification({
  notification,
}: {
  notification: NotificationOf<'starterPackJoined'>
}) {
  const {actor, starterPack} = notification
  const cacheProfile = useCacheProfile(actor)

  return (
    <Item.Root
      href={makeProfileLink(actor)}
      isRead={notification.isRead}
      // Lets screen readers reach the button and the starter pack card
      accessible={false}
      onBeforePress={cacheProfile}
      testID={`notification-starterPackJoined-${notification.id}`}>
      <Item.Avatar profile={actor} icon={StarterPackIcon} tone="follow" />
      <Item.Content style={a.gap_sm}>
        <View style={[a.flex_row, a.align_start, a.gap_2xl]}>
          <Item.PrimaryText style={a.flex_1}>
            <Trans>
              <Item.Name profile={actor} /> signed up with your starter pack
            </Trans>
          </Item.PrimaryText>
          <Item.SayHelloButton profile={actor} />
        </View>
        <Item.StarterPackCard starterPack={starterPack} />
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
    </Item.Root>
  )
}

/**
 * One of the viewer's contacts joined Bluesky. Pressing the row opens their
 * profile.
 */
export function ContactMatchNotification({
  notification,
}: {
  notification: NotificationOf<'contactMatch'>
}) {
  const {actor} = notification
  const cacheProfile = useCacheProfile(actor)

  return (
    <Item.Root
      href={makeProfileLink(actor)}
      isRead={notification.isRead}
      // Lets screen readers reach the follow button
      accessible={false}
      onBeforePress={cacheProfile}
      style={a.align_center}
      testID={`notification-contactMatch-${notification.id}`}>
      <Item.Avatar profile={actor} />
      <Item.Content>
        <Item.PrimaryText>
          <Trans>
            Your contact <Item.Name profile={actor} /> is on Bluesky
          </Trans>
        </Item.PrimaryText>
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
      <Item.Trailing>
        <Item.FollowButton
          profile={actor}
          logContext="NotificationContactMatchRow"
        />
      </Item.Trailing>
    </Item.Root>
  )
}
