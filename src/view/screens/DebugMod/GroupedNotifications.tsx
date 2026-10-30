import {useState} from 'react'
import {View} from 'react-native'
import {type DidString} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'

import {moderateNotification} from '#/state/queries/notifications/grouped/moderate'
import {
  type NonEmptyArray,
  type NotificationView,
} from '#/state/queries/notifications/grouped/types'
import {useSession} from '#/state/session'
import {NotificationItem} from '#/screens/Notifications/components/NotificationItem'
import {atoms as a, useTheme} from '#/alf'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {P, Text} from '#/components/Typography'
import {type app, type com} from '#/lexicons'
import {mock} from './mock'

type ProfileView = app.bsky.actor.defs.ProfileViewBasic
type PostView = app.bsky.feed.defs.PostView
type Label = com.atproto.label.defs.Label

/**
 * What a label scenario labels.
 */
export type LabelTarget = 'account' | 'profile' | 'post' | 'embed'

type GroupPosition = 'first' | 'among'

/**
 * One notification to render, with what it's showing.
 */
type MockNotification = {
  /**
   * The kind, e.g. "Like".
   */
  title: string
  /**
   * The variant, e.g. "multiple actors", if the kind has several.
   */
  subtitle?: string
  notification: NotificationView
}

/**
 * Threadgate-hidden replies aren't part of any scenario.
 */
const NO_HIDDEN_REPLIES: ReadonlySet<string> = new Set()

/**
 * People who appear alongside the target in groups. They're never moderated,
 * so hiding the target trims a group rather than dropping it.
 */
const carol = bystander('carol.test', 'Carol Carlson')
const dave = bystander('dave.test', 'Dave Davidson')
const erin = bystander('erin.test', 'Erin Ericsson')

/**
 * Every Notifications v2 kind, built so that the scenario's target really
 * receives its labels, block or mute. Each row shows whether list-time
 * moderation would filter or trim it, then renders it regardless, under the
 * scenario's moderation settings.
 */
export function GroupedNotifications({
  profile,
  post,
  moderationOpts,
  labelTarget,
  label,
  isSelfLabel,
}: {
  /**
   * The scenario's target account, with its account or profile labels, and
   * blocked, muted or followed as the scenario says.
   */
  profile: app.bsky.actor.defs.ProfileViewBasic
  /**
   * A post by the target, with the scenario's post or embed labels.
   */
  post: PostView
  moderationOpts: ModerationOpts
  /**
   * Unset for block and mute scenarios, which only apply to the target.
   */
  labelTarget: LabelTarget | undefined
  label: string
  isSelfLabel: boolean
}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const [groupPosition, setGroupPosition] = useState<string[]>(['first'])

  const viewer = mock.profileViewBasic({
    handle: currentAccount?.handle ?? 'alice.test',
    displayName: 'You',
    viewer: mock.actorViewerState({}),
  })
  if (currentAccount) {
    viewer.did = currentAccount.did
  }

  const notifications = createMockNotifications({
    target: profile,
    targetPost: post,
    viewer,
    groupPosition: groupPosition[0] as GroupPosition,
    labelsFor: (on, {authorDid, uri}) =>
      labelTarget === on
        ? [
            mock.label({
              src: isSelfLabel ? authorDid : undefined,
              val: label,
              uri,
            }),
          ]
        : undefined,
  })

  return (
    <View style={[a.gap_xl]}>
      <View style={[a.gap_sm]}>
        <P style={[a.text_sm, t.atoms.text_contrast_medium]}>
          Actor kinds (likes, reposts, follows and the rest): the target is the
          actor. Post labels go on the post the row previews.
        </P>
        <P style={[a.text_sm, t.atoms.text_contrast_medium]}>
          Post kinds (replies, quotes, mentions and subscribed posts): the
          target wrote the post. Embed labels go on the quoted post.
        </P>
        <P style={[a.text_sm, t.atoms.text_contrast_medium]}>
          Groups add Carol, and Dave in groups of three or more, who are never
          moderated, so hiding the target trims the group rather than dropping
          it.
        </P>
        {profile.did === currentAccount?.did && (
          <P style={[a.text_sm, t.atoms.text_contrast_medium]}>
            The target is you. The real list never shows you as an actor, since
            hydration drops the viewer, but the rows still show how moderation
            treats your own account.
          </P>
        )}
      </View>

      <ToggleButton.Group
        label="Target position in groups"
        values={groupPosition}
        onChange={setGroupPosition}>
        <ToggleButton.Button name="first" label="Target first">
          <ToggleButton.ButtonText>Target first</ToggleButton.ButtonText>
        </ToggleButton.Button>
        <ToggleButton.Button name="among" label="Target among others">
          <ToggleButton.ButtonText>Target among others</ToggleButton.ButtonText>
        </ToggleButton.Button>
      </ToggleButton.Group>

      {notifications.map(item => (
        <MockGroupedNotification
          key={item.notification.id}
          title={item.title}
          subtitle={item.subtitle}
          notification={item.notification}
          moderationOpts={moderationOpts}
        />
      ))}
    </View>
  )
}

/**
 * A notification as received, and whether the list would show it.
 */
function MockGroupedNotification({
  title,
  subtitle,
  notification,
  moderationOpts,
}: {
  title: string
  subtitle?: string
  notification: NotificationView
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const listed = moderateNotification(notification, {
    moderationOpts,
    hiddenReplyUris: NO_HIDDEN_REPLIES,
  })
  const isTrimmed = !!listed && listed !== notification

  return (
    <View style={[a.gap_sm]}>
      <Text style={[a.text_md, a.font_semi_bold]}>
        {title}
        {!!subtitle && (
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            {' '}
            {subtitle}
          </Text>
        )}
      </Text>
      {!listed && (
        <P style={[t.atoms.bg_contrast_25, a.px_lg, a.py_md]}>
          Filtered from the list
        </P>
      )}
      {isTrimmed && (
        <P style={[t.atoms.bg_contrast_25, a.px_lg, a.py_md]}>
          The list trims the target from this group
        </P>
      )}
      <View style={[a.border, t.atoms.border_contrast_low]}>
        <NotificationItem notification={notification} />
      </View>
      {isTrimmed && (
        <>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            As shown in the list
          </Text>
          <View style={[a.border, t.atoms.border_contrast_low]}>
            <NotificationItem notification={listed} />
          </View>
        </>
      )}
    </View>
  )
}

/**
 * Builds every kind and variant around the scenario's target.
 */
function createMockNotifications({
  target,
  targetPost,
  viewer,
  groupPosition,
  labelsFor,
}: {
  target: ProfileView
  /**
   * A post by the target, already carrying the scenario's post or embed
   * labels.
   */
  targetPost: PostView
  /**
   * The account the notifications are for, who wrote the posts that get
   * liked, replied to and quoted.
   */
  viewer: app.bsky.actor.defs.ProfileViewBasic
  groupPosition: GroupPosition
  /**
   * The scenario's labels for a post, if they target `on`.
   */
  labelsFor: (
    on: LabelTarget,
    subject: {authorDid: string; uri: string},
  ) => Label[] | undefined
}): MockNotification[] {
  const indexedAt = new Date().toISOString()
  const carolActor = carol
  const daveActor = dave
  const group: NonEmptyArray<ProfileView> =
    groupPosition === 'first'
      ? [target, carolActor, daveActor]
      : [carolActor, target, daveActor]
  const pair: NonEmptyArray<ProfileView> =
    groupPosition === 'first' ? [target, carolActor] : [carolActor, target]
  const base = (id: string, count = 1) => ({
    id,
    isRead: false,
    indexedAt,
    count,
  })
  /**
   * The actors of a group, every one of them resolved unless `unresolved`
   * adds more without a profile, as when the API only hydrates some.
   */
  const actorGroup = (actors: NonEmptyArray<ProfileView>, unresolved = 0) => ({
    actors,
    actorDids: [
      ...actors.map(actor => actor.did),
      ...Array.from(
        {length: unresolved},
        (_, i): DidString => `did:plc:unresolved${i + 1}`,
      ),
    ],
  })
  const postLabels = (on: LabelTarget, author: {did: string}, rkey: string) =>
    labelsFor(on, {
      authorDid: author.did,
      uri: `at://${author.did}/app.bsky.feed.post/${rkey}`,
    })

  /*
   * Posts that the actor kinds react to. They have images, so that labels
   * which blur media blur the row's thumbnail.
   */
  const likedPost = mock.postView({
    rkey: 'liked',
    record: mock.post({text: 'A post of yours, with an image'}),
    author: viewer,
    embed: mock.imagesView(),
    labels: postLabels('post', viewer, 'liked'),
  })
  const otherLikedPost = mock.postView({
    rkey: 'liked-2',
    record: mock.post({text: 'Another post of yours'}),
    author: viewer,
  })
  const repostedPost = mock.postView({
    rkey: 'reposted',
    record: mock.post({text: 'A post by Erin that you reposted'}),
    author: erin,
    embed: mock.imagesView(),
    labels: postLabels('post', erin, 'reposted'),
  })
  const viaRepost = `at://${viewer.did}/app.bsky.feed.repost/fake`

  /*
   * Posts that the post kinds respond to.
   */
  const parentPost = mock.postView({
    rkey: 'parent',
    record: mock.post({text: 'A post of yours that got a reply'}),
    author: viewer,
  })
  /*
   * The target's post, quoting one of the viewer's. The quoted post is
   * image-only, so that the quote card shows its media, and the target's own
   * images sit alongside, so that post labels still blur media.
   */
  const quotingPost: PostView = {
    ...targetPost,
    embed: {
      $type: 'app.bsky.embed.recordWithMedia#view',
      media: mock.imagesView(),
      record: mock.embedRecordView({
        rkey: 'quoted',
        record: mock.post({text: ''}),
        author: viewer,
        labels: postLabels('embed', viewer, 'quoted'),
        embeds: [mock.imagesView()],
      }),
    },
  }
  const subscribedItems = [
    {actor: target, post: targetPost},
    {
      actor: carolActor,
      post: mock.postView({
        rkey: 'subscribed',
        record: mock.post({text: 'A new post from Carol'}),
        author: carol,
      }),
    },
    {
      actor: daveActor,
      post: mock.postView({
        rkey: 'subscribed',
        record: mock.post({text: 'A new post from Dave'}),
        author: dave,
      }),
    },
  ] as const

  const generator = mock.generatorView({
    creator: viewer,
    displayName: 'Your custom feed',
  })
  const starterPack = mock.starterPackViewBasic({
    creator: viewer,
    name: 'Your starter pack',
  })

  return [
    {
      title: 'Like',
      subtitle: 'single actor',
      notification: {
        ...base('like'),
        type: 'like',
        post: likedPost,
        ...actorGroup([target]),
      },
    },
    {
      title: 'Like',
      subtitle: 'two people, named',
      notification: {
        ...base('like-pair', pair.length),
        type: 'like',
        post: likedPost,
        ...actorGroup(pair),
      },
    },
    {
      title: 'Like',
      subtitle: 'multiple actors',
      notification: {
        ...base('like-group', group.length),
        type: 'like',
        post: likedPost,
        ...actorGroup(group),
      },
    },
    {
      title: 'Like',
      subtitle: 'large group, few profiles resolved',
      notification: {
        ...base('like-sparse', 20),
        type: 'like',
        post: likedPost,
        ...actorGroup(group, 17),
      },
    },
    {
      title: 'Repost',
      subtitle: 'single actor',
      notification: {
        ...base('repost'),
        type: 'repost',
        post: likedPost,
        ...actorGroup([target]),
      },
    },
    {
      title: 'Repost',
      subtitle: 'multiple actors',
      notification: {
        ...base('repost-group', group.length),
        type: 'repost',
        post: likedPost,
        ...actorGroup(group),
      },
    },
    {
      title: 'Like via repost',
      subtitle: 'multiple actors',
      notification: {
        ...base('like-via-repost', group.length),
        type: 'likeViaRepost',
        post: repostedPost,
        viaRepost,
        ...actorGroup(group),
      },
    },
    {
      title: 'Repost via repost',
      subtitle: 'multiple actors',
      notification: {
        ...base('repost-via-repost', group.length),
        type: 'repostViaRepost',
        post: repostedPost,
        viaRepost,
        ...actorGroup(group),
      },
    },
    {
      title: 'Multi-post like',
      subtitle: 'one actor, two posts',
      notification: {
        ...base('multi-post-like', 2),
        type: 'multiPostLike',
        actor: target,
        posts: [likedPost, otherLikedPost],
      },
    },
    {
      title: 'Multi-post repost',
      subtitle: 'one actor, two posts',
      notification: {
        ...base('multi-post-repost', 2),
        type: 'multiPostRepost',
        actor: target,
        posts: [likedPost, otherLikedPost],
      },
    },
    {
      title: 'Multi-post like via repost',
      subtitle: 'one actor, two posts',
      notification: {
        ...base('multi-post-like-via-repost', 2),
        type: 'multiPostLikeViaRepost',
        actor: target,
        posts: [repostedPost, otherLikedPost],
      },
    },
    {
      title: 'Multi-post repost via repost',
      subtitle: 'one actor, two posts',
      notification: {
        ...base('multi-post-repost-via-repost', 2),
        type: 'multiPostRepostViaRepost',
        actor: target,
        posts: [repostedPost, otherLikedPost],
      },
    },
    {
      title: 'Feed like',
      subtitle: 'multiple actors',
      notification: {
        ...base('generator-like', group.length),
        type: 'generatorLike',
        generator,
        ...actorGroup(group),
      },
    },
    {
      title: 'Subscribed post',
      subtitle: 'single post',
      notification: {
        ...base('subscribed-post'),
        type: 'subscribedPost',
        items: [subscribedItems[0]],
      },
    },
    {
      title: 'Subscribed post',
      subtitle: 'multiple authors',
      notification: {
        ...base('subscribed-post-group', subscribedItems.length),
        type: 'subscribedPost',
        items:
          groupPosition === 'first'
            ? [subscribedItems[0], subscribedItems[1], subscribedItems[2]]
            : [subscribedItems[1], subscribedItems[0], subscribedItems[2]],
      },
    },
    {
      title: 'Reply',
      subtitle: 'to your post',
      notification: {
        ...base('reply'),
        type: 'reply',
        post: targetPost,
        parent: {type: 'post', post: parentPost},
      },
    },
    {
      title: 'Reply',
      subtitle: 'to a blocked post',
      notification: {
        ...base('reply-blocked-parent'),
        type: 'reply',
        post: targetPost,
        parent: {type: 'blocked'},
      },
    },
    {
      title: 'Reply',
      subtitle: 'to a deleted post',
      notification: {
        ...base('reply-not-found-parent'),
        type: 'reply',
        post: targetPost,
        parent: {type: 'notFound'},
      },
    },
    {
      title: 'Quote',
      subtitle: 'of your post',
      notification: {...base('quote'), type: 'quote', post: quotingPost},
    },
    {
      title: 'Mention',
      notification: {...base('mention'), type: 'mention', post: targetPost},
    },
    {
      title: 'Follow',
      subtitle: 'single actor',
      notification: {
        ...base('follow'),
        type: 'follow',
        ...actorGroup([target]),
      },
    },
    {
      title: 'Follow',
      subtitle: 'two people, named',
      notification: {
        ...base('follow-pair', pair.length),
        type: 'follow',
        ...actorGroup(pair),
      },
    },
    {
      title: 'Follow',
      subtitle: 'multiple actors',
      notification: {
        ...base('follow-group', group.length),
        type: 'follow',
        ...actorGroup(group),
      },
    },
    {
      title: 'Follow back',
      notification: {...base('follow-back'), type: 'followBack', actor: target},
    },
    {
      title: 'Verified',
      subtitle: 'by the target',
      notification: {...base('verified'), type: 'verified', actor: target},
    },
    {
      title: 'Unverified',
      subtitle: 'by the target',
      notification: {...base('unverified'), type: 'unverified', actor: target},
    },
    {
      title: 'Starter pack joined',
      notification: {
        ...base('starter-pack-joined'),
        type: 'starterPackJoined',
        actor: target,
        starterPack,
      },
    },
    {
      title: 'Contact match',
      notification: {
        ...base('contact-match'),
        type: 'contactMatch',
        actor: target,
      },
    },
  ]
}

function bystander(handle: string, displayName: string) {
  return mock.profileViewBasic({
    handle,
    displayName,
    viewer: mock.actorViewerState({}),
  })
}
