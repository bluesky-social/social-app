import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useFollowActorsQuery} from '#/state/queries/notifications/grouped'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {StarterPack_Stroke2_Corner0_Rounded as StarterPackIcon} from '#/components/icons/brands/StarterPack'
import {CheckThick_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
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
        <View style={[a.gap_2xs]}>
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
        <Item.FollowButton profile={actor} />
      </Item.Trailing>
    </Item.Root>
  )
}

/**
 * Several follows. Pressing the header expands a list of the followers, each
 * with their own follow button. The list starts with those the API resolved,
 * and "Show more" loads the rest, though the group may still hold fewer than
 * `count`.
 *
 * The row's own link goes to the viewer's followers list, since that shows
 * everyone. It's reached by the screen reader's default action, and by
 * presses beside the expanded list.
 */
function GroupedFollowNotification({
  notification,
}: {
  notification: NotificationOf<'follow'>
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const [isExpanded, setIsExpanded] = useState(false)
  const [actor] = notification.actors
  const name = Item.useDisplayName(actor)
  const others = notification.count - 1

  const label = l`${name} and ${plural(others, {
    one: '# other',
    other: '# others',
  })} followed you`

  const onToggleExpanded = () => {
    if (!isExpanded) {
      ax.metric('notifications:bundleExpand', {
        notificationType: 'follow',
        authorCount: notification.actors.length,
      })
    }
    setIsExpanded(!isExpanded)
  }

  return (
    <Item.Root
      href={
        currentAccount
          ? makeProfileLink(currentAccount, 'followers')
          : makeProfileLink(actor)
      }
      isRead={notification.isRead}
      label={label}
      // Once expanded, screen readers need to reach each follower
      accessible={!isExpanded}
      accessibilityActions={[
        {
          name: 'toggleExpanded',
          label: isExpanded
            ? l`Collapse list of users`
            : l`Expand list of users`,
        },
      ]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'toggleExpanded') {
          onToggleExpanded()
        }
      }}
      /*
       * The header and list stack vertically. Padding moves inside them, so
       * that the whole header toggles the list rather than its padding
       * following the row's link. Root pads with the longhands, which win over
       * the `padding` shorthand, so zero those.
       */
      style={[a.flex_col, a.align_stretch, a.gap_0, a.px_0, a.py_0]}
      testID={`notification-follow-${notification.id}`}>
      <Pressable
        accessible={isExpanded}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={l`Collapses list of users`}
        accessibilityState={{expanded: isExpanded}}
        onPress={onToggleExpanded}
        style={[a.flex_row, a.align_start, a.gap_md, a.px_lg, a.py_md]}>
        {/* The chevron sits at the top, while the text centres on the avatar */}
        <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_md]}>
          <Item.Avatar profile={actor} icon={PersonPlusIcon} tone="follow" />
          <Item.Content>
            <Item.PrimaryText>
              <Trans>
                <Item.Name profile={actor} /> and{' '}
                <Item.Strong>
                  <Plural value={others} one="# other" other="# others" />
                </Item.Strong>{' '}
                followed you
              </Trans>
            </Item.PrimaryText>
            <Item.Timestamp date={notification.indexedAt} />
          </Item.Content>
        </View>
        <Item.Trailing>
          <Item.ExpandChevron expanded={isExpanded} />
        </Item.Trailing>
      </Pressable>
      <Item.Expandable expanded={isExpanded}>
        <ExpandedFollowers notification={notification} />
      </Item.Expandable>
    </Item.Root>
  )
}

/**
 * The expanded list of a grouped follow: the followers it resolved, then any
 * loaded since with "Show more", which shows while there are more to load.
 * Loaded followers stay in the query cache, so they're still there if the
 * list is collapsed and expanded again.
 */
function ExpandedFollowers({
  notification,
}: {
  notification: NotificationOf<'follow'>
}) {
  const {t: l} = useLingui()
  const {actors, hasMore, isFetching, fetchNextPage} = useFollowActorsQuery({
    notification,
  })

  const onShowMore = async () => {
    const {error} = await fetchNextPage()
    if (!error) return
    if (!isNetworkError(error)) {
      logger.error('Failed to load more followers', {safeMessage: error})
    }
    Toast.show(l`Couldn’t load more followers, please try again`, {
      type: 'error',
    })
  }

  return (
    <View style={[a.px_lg, a.pb_md]}>
      <Item.ActorList
        actors={[...notification.actors, ...actors]}
        starterPack={notification.starterPack}>
        {hasMore && (
          <Item.ShowMoreActorsButton
            isLoading={isFetching}
            onPress={() => void onShowMore()}
          />
        )}
      </Item.ActorList>
    </View>
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
        <Item.FollowButton profile={actor} />
      </Item.Trailing>
    </Item.Root>
  )
}
