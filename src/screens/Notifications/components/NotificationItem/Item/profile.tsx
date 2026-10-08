import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_10} from '#/lib/constants'
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {isBlockedOrBlocking} from '#/lib/moderation/blocked-and-muted'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useSession} from '#/state/session'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Button} from '#/components/Button'
import {canBeMessaged} from '#/components/dms/util'
import {StarterPack_Stroke2_Corner0_Rounded as StarterPackIcon} from '#/components/icons/brands/StarterPack'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {shouldShowKnownFollowers} from '#/components/KnownFollowers'
import {InlineLinkText, Link, useLink} from '#/components/Link'
import {ProfileBadges} from '#/components/ProfileBadges'
import {useStarterPackLink} from '#/components/StarterPack/StarterPackCard'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {type Metrics} from '#/analytics'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {Card} from './media'
import {useDisplayName} from './text'

type FollowLogContext = Metrics['profile:follow']['logContext'] &
  Metrics['profile:unfollow']['logContext']

const PILL_HEIGHT = 24

/**
 * The name of a starter pack, if its record is readable.
 */
export function getStarterPackName(
  starterPack: bsky.starterPack.AnyStarterPackView,
) {
  return bsky.isType(app.bsky.graph.starterpack, starterPack.record)
    ? starterPack.record.name
    : undefined
}

/**
 * The compact pill shared by `FollowButton` and `SayHelloButton`. Outlined in
 * blue by default, or a flat grey once the action is done.
 */
function PillButton({
  label,
  muted = false,
  disabled,
  onPress,
}: {
  label: string
  /**
   * Flat grey with no outline, e.g. for "Following".
   */
  muted?: boolean
  disabled?: boolean
  onPress: (event: GestureResponderEvent) => void
}) {
  const t = useTheme()

  return (
    <Button
      label={label}
      disabled={disabled}
      hitSlop={HITSLOP_10}
      onPress={onPress}
      style={[
        a.rounded_full,
        {height: PILL_HEIGHT, paddingHorizontal: 10, borderWidth: 1},
        muted
          ? [t.atoms.bg_contrast_50, {borderColor: 'transparent'}]
          : {borderColor: t.palette.primary_500},
        disabled && {opacity: 0.5},
      ]}
      hoverStyle={
        muted
          ? t.atoms.bg_contrast_100
          : {backgroundColor: t.palette.primary_50}
      }>
      <Text
        style={[
          a.text_xs,
          a.font_medium,
          {color: muted ? t.palette.contrast_300 : t.palette.primary_600},
        ]}>
        {label}
      </Text>
    </Button>
  )
}

/**
 * A compact follow pill for notification rows. Reads "Follow back" if they
 * already follow you, then "Following" once you follow them, and pressing it
 * again unfollows. Renders nothing for yourself, when signed out, or if
 * either of you has blocked the other.
 */
export function FollowButton({
  profile,
  logContext = 'ProfileCard',
}: {
  profile: bsky.profile.AnyProfileView
  logContext?: FollowLogContext
}) {
  const {currentAccount, hasSession} = useSession()
  if (!hasSession || profile.did === currentAccount?.did) return null
  return <FollowButtonInner profile={profile} logContext={logContext} />
}

function FollowButtonInner({
  profile: profileUnshadowed,
  logContext,
}: {
  profile: bsky.profile.AnyProfileView
  logContext: FollowLogContext
}) {
  const {t: l} = useLingui()
  const profile = useProfileShadow(profileUnshadowed)
  const name = useDisplayName(profile)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )

  if (!profile.viewer) return null
  if (
    profile.viewer.blockedBy ||
    profile.viewer.blocking ||
    profile.viewer.blockingByList
  ) {
    return null
  }

  const isFollowing = Boolean(profile.viewer.following)

  const onPress = async (event: GestureResponderEvent) => {
    // Keep the press from reaching the row
    event.preventDefault()
    event.stopPropagation()
    try {
      if (isFollowing) {
        await queueUnfollow()
        Toast.show(l`No longer following ${name}`)
      } else {
        await queueFollow()
        Toast.show(l`Following ${name}`)
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        Toast.show(l`An issue occurred, please try again.`, {type: 'error'})
      }
    }
  }

  const label = isFollowing
    ? l({
        message: 'Following',
        comment: 'User is following this account, click to unfollow',
      })
    : profile.viewer.followedBy
      ? l({
          message: 'Follow back',
          comment: 'User is not following this account, click to follow back',
        })
      : l({
          message: 'Follow',
          comment: 'User is not following this account, click to follow',
        })

  return (
    <PillButton
      label={label}
      muted={isFollowing}
      onPress={event => void onPress(event)}
    />
  )
}

/**
 * Opens a DM with `profile`, starting the conversation if there isn't one
 * yet. Renders nothing for yourself, when signed out, if they don't accept
 * messages from you, or if either of you has blocked the other.
 */
export function SayHelloButton({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}) {
  const {currentAccount, hasSession} = useSession()
  if (!hasSession || profile.did === currentAccount?.did) return null
  return <SayHelloButtonInner profile={profile} />
}

function SayHelloButtonInner({
  profile: profileUnshadowed,
}: {
  profile: bsky.profile.AnyProfileView
}) {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const requireEmailVerification = useRequireEmailVerification()
  const profile = useProfileShadow(profileUnshadowed)
  const {mutate: getConvoForMembers, isPending} = useGetConvoForMembers({
    onSuccess: ({convo}) => {
      navigation.navigate('MessagesConversation', {conversation: convo.id})
    },
    onError: () => {
      Toast.show(l`Failed to create conversation`, {type: 'error'})
    },
  })

  if (!canBeMessaged(profile) || isBlockedOrBlocking(profile)) return null

  const onPress = requireEmailVerification(
    () => getConvoForMembers([profile.did]),
    {
      instructions: [
        <Trans key="message">
          Before you can message another user, you must first verify your email.
        </Trans>,
      ],
    },
  )

  return (
    <PillButton
      label={l`Say hello!`}
      disabled={isPending}
      onPress={() => onPress()}
    />
  )
}

/**
 * Whether `SocialProof` has anything to show for `profile`.
 */
export function hasSocialProof(profile: bsky.profile.AnyProfileView) {
  const knownFollowers = profile.viewer?.knownFollowers
  return Boolean(
    knownFollowers &&
    knownFollowers.count > 0 &&
    shouldShowKnownFollowers(knownFollowers),
  )
}

/**
 * Up to three avatars of the people you follow who also follow `profile`,
 * then e.g. "23 mutual followers", or "23 mutuals" when `short`. Renders
 * nothing if there aren't any.
 */
export function SocialProof({
  profile,
  variant,
}: {
  profile: bsky.profile.AnyProfileView
  variant: 'long' | 'short'
}) {
  const t = useTheme()
  const knownFollowers = profile.viewer?.knownFollowers

  if (!knownFollowers || !hasSocialProof(profile)) {
    return null
  }

  const {count} = knownFollowers

  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      <AvatarStack
        profiles={knownFollowers.followers.slice(0, 3)}
        size={variant === 'long' ? 16 : 14}
        overlap={4}
        borderWidth={StyleSheet.hairlineWidth}
        backgroundColor={t.palette.contrast_25}
      />
      <Text
        numberOfLines={1}
        style={[
          a.flex_shrink,
          a.text_xs,
          a.leading_snug,
          t.atoms.text_contrast_medium,
        ]}>
        {variant === 'long' ? (
          <Plural
            value={count}
            one="# mutual follower"
            other="# mutual followers"
            comment="Number of people you follow who also follow this account"
          />
        ) : (
          <Plural
            value={count}
            one="# mutual"
            other="# mutuals"
            comment="Short form of “mutual followers”: the number of people you follow who also follow this account"
          />
        )}
      </Text>
    </View>
  )
}

/**
 * One line saying a follow came through a starter pack, linking to the pack.
 * Renders nothing if the pack's record can't be read.
 */
export function ViaStarterPack({
  starterPack,
}: {
  starterPack: bsky.starterPack.AnyStarterPackView
}) {
  const t = useTheme()
  const link = useStarterPackLink({view: starterPack})
  const name = getStarterPackName(starterPack)

  if (!name) return null

  return (
    <Text
      emoji
      numberOfLines={1}
      style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
      <Trans comment="When someone followed you through a starter pack, e.g. “via starter pack [icon] Science Pack”">
        via starter pack{' '}
        <StarterPackIcon
          size="xs"
          gradient="sky"
          style={{transform: [{translateY: 2}]}}
        />{' '}
        <InlineLinkText
          to={link.to}
          label={link.label}
          onPress={link.precache}
          onMouseEnter={link.precache}
          disableUnderline
          emoji
          style={[a.text_xs, a.font_medium, a.leading_snug, t.atoms.text]}>
          {name}
        </InlineLinkText>
      </Trans>
    </Text>
  )
}

/**
 * An outlined card for a starter pack, showing its name and creator, that
 * links to the pack. Renders nothing if the pack's record can't be read.
 */
export function StarterPackCard({
  starterPack,
}: {
  starterPack: bsky.starterPack.AnyStarterPackView
}) {
  const t = useTheme()
  const link = useStarterPackLink({view: starterPack})
  const name = getStarterPackName(starterPack)

  if (!name) return null

  const handle = sanitizeHandle(starterPack.creator.handle, '@')

  return (
    <Link to={link.to} label={link.label} onPress={link.precache}>
      {({hovered}) => (
        <Card style={[a.flex_1, hovered && t.atoms.bg_contrast_25]}>
          <Text
            emoji
            numberOfLines={2}
            style={[a.text_sm, a.font_semi_bold, a.leading_snug, t.atoms.text]}>
            {name}
          </Text>
          <Text
            emoji
            numberOfLines={1}
            style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_high]}>
            <Trans>Starter pack by {handle}</Trans>
          </Text>
        </Card>
      )}
    </Link>
  )
}

/**
 * The trailing chevron of an expandable row. Points down when collapsed and
 * up when expanded. Decorative: the row itself handles the press.
 *
 * Swaps icons rather than rotating one, since react-native-svg applies a
 * transform on the icon to its contents too, rotating the path out of view.
 */
export function ExpandChevron({expanded}: {expanded: boolean}) {
  const t = useTheme()
  const Icon = expanded ? ChevronUpIcon : ChevronDownIcon
  return <Icon size="md" style={[t.atoms.text_contrast_high]} />
}

/**
 * The expanded list of everyone in a grouped notification, each linking to
 * their profile with a follow button.
 */
export function ActorList({
  actors,
  starterPack,
}: {
  actors: bsky.profile.AnyProfileView[]
  /**
   * Shown as each actor's second line if they have no mutual followers.
   */
  starterPack?: bsky.starterPack.AnyStarterPackView
}) {
  return (
    <View>
      {actors.map((actor, index) => (
        <ActorListItem
          key={actor.did}
          profile={actor}
          starterPack={starterPack}
          isLast={index === actors.length - 1}
        />
      ))}
    </View>
  )
}

/**
 * One person in an `ActorList`: their avatar and name, a second line of
 * mutual followers, the starter pack they came through, or their handle, and
 * a follow button.
 */
export function ActorListItem({
  profile,
  starterPack,
  isLast = false,
}: {
  profile: bsky.profile.AnyProfileView
  starterPack?: bsky.starterPack.AnyStarterPackView
  /**
   * The last item drops its bottom padding, leaving it to the row.
   */
  isLast?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const queryClient = useQueryClient()
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts)
    : undefined
  const name = useDisplayName(profile)
  const {onPress} = useLink({to: makeProfileLink(profile), displayText: ''})

  let secondLine: React.ReactNode
  if (hasSocialProof(profile)) {
    secondLine = <SocialProof profile={profile} variant="short" />
  } else if (starterPack && getStarterPackName(starterPack)) {
    secondLine = <ViaStarterPack starterPack={starterPack} />
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
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_lg,
        isLast ? a.pt_sm : a.py_sm,
      ]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={l`Go to ${name}’s profile`}
        accessibilityHint=""
        onPress={event => {
          unstableCacheProfileView(queryClient, profile)
          onPress(event)
        }}
        style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
        <PreviewableUserAvatar
          size={32}
          profile={profile}
          moderation={moderation?.ui('avatar')}
          type={profile.associated?.labeler ? 'labeler' : 'user'}
          disableNavigation
        />
        <View style={[a.flex_1]}>
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
        </View>
      </Pressable>
      <FollowButton
        profile={profile}
        logContext="NotificationExpandedProfileCard"
      />
    </View>
  )
}
