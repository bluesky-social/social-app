import {type $Typed} from '@atproto/lex'

import {type app} from '#/lexicons'
import {type GroupedNotification} from './types'

const CID =
  'bafyreiclp443lavogvhj3d2ob2cxbfuscni2k5jk7bebjzg7khl3esabwq' as app.bsky.feed.defs.PostView['cid']

function timestamp(minutesAgo: number): GroupedNotification['indexedAt'] {
  return new Date(
    Date.now() - minutesAgo * 60_000,
  ).toISOString() as GroupedNotification['indexedAt']
}

function profile({
  id,
  handle,
  displayName,
  followedBy = false,
}: {
  id: string
  handle: string
  displayName: string
  followedBy?: boolean
}): app.bsky.actor.defs.ProfileView {
  const did = `did:web:${id}.notificationdummy.test`

  return {
    $type: 'app.bsky.actor.defs#profileView',
    did: did as app.bsky.actor.defs.ProfileView['did'],
    handle: handle as app.bsky.actor.defs.ProfileView['handle'],
    displayName,
    viewer: followedBy
      ? {
          followedBy:
            `at://${did}/app.bsky.graph.follow/dummy` as app.bsky.actor.defs.ViewerState['followedBy'],
        }
      : {},
    associated: {
      chat: {allowIncoming: 'all'},
    },
  }
}

function post({
  id,
  author,
  text,
  minutesAgo,
}: {
  id: string
  author: app.bsky.actor.defs.ProfileView
  text: string
  minutesAgo: number
}): $Typed<app.bsky.feed.defs.PostView> {
  const indexedAt = timestamp(minutesAgo)

  return {
    $type: 'app.bsky.feed.defs#postView',
    uri: `at://${author.did}/app.bsky.feed.post/${id}`,
    cid: CID,
    author: author as unknown as app.bsky.actor.defs.ProfileViewBasic,
    record: {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: indexedAt,
    } satisfies app.bsky.feed.post.Main,
    indexedAt: indexedAt,
    likeCount: 4,
    replyCount: 2,
    repostCount: 1,
    quoteCount: 1,
    viewer: {},
  }
}

const alice = profile({
  id: 'alice',
  handle: 'alice.test',
  displayName: 'Alice Chen',
  followedBy: true,
})
const bob = profile({
  id: 'bob',
  handle: 'bob.test',
  displayName: 'Bob Robertson',
})
const carla = profile({
  id: 'carla',
  handle: 'carla.test',
  displayName: 'Carla 🌱',
})
const devon = profile({
  id: 'devon',
  handle: 'devon.test',
  displayName: 'Devon',
  followedBy: true,
})
const elena = profile({
  id: 'elena',
  handle: 'elena.test',
  displayName: 'Elena García',
})
const farah = profile({
  id: 'farah',
  handle: 'farah.test',
  displayName: 'Farah',
})

const you = profile({
  id: 'you',
  handle: 'you.test',
  displayName: 'You',
})

const originalPost = post({
  id: 'original-post',
  author: you,
  text: 'A tiny garden update: the first tomatoes are finally here. 🍅',
  minutesAgo: 180,
})
const parentPost = post({
  id: 'parent-post',
  author: you,
  text: 'What is one small thing making your week better?',
  minutesAgo: 90,
})

const starterPack: app.bsky.graph.defs.StarterPackViewBasic = {
  $type: 'app.bsky.graph.defs#starterPackViewBasic',
  uri: `at://${you.did}/app.bsky.graph.starterpack/dummy-pack`,
  cid: CID,
  creator: you as unknown as app.bsky.actor.defs.ProfileViewBasic,
  indexedAt: timestamp(10),
  joinedAllTimeCount: 86,
  record: {
    $type: 'app.bsky.graph.starterpack',
    name: 'Friendly people of Bluesky',
    description: 'A welcoming group of interesting people to get you started.',
    list: `at://${you.did}/app.bsky.graph.list/dummy-list`,
    createdAt: timestamp(10),
  } satisfies app.bsky.graph.starterpack.Main,
}

const generator: app.bsky.feed.defs.GeneratorView = {
  $type: 'app.bsky.feed.defs#generatorView',
  uri: `at://${you.did}/app.bsky.feed.generator/dummy-feed`,
  cid: CID,
  did: you.did,
  creator: you,
  displayName: 'Quiet corners',
  description: 'Thoughtful posts from around the network.',
  indexedAt: timestamp(30),
  likeCount: 128,
}

const multiPostLikedPosts = [
  originalPost,
  post({
    id: 'another-liked-post',
    author: you,
    text: 'A second small update from the garden.',
    minutesAgo: 240,
  }),
]

const subscribedPosts = [
  post({
    id: 'subscribed-alice',
    author: alice,
    text: 'Found a lovely old bookshop on my walk today.',
    minutesAgo: 24,
  }),
  post({
    id: 'subscribed-alice-two',
    author: alice,
    text: 'The owner recommended a very strange little novel.',
    minutesAgo: 28,
  }),
]

const activityNotifications = [
  {
    $type: 'app.bsky.notification.getGroupedNotifications#likeGroup',
    id: 'likes',
    isRead: false,
    indexedAt: timestamp(2),
    post: originalPost,
    actors: [alice, bob, carla, devon, elena],
    count: 12,
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#multiPostLikeGroup',
    id: 'multi-post-likes',
    isRead: false,
    indexedAt: timestamp(5),
    actor: farah,
    posts: multiPostLikedPosts,
    postUris: multiPostLikedPosts.map(post => post.uri),
    count: 4,
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#repostGroup',
    id: 'reposts',
    isRead: true,
    indexedAt: timestamp(7),
    post: originalPost,
    actors: [bob, carla],
    count: 2,
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#likeViaRepostGroup',
    id: 'likes-via-repost',
    isRead: false,
    indexedAt: timestamp(12),
    post: originalPost,
    actors: [carla, devon, elena],
    count: 3,
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#repostViaRepostGroup',
    id: 'reposts-via-repost',
    isRead: true,
    indexedAt: timestamp(18),
    post: originalPost,
    actors: [devon],
    count: 1,
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#subscribedPostGroup',
    id: 'subscribed-posts',
    isRead: false,
    indexedAt: timestamp(24),
    actor: alice,
    posts: subscribedPosts,
    postUris: subscribedPosts.map(post => post.uri),
    count: 5,
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#generatorLikeGroup',
    id: 'generator-likes',
    isRead: true,
    indexedAt: timestamp(60 * 28),
    generator,
    actors: [elena, farah],
    count: 8,
  },
] satisfies GroupedNotification[]

const conversationNotifications = [
  {
    $type: 'app.bsky.notification.getGroupedNotifications#replyNotification',
    id: 'reply',
    isRead: false,
    indexedAt: timestamp(4),
    post: post({
      id: 'reply',
      author: alice,
      text: 'Mine is the first cup of coffee outside in the morning.',
      minutesAgo: 4,
    }),
    parent: parentPost,
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#quoteNotification',
    id: 'quote',
    isRead: true,
    indexedAt: timestamp(15),
    post: post({
      id: 'quote',
      author: bob,
      text: 'This is a very good question — the replies are delightful.',
      minutesAgo: 15,
    }),
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#mentionNotification',
    id: 'mention',
    isRead: false,
    indexedAt: timestamp(60 * 30),
    post: post({
      id: 'mention',
      author: carla,
      text: '@you.test I think you would love this little community garden!',
      minutesAgo: 60 * 30,
    }),
  },
] satisfies GroupedNotification[]

const followerNotifications = [
  {
    $type: 'app.bsky.notification.getGroupedNotifications#followGroup',
    id: 'follows',
    isRead: false,
    indexedAt: timestamp(6),
    actors: [farah, bob, elena],
    count: 6,
  },
  {
    $type: 'app.bsky.notification.getGroupedNotifications#followGroup',
    id: 'follow-via-starter-pack',
    isRead: true,
    indexedAt: timestamp(60 * 32),
    actors: [devon],
    count: 1,
    starterPack,
  },
  {
    $type:
      'app.bsky.notification.getGroupedNotifications#followBackNotification',
    id: 'follow-back',
    isRead: false,
    indexedAt: timestamp(60 * 34),
    actor: alice,
  },
  {
    $type:
      'app.bsky.notification.getGroupedNotifications#starterPackJoinedNotification',
    id: 'starter-pack-joined',
    isRead: true,
    indexedAt: timestamp(60 * 36),
    actor: carla,
    starterPack,
  },
  {
    $type:
      'app.bsky.notification.getGroupedNotifications#contactMatchNotification',
    id: 'contact-match',
    isRead: false,
    indexedAt: timestamp(60 * 38),
    actor: elena,
  },
] satisfies GroupedNotification[]

const accountNotifications = [
  {
    $type: 'app.bsky.notification.getGroupedNotifications#verifiedNotification',
    id: 'verified',
    isRead: false,
    indexedAt: timestamp(65),
    actor: alice,
  },
  {
    $type:
      'app.bsky.notification.getGroupedNotifications#unverifiedNotification',
    id: 'unverified',
    isRead: true,
    indexedAt: timestamp(60 * 42),
    actor: bob,
  },
] satisfies GroupedNotification[]

export const DUMMY_GROUPED_NOTIFICATIONS: GroupedNotification[] = [
  ...activityNotifications,
  ...conversationNotifications,
  ...followerNotifications,
  ...accountNotifications,
]
