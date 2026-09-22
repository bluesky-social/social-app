import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {type $Typed} from '@atproto/lex'
import {moderatePost} from '@bsky/sdk/moderation'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {MAX_POST_LINES} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {forceLTR} from '#/lib/strings/bidi'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
import {logger} from '#/logger'
import {POST_TOMBSTONE, usePostShadow} from '#/state/cache/post-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePostLikeMutationQueue} from '#/state/queries/post'
import {useChatClient, useRequireAuth, useSession} from '#/state/session'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {BellRinging_Filled_Corner0_Rounded as BellIcon} from '#/components/icons/BellRinging'
import {CheckThick_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Contacts_Filled_Corner2_Rounded as ContactsIcon} from '#/components/icons/Contacts'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilledIcon,
  Heart2_Stroke2_Corner0_Rounded as HeartIcon,
} from '#/components/icons/Heart2'
import {
  PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon,
  PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person'
import {OpenQuote_Filled_Stroke2_Corner0_Rounded as QuoteIcon} from '#/components/icons/Quote'
import {
  Reply as ReplyActionIcon,
  ReplyFilled as ReplyIcon,
} from '#/components/icons/Reply'
import {Repost_Stroke2_Corner3_Rounded as RepostIcon} from '#/components/icons/Repost'
import {StarterPack_Stroke2_Corner0_Rounded as StarterPackIcon} from '#/components/icons/StarterPack'
import {InlineLinkText} from '#/components/Link'
import * as MediaPreview from '#/components/MediaPreview'
import {PostMenuButton} from '#/components/PostControls/PostMenu'
import {ProfileBadges} from '#/components/ProfileBadges'
import * as ProfileCard from '#/components/ProfileCard'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import * as StarterPackCard from '#/components/StarterPack/StarterPackCard'
import * as Toast from '#/components/Toast'
import {app, chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import * as NotificationItem from '../NotificationItem'
import {
  type FollowGroup,
  type GeneratorLikeGroup,
  type GroupedNotification,
  type LikeGroup,
  type LikeViaRepostGroup,
  type MultiPostLikeGroup,
  type RepostGroup,
  type RepostViaRepostGroup,
  type SubscribedPostGroup,
} from './types'

export type {GroupedNotification} from './types'

const MAX_ACTORS = 5

export function GroupedNotificationItem({
  notification,
}: {
  notification: GroupedNotification
}) {
  switch (notification.$type) {
    case 'app.bsky.notification.getGroupedNotifications#likeGroup':
      return <ActorGroupItem notification={notification} kind="like" />
    case 'app.bsky.notification.getGroupedNotifications#multiPostLikeGroup':
      return <MultiPostLikeItem notification={notification} />
    case 'app.bsky.notification.getGroupedNotifications#repostGroup':
      return <ActorGroupItem notification={notification} kind="repost" />
    case 'app.bsky.notification.getGroupedNotifications#likeViaRepostGroup':
      return <ActorGroupItem notification={notification} kind="like-repost" />
    case 'app.bsky.notification.getGroupedNotifications#repostViaRepostGroup':
      return <ActorGroupItem notification={notification} kind="repost-repost" />
    case 'app.bsky.notification.getGroupedNotifications#followGroup':
      return <ActorGroupItem notification={notification} kind="follow" />
    case 'app.bsky.notification.getGroupedNotifications#subscribedPostGroup':
      return <SubscribedPostItem notification={notification} />
    case 'app.bsky.notification.getGroupedNotifications#generatorLikeGroup':
      return <ActorGroupItem notification={notification} kind="generator" />
    case 'app.bsky.notification.getGroupedNotifications#replyNotification':
      return <PostNotificationItem notification={notification} kind="reply" />
    case 'app.bsky.notification.getGroupedNotifications#quoteNotification':
      return <PostNotificationItem notification={notification} kind="quote" />
    case 'app.bsky.notification.getGroupedNotifications#mentionNotification':
      return <PostNotificationItem notification={notification} kind="mention" />
    case 'app.bsky.notification.getGroupedNotifications#followBackNotification':
      return (
        <ActorNotificationItem notification={notification} kind="follow-back" />
      )
    case 'app.bsky.notification.getGroupedNotifications#verifiedNotification':
      return (
        <ActorNotificationItem notification={notification} kind="verified" />
      )
    case 'app.bsky.notification.getGroupedNotifications#unverifiedNotification':
      return (
        <ActorNotificationItem notification={notification} kind="unverified" />
      )
    case 'app.bsky.notification.getGroupedNotifications#starterPackJoinedNotification':
      return (
        <ActorNotificationItem
          notification={notification}
          kind="starter-pack"
        />
      )
    case 'app.bsky.notification.getGroupedNotifications#contactMatchNotification':
      return (
        <ActorNotificationItem notification={notification} kind="contact" />
      )
    default:
      notification satisfies never
      return null
  }
}

type ActorGroupNotification =
  | LikeGroup
  | RepostGroup
  | LikeViaRepostGroup
  | RepostViaRepostGroup
  | FollowGroup
  | GeneratorLikeGroup

type ActorGroupKind =
  'like' | 'repost' | 'like-repost' | 'repost-repost' | 'follow' | 'generator'

function ActorGroupItem({
  notification,
  kind,
}: {
  notification: ActorGroupNotification
  kind: ActorGroupKind
}) {
  const t = useTheme()
  const firstActor = notification.actors[0]
  if (!firstActor) return null

  const shownActors = notification.actors.slice(1, MAX_ACTORS)
  const extraCount = Math.max(0, notification.count - shownActors.length - 1)
  const isFollow = kind === 'follow'
  const isRepost = kind === 'repost' || kind === 'repost-repost'
  const icon = isFollow
    ? PersonPlusIcon
    : isRepost
      ? RepostIcon
      : HeartFilledIcon
  const color = isFollow
    ? t.palette.primary_500
    : isRepost
      ? t.palette.positive_500
      : t.palette.pink

  return (
    <NotificationItem.Root
      testID={`notification-${notification.id}`}
      unread={!notification.isRead}>
      <NotificationItem.Avatar profile={firstActor} color={color} icon={icon} />
      <NotificationItem.Content>
        {notification.count > 1 && (
          <NotificationItem.AvatarList
            profiles={shownActors}
            extraCount={extraCount}
          />
        )}
        <ActorGroupText
          actor={firstActor}
          count={notification.count}
          kind={kind}
        />
        {'post' in notification ? (
          <PostPreview post={notification.post} />
        ) : 'generator' in notification ? (
          <FeedSourceCard
            feedUri={notification.generator.uri}
            feedData={
              notification.generator as $Typed<app.bsky.feed.defs.GeneratorView>
            }
            showLikes
            style={[a.mt_xs, a.rounded_sm]}
          />
        ) : notification.starterPack ? (
          <StarterPackCard.Notification
            starterPack={notification.starterPack}
          />
        ) : null}
        <NotificationTimestamp indexedAt={notification.indexedAt} />
        {isFollow && notification.count === 1 && (
          <FollowAction profile={firstActor} />
        )}
      </NotificationItem.Content>
    </NotificationItem.Root>
  )
}

function ActorGroupText({
  actor,
  count,
  kind,
}: {
  actor: app.bsky.actor.defs.ProfileView
  count: number
  kind: ActorGroupKind
}) {
  const actorLink = <ActorLink profile={actor} />
  const others = Math.max(0, count - 1)
  const othersText = (
    <NotificationItem.Strong>
      <Plural value={others} one="# other" other="# others" />
    </NotificationItem.Strong>
  )

  if (count === 1) {
    return (
      <NotificationItem.Text>
        {kind === 'like' ? (
          <Trans>{actorLink} liked your post</Trans>
        ) : kind === 'repost' ? (
          <Trans>{actorLink} reposted your post</Trans>
        ) : kind === 'like-repost' ? (
          <Trans>{actorLink} liked your repost</Trans>
        ) : kind === 'repost-repost' ? (
          <Trans>{actorLink} reposted your repost</Trans>
        ) : kind === 'follow' ? (
          <Trans>{actorLink} followed you</Trans>
        ) : (
          <Trans>{actorLink} liked your custom feed</Trans>
        )}
      </NotificationItem.Text>
    )
  }

  return (
    <NotificationItem.Text>
      {kind === 'like' ? (
        <Trans>
          {actorLink} and {othersText} liked your post
        </Trans>
      ) : kind === 'repost' ? (
        <Trans>
          {actorLink} and {othersText} reposted your post
        </Trans>
      ) : kind === 'like-repost' ? (
        <Trans>
          {actorLink} and {othersText} liked your repost
        </Trans>
      ) : kind === 'repost-repost' ? (
        <Trans>
          {actorLink} and {othersText} reposted your repost
        </Trans>
      ) : kind === 'follow' ? (
        <Trans>
          {actorLink} and {othersText} followed you
        </Trans>
      ) : (
        <Trans>
          {actorLink} and {othersText} liked your custom feed
        </Trans>
      )}
    </NotificationItem.Text>
  )
}

function SubscribedPostItem({
  notification,
}: {
  notification: SubscribedPostGroup
}) {
  const t = useTheme()
  const firstPost = notification.posts[0]
  if (!firstPost) return null

  return (
    <NotificationItem.Root
      testID={`notification-${notification.id}`}
      unread={!notification.isRead}>
      <NotificationItem.Avatar
        profile={notification.actor}
        color={t.palette.primary_500}
        icon={BellIcon}
      />
      <NotificationItem.Content>
        <NotificationItem.Text>
          <Trans>
            New <Plural value={notification.count} one="post" other="posts" />{' '}
            from <ActorLink profile={notification.actor} />
          </Trans>
        </NotificationItem.Text>
        <PostPreview post={firstPost} />
        <NotificationTimestamp indexedAt={notification.indexedAt} />
      </NotificationItem.Content>
    </NotificationItem.Root>
  )
}

function MultiPostLikeItem({notification}: {notification: MultiPostLikeGroup}) {
  const t = useTheme()
  const firstPost = notification.posts[0]
  if (!firstPost) return null

  return (
    <NotificationItem.Root
      testID={`notification-${notification.id}`}
      unread={!notification.isRead}>
      <NotificationItem.Avatar
        profile={notification.actor}
        color={t.palette.pink}
        icon={HeartFilledIcon}
      />
      <NotificationItem.Content>
        <NotificationItem.Text>
          <Trans>
            <ActorLink profile={notification.actor} /> liked{' '}
            <Plural
              value={notification.count}
              one="one of your posts"
              other="# of your posts"
            />
          </Trans>
        </NotificationItem.Text>
        <PostPreview post={firstPost} />
        <NotificationTimestamp indexedAt={notification.indexedAt} />
      </NotificationItem.Content>
    </NotificationItem.Root>
  )
}

type PostNotification = Extract<
  GroupedNotification,
  {
    $type:
      | 'app.bsky.notification.getGroupedNotifications#replyNotification'
      | 'app.bsky.notification.getGroupedNotifications#quoteNotification'
      | 'app.bsky.notification.getGroupedNotifications#mentionNotification'
  }
>

function PostNotificationItem({
  notification,
  kind,
}: {
  notification: PostNotification
  kind: 'reply' | 'quote' | 'mention'
}) {
  const t = useTheme()
  const author = notification.post.author
  const icon =
    kind === 'reply' ? ReplyIcon : kind === 'quote' ? QuoteIcon : AtIcon
  const color =
    kind === 'quote' ? tokens.color.temp_purple : t.palette.positive_500
  const parent = notification.parent
  const moderationOpts = useModerationOpts()
  const moderation = useMemo(
    () =>
      moderationOpts
        ? moderatePost(notification.post, moderationOpts)
        : undefined,
    [moderationOpts, notification.post],
  )

  if (!moderation || moderation.ui('contentList').filter) return null

  return (
    <NotificationItem.Root
      testID={`notification-${notification.id}`}
      unread={!notification.isRead}>
      <NotificationItem.Avatar profile={author} color={color} icon={icon} />
      <NotificationItem.Content>
        <ActorHeader profile={author} />
        {kind === 'reply' && parent && isPostView(parent) ? (
          <NotificationItem.SubjectText numberOfLines={1}>
            <Trans>↪ replied to: {getPostText(parent)}</Trans>
          </NotificationItem.SubjectText>
        ) : kind === 'quote' ? (
          <NotificationItem.SubjectText>
            <Trans>Quoted your post</Trans>
          </NotificationItem.SubjectText>
        ) : null}
        <PostPreview post={notification.post} fullColor />
        <NotificationTimestamp indexedAt={notification.indexedAt} />
        <PostActions post={notification.post} />
      </NotificationItem.Content>
    </NotificationItem.Root>
  )
}

type ActorNotification = Extract<
  GroupedNotification,
  {actor: app.bsky.actor.defs.ProfileView}
>

function ActorNotificationItem({
  notification,
  kind,
}: {
  notification: ActorNotification
  kind: 'follow-back' | 'verified' | 'unverified' | 'starter-pack' | 'contact'
}) {
  const t = useTheme()
  const {actor} = notification
  const icon =
    kind === 'verified'
      ? CheckIcon
      : kind === 'unverified'
        ? PersonXIcon
        : kind === 'starter-pack'
          ? StarterPackIcon
          : kind === 'contact'
            ? ContactsIcon
            : PersonPlusIcon
  const color =
    kind === 'unverified' ? t.palette.contrast_500 : t.palette.primary_500

  return (
    <NotificationItem.Root
      testID={`notification-${notification.id}`}
      unread={!notification.isRead}>
      <NotificationItem.Avatar profile={actor} color={color} icon={icon} />
      <NotificationItem.Content>
        <NotificationItem.Text>
          {kind === 'follow-back' ? (
            <Trans>
              <ActorLink profile={actor} /> followed you back
            </Trans>
          ) : kind === 'verified' ? (
            <Trans>
              <ActorLink profile={actor} /> verified you
            </Trans>
          ) : kind === 'unverified' ? (
            <Trans>
              <ActorLink profile={actor} /> removed their verification from your
              account
            </Trans>
          ) : kind === 'starter-pack' ? (
            <Trans>
              <ActorLink profile={actor} /> signed up with your starter pack
            </Trans>
          ) : (
            <Trans>
              Your contact <ActorLink profile={actor} /> is on Bluesky
            </Trans>
          )}
        </NotificationItem.Text>
        {'starterPack' in notification && (
          <StarterPackCard.Notification
            starterPack={notification.starterPack}
          />
        )}
        <NotificationTimestamp indexedAt={notification.indexedAt} />
        {kind === 'starter-pack' ? (
          <NotificationItem.Footer>
            <NotificationItem.Actions>
              <SayHelloButton profile={actor} />
            </NotificationItem.Actions>
          </NotificationItem.Footer>
        ) : kind === 'follow-back' || kind === 'contact' ? (
          <FollowAction profile={actor} />
        ) : null}
      </NotificationItem.Content>
    </NotificationItem.Root>
  )
}

function ActorLink({profile}: {profile: bsky.profile.AnyProfileView}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const name = sanitizeDisplayName(profile.displayName || profile.handle)

  return (
    <ProfileHoverCard did={profile.did} inline>
      <InlineLinkText
        emoji
        disableMismatchWarning
        label={l`Go to ${name}’s profile`}
        to={makeProfileLink(profile)}
        style={[
          a.font_semi_bold,
          t.atoms.text,
          web({direction: 'ltr', unicodeBidi: 'isolate'}),
        ]}>
        {forceLTR(name)}
        <ProfileBadges
          profile={profile}
          size="sm"
          style={[a.px_2xs, {transform: [{translateY: 1}]}]}
        />
      </InlineLinkText>
    </ProfileHoverCard>
  )
}

function ActorHeader({profile}: {profile: bsky.profile.AnyProfileView}) {
  const t = useTheme()

  return (
    <NotificationItem.Text numberOfLines={1}>
      <ActorLink profile={profile} />{' '}
      <NotificationItem.Text style={t.atoms.text_contrast_medium}>
        {sanitizeHandle(profile.handle, '@')}
      </NotificationItem.Text>
    </NotificationItem.Text>
  )
}

function NotificationTimestamp({indexedAt}: {indexedAt: string}) {
  const {i18n} = useLingui()

  return (
    <TimeElapsed timestamp={indexedAt}>
      {({timeElapsed}) => (
        <NotificationItem.Timestamp title={niceDate(i18n, indexedAt)}>
          {timeElapsed}
        </NotificationItem.Timestamp>
      )}
    </TimeElapsed>
  )
}

function PostPreview({
  post,
  fullColor = false,
}: {
  post: app.bsky.feed.defs.PostView
  fullColor?: boolean
}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const record = getPostRecord(post)
  const moderation = useMemo(
    () => (moderationOpts ? moderatePost(post, moderationOpts) : undefined),
    [moderationOpts, post],
  )
  const richText = useMemo(
    () =>
      record
        ? new RichTextAPI({text: record.text, facets: record.facets})
        : undefined,
    [record],
  )
  if (
    !record ||
    !richText ||
    !moderation ||
    moderation.ui('contentList').filter
  )
    return null

  return (
    <View style={[a.gap_xs]}>
      {!!record.text && (
        <RichText
          enableTags
          value={richText}
          authorHandle={post.author.handle}
          numberOfLines={MAX_POST_LINES}
          shouldProxyLinks
          style={[
            a.text_md,
            fullColor ? t.atoms.text : t.atoms.text_contrast_high,
          ]}
        />
      )}
      <MediaPreview.Embed embed={post.embed} peekable />
    </View>
  )
}

function PostActions({post}: {post: app.bsky.feed.defs.PostView}) {
  const postShadow = usePostShadow(post)
  if (postShadow === POST_TOMBSTONE) return null
  return <PostActionsInner post={postShadow} />
}

function PostActionsInner({
  post,
}: {
  post: Exclude<ReturnType<typeof usePostShadow>, typeof POST_TOMBSTONE>
}) {
  const {t: l} = useLingui()
  const {openComposer} = useOpenComposer()
  const requireAuth = useRequireAuth()
  const moderationOpts = useModerationOpts()
  const record = getPostRecord(post)
  const richText = useMemo(
    () =>
      record
        ? new RichTextAPI({text: record.text, facets: record.facets})
        : undefined,
    [record],
  )
  const moderation = useMemo(
    () => (moderationOpts ? moderatePost(post, moderationOpts) : undefined),
    [moderationOpts, post],
  )
  const [queueLike, queueUnlike] = usePostLikeMutationQueue(
    post,
    undefined,
    undefined,
    'FeedItem',
  )

  if (!record || !richText || !moderation) return null

  const onPressLike = () => {
    requireAuth(() => {
      const request = post.viewer?.like ? queueUnlike() : queueLike()
      void request.catch(error => {
        if ((error as Error).name !== 'AbortError') {
          Toast.show(l`An issue occurred, please try again.`, {type: 'error'})
        }
      })
    })
  }

  const onPressReply = () => {
    requireAuth(() => {
      openComposer({
        replyTo: {
          uri: post.uri,
          cid: post.cid,
          text: record.text,
          author: post.author,
          embed: post.embed,
          moderation,
          langs: record.langs,
        },
        logContext: 'PostReply',
      })
    })
  }

  return (
    <NotificationItem.Footer>
      <NotificationItem.Actions>
        <NotificationItem.Action
          label={post.viewer?.like ? l`Unlike` : l`Like`}
          icon={post.viewer?.like ? HeartIcon : HeartFilledIcon}
          onPress={onPressLike}
          text={post.viewer?.like ? l`Unlike` : l`Like`}
        />
        <NotificationItem.Action
          label={l`Reply`}
          icon={ReplyActionIcon}
          onPress={onPressReply}
          text={l`Reply`}
        />
      </NotificationItem.Actions>
      <NotificationItem.ActionSlot>
        <PostMenuButton
          testID={`postDropdownBtn-${post.uri}`}
          post={post}
          postFeedContext={undefined}
          postReqId={undefined}
          record={record}
          richText={richText}
          timestamp={post.indexedAt}
          logContext="FeedItem"
          forceGoogleTranslate={false}
        />
      </NotificationItem.ActionSlot>
    </NotificationItem.Footer>
  )
}

function FollowAction({profile}: {profile: app.bsky.actor.defs.ProfileView}) {
  const moderationOpts = useModerationOpts()
  if (!moderationOpts) return null

  return (
    <NotificationItem.Footer>
      <NotificationItem.Actions>
        <ProfileCard.FollowButton
          profile={profile}
          moderationOpts={moderationOpts}
          logContext="NotificationExpandedProfileCard"
          size="small"
        />
      </NotificationItem.Actions>
    </NotificationItem.Footer>
  )
}

function SayHelloButton({profile}: {profile: app.bsky.actor.defs.ProfileView}) {
  const {t: l} = useLingui()
  const client = useChatClient()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const [isLoading, setIsLoading] = useState(false)

  if (
    profile.associated?.chat?.allowIncoming === 'none' ||
    (profile.associated?.chat?.allowIncoming === 'following' &&
      !profile.viewer?.followedBy)
  ) {
    return null
  }

  const onPress = async () => {
    if (!currentAccount) return
    try {
      setIsLoading(true)
      const data = await client.call(chat.bsky.convo.getConvoForMembers, {
        members: [profile.did, currentAccount.did],
      })
      navigation.navigate('MessagesConversation', {
        conversation: data.convo.id,
      })
    } catch (error) {
      logger.error('Failed to get conversation', {safeMessage: error})
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <NotificationItem.Action
      label={l`Say hello!`}
      icon={ReplyActionIcon}
      disabled={isLoading}
      onPress={() => void onPress()}
      text={l`Say hello!`}
    />
  )
}

function getPostRecord(post: app.bsky.feed.defs.PostView) {
  return bsky.isType(app.bsky.feed.post, post.record) ? post.record : undefined
}

function getPostText(post: app.bsky.feed.defs.PostView) {
  return getPostRecord(post)?.text ?? ''
}

function isPostView(post: unknown): post is app.bsky.feed.defs.PostView {
  return bsky.isType(app.bsky.feed.defs.postView, post)
}
