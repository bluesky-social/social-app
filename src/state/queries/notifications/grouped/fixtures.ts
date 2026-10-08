import {type $Typed, type Unknown$Type} from '@atproto/lex'
import {
  type AtUriString,
  type DatetimeString,
  type DidString,
  type HandleString,
  toDatetimeString,
} from '@atproto/syntax'

import {type app} from '#/lexicons'

type OutputBody = app.bsky.notification.getGroupedNotifications.$OutputBody
type Group = app.bsky.notification.getGroupedNotifications.Group
type ProfileViewDetailed = app.bsky.actor.defs.ProfileViewDetailed
type PostView = app.bsky.feed.defs.PostView
type GeneratorView = app.bsky.feed.defs.GeneratorView
type StarterPackView = app.bsky.graph.defs.StarterPackView
type BlockedPost = app.bsky.feed.defs.BlockedPost
type NotFoundPost = app.bsky.feed.defs.NotFoundPost

/**
 * The DID of the account the fixture's notifications are for ("you").
 */
export const VIEWER_DID: DidString = 'did:plc:tim'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const $group = 'app.bsky.notification.getGroupedNotifications' as const

/**
 * A realistic `getGroupedNotifications` response covering every kind and
 * variant, plus three groups that hydration must drop: an unknown kind, a
 * like on a blocked post, and a like whose actors are all unresolvable.
 *
 * Every timestamp is an offset from `now`, so Storybook shows sensible
 * relative times and tests can pass a fixed date.
 */
export function createGroupedNotificationsFixture(
  now: Date = new Date(),
): OutputBody {
  const ago = (ms: number): DatetimeString =>
    toDatetimeString(new Date(now.getTime() - ms))

  /*
   * Profiles
   */

  const tim = profile({
    did: VIEWER_DID,
    handle: 'tim.bsky.team',
    displayName: 'Tim',
  })
  const danielle = profile({
    did: 'did:plc:danielleyuhan',
    handle: 'danielleyuhan.bsky.social',
    displayName: 'danielleyuhan',
    description: 'Designer. Hiker. Collector of interesting rocks.',
    viewer: {
      following: followUri(VIEWER_DID, 'danielle'),
      followedBy: followUri('did:plc:danielleyuhan', 'tim'),
    },
  })
  const michael = profile({
    did: 'did:plc:michaelblack',
    handle: 'michaelblack.bsky.social',
    displayName: 'Michael Black',
    description: 'Amateur mycologist and professional coffee drinker',
  })
  const darrin = profile({
    did: 'did:plc:darrin',
    handle: 'darrin.bsky.social',
    displayName: 'Darrin Loeliger',
    viewer: {following: followUri(VIEWER_DID, 'darrin')},
  })
  const rafael = profile({
    did: 'did:plc:rafael',
    handle: 'rafael.my',
    displayName: 'rafael',
    viewer: {
      following: followUri(VIEWER_DID, 'rafael'),
      followedBy: followUri('did:plc:rafael', 'tim'),
    },
  })
  const samuel = profile({
    did: 'did:plc:samuel',
    handle: 'samuel.fm',
    displayName: 'samuel',
    viewer: {
      following: followUri(VIEWER_DID, 'samuel'),
      followedBy: followUri('did:plc:samuel', 'tim'),
    },
  })
  const aiko = profile({
    did: 'did:plc:aiko',
    handle: 'aiko.bsky.social',
    displayName: 'Aiko Tanaka',
  })
  const marcus = profile({
    did: 'did:plc:marcus',
    handle: 'marcuswebb.com',
    displayName: 'Marcus Webb',
    description: 'Writing about science, nature, and the spaces in between.',
  })
  const priya = profile({
    did: 'did:plc:priya',
    handle: 'priya.bsky.social',
    displayName: 'Priya Raman',
    viewer: {following: followUri(VIEWER_DID, 'priya')},
  })
  const bluesky = profile({
    did: 'did:plc:bluesky',
    handle: 'bsky.app',
    displayName: 'Bluesky',
    viewer: {following: followUri(VIEWER_DID, 'bluesky')},
  })
  const knownFollowers = {
    count: 23,
    followers: [basic(danielle), basic(rafael), basic(samuel)],
  }
  const sofia = profile({
    did: 'did:plc:sofia',
    handle: 'sofia.bsky.social',
    displayName: 'Sofia Alvarez',
    description: 'Science communicator 🔬 she/her',
    viewer: {followedBy: followUri('did:plc:sofia', 'tim'), knownFollowers},
  })
  const jonas = profile({
    did: 'did:plc:jonas',
    handle: 'jonasberg.bsky.social',
    displayName: 'Jonas Berg',
    viewer: {knownFollowers},
  })
  const lena = profile({
    did: 'did:plc:lena',
    handle: 'lena.bsky.social',
    displayName: 'Lena Okafor',
  })
  const noah = profile({
    did: 'did:plc:noah',
    handle: 'noahkim.bsky.social',
    displayName: 'Noah Kim',
    viewer: {
      following: followUri(VIEWER_DID, 'noah'),
      followedBy: followUri('did:plc:noah', 'tim'),
    },
  })
  const hana = profile({
    did: 'did:plc:hana',
    handle: 'hanasato.bsky.social',
    displayName: 'Hana Sato',
    viewer: {followedBy: followUri('did:plc:hana', 'tim'), knownFollowers},
  })
  const theo = profile({
    did: 'did:plc:theo',
    handle: 'theo.bsky.social',
    displayName: 'Theo Grant',
    viewer: {followedBy: followUri('did:plc:theo', 'tim')},
  })
  const ines = profile({
    did: 'did:plc:ines',
    handle: 'ines.bsky.social',
    displayName: 'Inês Costa',
    viewer: {followedBy: followUri('did:plc:ines', 'tim')},
  })
  const omar = profile({
    did: 'did:plc:omar',
    handle: 'omar.bsky.social',
    displayName: 'Omar Haddad',
    viewer: {followedBy: followUri('did:plc:omar', 'tim'), knownFollowers},
  })
  const wren = profile({
    did: 'did:plc:wren',
    handle: 'wren.bsky.social',
    displayName: 'Wren',
    viewer: {followedBy: followUri('did:plc:wren', 'tim')},
  })
  const maya = profile({
    did: 'did:plc:maya',
    handle: 'maya.bsky.social',
    displayName: 'Maya Lindqvist',
    viewer: {followedBy: followUri('did:plc:maya', 'tim')},
  })

  /*
   * Your posts
   */

  const fungusPost = post({
    author: tim,
    rkey: 'fungus',
    text: 'The largest known organism on Earth by area is a fungus (a honey mushroom in Oregon)',
    indexedAt: ago(3 * HOUR + 20 * MINUTE),
    embed: imagesView([
      {
        alt: 'A cluster of honey mushrooms growing at the base of a tree',
        name: 'honey-mushrooms',
        width: 4,
        height: 3,
      },
    ]),
    likeCount: 25,
    repostCount: 4,
    replyCount: 3,
    quoteCount: 1,
  })
  const plantsPost = post({
    author: tim,
    rkey: 'plants',
    text: 'Spent the whole weekend repotting every plant in the apartment 🌿',
    indexedAt: ago(5 * DAY),
    likeCount: 1,
  })
  const photosPost = post({
    author: tim,
    rkey: 'photos',
    text: '',
    indexedAt: ago(12 * HOUR),
    embed: imagesView([
      {
        alt: 'Fog rolling over a forest ridge',
        name: 'fog',
        width: 3,
        height: 4,
      },
      {alt: 'Moss on a granite boulder', name: 'moss', width: 3, height: 4},
    ]),
    likeCount: 9,
  })
  const animalsPost = post({
    author: tim,
    rkey: 'animals',
    text: 'Reminder that mushrooms are more closely related to animals than they are to plants',
    indexedAt: ago(1 * DAY),
    likeCount: 14,
    repostCount: 2,
  })

  /*
   * Other people's posts
   */

  const viaRepost: AtUriString = `at://${VIEWER_DID}/app.bsky.feed.repost/bronco`
  const broncoPost = post({
    author: darrin,
    rkey: 'bronco',
    text: 'Finally finished restoring this 1972 Bronco. Two years, one very patient partner 🚙',
    indexedAt: ago(8 * HOUR),
    likeCount: 212,
    repostCount: 31,
    viewer: {repost: viaRepost},
  })
  const danielleReply = post({
    author: danielle,
    rkey: 'reply-fungus',
    text: 'Wow, I didn’t know that!',
    indexedAt: ago(12 * MINUTE),
    reply: {root: fungusPost, parent: fungusPost},
  })
  const priyaPost = post({
    author: priya,
    rkey: 'oyster',
    text: 'Has anyone here tried growing oyster mushrooms at home? Looking for tips before I start',
    indexedAt: ago(1 * DAY + 4 * HOUR),
    replyCount: 6,
  })
  const michaelReply = post({
    author: michael,
    rkey: 'reply-oyster',
    text: 'Yes! Used coffee grounds as a substrate and it worked surprisingly well',
    indexedAt: ago(1 * DAY + 2 * HOUR),
    reply: {root: priyaPost, parent: priyaPost},
  })
  const lenaMention = post({
    author: lena,
    rkey: 'mention-oyster',
    text: '@tim.bsky.team you’d know the answer to this one',
    indexedAt: ago(1 * DAY + 5 * HOUR),
    reply: {root: priyaPost, parent: priyaPost},
    mention: {did: VIEWER_DID, byteStart: 0, byteEnd: 14},
  })
  const blockedPost: $Typed<BlockedPost> = {
    $type: 'app.bsky.feed.defs#blockedPost',
    uri: 'at://did:plc:blockeduser/app.bsky.feed.post/blocked',
    blocked: true,
    author: {did: 'did:plc:blockeduser', viewer: {blocking: blockUri()}},
  }
  const notFoundPost: $Typed<NotFoundPost> = {
    $type: 'app.bsky.feed.defs#notFoundPost',
    uri: 'at://did:plc:deleted/app.bsky.feed.post/deleted',
    notFound: true,
  }
  const aikoReply = post({
    author: aiko,
    rkey: 'reply-blocked',
    text: 'Strongly agree with all of this',
    indexedAt: ago(1 * DAY + 8 * HOUR),
    reply: {root: blockedPost, parent: blockedPost},
  })
  const jonasReply = post({
    author: jonas,
    rkey: 'reply-deleted',
    text: 'Did they delete this? I was halfway through typing a reply 😅',
    indexedAt: ago(2 * DAY),
    reply: {root: notFoundPost, parent: notFoundPost},
  })
  const marcusQuote = post({
    author: marcus,
    rkey: 'quote-fungus',
    text: 'Nature is metal 🍄',
    indexedAt: ago(2 * HOUR),
    quote: fungusPost,
    likeCount: 48,
    repostCount: 6,
  })
  const samuelMention = post({
    author: samuel,
    rkey: 'mention-demo',
    text: 'Thanks for the demo, @tim.bsky.team 🙏 Super excited to see what’s next!',
    indexedAt: ago(32 * MINUTE),
    /*
     * Byte offsets into the UTF-8 encoded text. Everything before the mention
     * is ASCII, so they match the character offsets.
     */
    mention: {did: VIEWER_DID, byteStart: 21, byteEnd: 35},
    likeCount: 5,
  })

  /*
   * Posts from accounts you subscribe to
   */

  const samuelBlog = post({
    author: samuel,
    rkey: 'blog',
    text: 'New blog post: what we learned rebuilding notifications from the ground up',
    indexedAt: ago(14 * HOUR),
    likeCount: 37,
  })
  const danielleHike = post({
    author: danielle,
    rkey: 'hike-1',
    text: 'Sunrise hike before work 🌄',
    indexedAt: ago(16 * HOUR),
  })
  const danielleTrailMix = post({
    author: danielle,
    rkey: 'hike-2',
    text: 'Definitive trail mix ranking, a thread 🧵',
    indexedAt: ago(16 * HOUR + 10 * MINUTE),
  })
  const danielleSummit = post({
    author: danielle,
    rkey: 'hike-3',
    text: 'Okay one more photo from the summit',
    indexedAt: ago(16 * HOUR + 25 * MINUTE),
    embed: imagesView([
      {
        alt: 'View from a summit over a valley of evergreens',
        name: 'summit',
        width: 16,
        height: 9,
      },
    ]),
  })
  const michaelSubscribed = post({
    author: michael,
    rkey: 'chanterelles',
    text: 'Found chanterelles on the morning walk, dinner is sorted',
    indexedAt: ago(20 * HOUR),
  })
  const rafaelSubscribed = post({
    author: rafael,
    rkey: 'release',
    text: 'Shipped a small release today. Mostly bug fixes, one very satisfying refactor',
    indexedAt: ago(20 * HOUR + 15 * MINUTE),
  })
  const darrinSubscribed = post({
    author: darrin,
    rkey: 'garage',
    text: 'Next project is already in the garage. Don’t tell anyone',
    indexedAt: ago(20 * HOUR + 40 * MINUTE),
  })

  /*
   * Feeds and starter packs
   */

  const fungiFeed: $Typed<GeneratorView> = {
    $type: 'app.bsky.feed.defs#generatorView',
    uri: `at://${VIEWER_DID}/app.bsky.feed.generator/fungi`,
    cid: cid('fungi-feed'),
    did: 'did:web:feeds.example.com',
    creator: basic(tim),
    displayName: 'Fungi Facts',
    description:
      'Posts about mushrooms, molds, lichens, and everything mycelial',
    likeCount: 128,
    indexedAt: ago(90 * DAY),
  }
  const mycologyPack = starterPack({
    creator: tim,
    rkey: 'mycology',
    name: 'Mycology Nerds',
    description: 'People who will happily talk about mushrooms for hours',
    indexedAt: ago(60 * DAY),
    joinedWeekCount: 4,
    joinedAllTimeCount: 37,
  })
  const scicommPack = starterPack({
    creator: priya,
    rkey: 'scicomm',
    name: 'Science Communicators',
    description: 'Scientists and writers making research accessible',
    indexedAt: ago(120 * DAY),
    joinedWeekCount: 52,
    joinedAllTimeCount: 1840,
  })

  /*
   * Groups, newest first
   */

  const groups: Group[] = [
    {
      id: 'like-fungus',
      isRead: false,
      indexedAt: ago(7 * MINUTE),
      count: 25,
      kind: {
        $type: `${$group}#likeGroup`,
        post: fungusPost.uri,
        items: [
          danielle,
          michael,
          darrin,
          rafael,
          samuel,
          aiko,
          marcus,
          priya,
          sofia,
          jonas,
        ].map(p => ({actor: p.did})),
      },
    },
    {
      id: 'reply-fungus',
      isRead: false,
      indexedAt: ago(12 * MINUTE),
      count: 1,
      kind: {
        $type: `${$group}#replyNotification`,
        post: danielleReply.uri,
        parent: fungusPost.uri,
      },
    },
    {
      id: 'mention-demo',
      isRead: false,
      indexedAt: ago(32 * MINUTE),
      count: 1,
      kind: {
        $type: `${$group}#mentionNotification`,
        post: samuelMention.uri,
      },
    },
    {
      id: 'unknown-kind',
      isRead: false,
      indexedAt: ago(40 * MINUTE),
      count: 1,
      kind: {
        $type: `${$group}#someFutureGroup` as Unknown$Type,
      },
    },
    {
      id: 'follow-many',
      isRead: true,
      indexedAt: ago(1 * HOUR),
      count: 5,
      kind: {
        $type: `${$group}#followGroup`,
        items: [hana, theo, ines, omar, wren].map(p => ({actor: p.did})),
      },
    },
    {
      id: 'quote-fungus',
      isRead: true,
      indexedAt: ago(2 * HOUR),
      count: 1,
      kind: {
        $type: `${$group}#quoteNotification`,
        post: marcusQuote.uri,
      },
    },
    {
      id: 'repost-fungus',
      isRead: true,
      indexedAt: ago(3 * HOUR),
      count: 4,
      kind: {
        $type: `${$group}#repostGroup`,
        post: fungusPost.uri,
        items: [marcus, priya, michael, aiko].map(p => ({actor: p.did})),
      },
    },
    {
      id: 'like-via-repost-bronco',
      isRead: true,
      indexedAt: ago(3 * HOUR + 30 * MINUTE),
      count: 3,
      kind: {
        $type: `${$group}#likeViaRepostGroup`,
        post: broncoPost.uri,
        viaRepost,
        items: [rafael, samuel, noah].map(p => ({actor: p.did})),
      },
    },
    {
      id: 'like-blocked-post',
      isRead: true,
      indexedAt: ago(4 * HOUR),
      count: 2,
      kind: {
        $type: `${$group}#likeGroup`,
        post: blockedPost.uri,
        items: [{actor: michael.did}, {actor: aiko.did}],
      },
    },
    {
      id: 'repost-via-repost-bronco',
      isRead: true,
      indexedAt: ago(5 * HOUR),
      count: 2,
      kind: {
        $type: `${$group}#repostViaRepostGroup`,
        post: broncoPost.uri,
        viaRepost,
        items: [{actor: danielle.did}, {actor: lena.did}],
      },
    },
    {
      id: 'multi-post-like-rafael',
      isRead: true,
      indexedAt: ago(9 * HOUR),
      count: 3,
      kind: {
        $type: `${$group}#multiPostLikeGroup`,
        actor: rafael.did,
        items: [
          {post: animalsPost.uri},
          {post: photosPost.uri},
          {post: plantsPost.uri},
        ],
      },
    },
    {
      id: 'subscribed-samuel',
      isRead: true,
      indexedAt: ago(14 * HOUR),
      count: 1,
      kind: {
        $type: `${$group}#subscribedPostGroup`,
        items: [{actor: samuel.did, post: samuelBlog.uri}],
      },
    },
    {
      id: 'subscribed-danielle',
      isRead: true,
      indexedAt: ago(16 * HOUR),
      count: 3,
      kind: {
        $type: `${$group}#subscribedPostGroup`,
        items: [danielleHike, danielleTrailMix, danielleSummit].map(p => ({
          actor: danielle.did,
          post: p.uri,
        })),
      },
    },
    {
      id: 'subscribed-many',
      isRead: true,
      indexedAt: ago(20 * HOUR),
      count: 3,
      kind: {
        $type: `${$group}#subscribedPostGroup`,
        items: [michaelSubscribed, rafaelSubscribed, darrinSubscribed].map(
          p => ({actor: p.author.did, post: p.uri}),
        ),
      },
    },
    {
      id: 'generator-like-fungi',
      isRead: true,
      indexedAt: ago(1 * DAY),
      count: 3,
      kind: {
        $type: `${$group}#generatorLikeGroup`,
        generator: fungiFeed.uri,
        items: [aiko, priya, noah].map(p => ({actor: p.did})),
      },
    },
    {
      id: 'reply-oyster',
      isRead: true,
      indexedAt: ago(1 * DAY + 2 * HOUR),
      count: 1,
      kind: {
        $type: `${$group}#replyNotification`,
        post: michaelReply.uri,
        parent: priyaPost.uri,
      },
    },
    {
      id: 'mention-oyster',
      isRead: true,
      indexedAt: ago(1 * DAY + 5 * HOUR),
      count: 1,
      kind: {
        $type: `${$group}#mentionNotification`,
        post: lenaMention.uri,
        parent: priyaPost.uri,
      },
    },
    {
      id: 'reply-blocked-parent',
      isRead: true,
      indexedAt: ago(1 * DAY + 8 * HOUR),
      count: 1,
      kind: {
        $type: `${$group}#replyNotification`,
        post: aikoReply.uri,
        parent: blockedPost.uri,
      },
    },
    {
      id: 'reply-not-found-parent',
      isRead: true,
      indexedAt: ago(2 * DAY),
      count: 1,
      kind: {
        $type: `${$group}#replyNotification`,
        post: jonasReply.uri,
        parent: notFoundPost.uri,
      },
    },
    {
      id: 'like-unresolvable-actors',
      isRead: true,
      indexedAt: ago(2 * DAY + 1 * HOUR),
      count: 2,
      kind: {
        $type: `${$group}#likeGroup`,
        post: plantsPost.uri,
        items: [{actor: 'did:plc:ghost1'}, {actor: 'did:plc:ghost2'}],
      },
    },
    {
      id: 'follow-starter-pack',
      isRead: true,
      indexedAt: ago(2 * DAY + 3 * HOUR),
      count: 1,
      kind: {
        $type: `${$group}#followGroup`,
        items: [{actor: sofia.did, starterPack: scicommPack.uri}],
      },
    },
    {
      id: 'follow-single',
      isRead: true,
      indexedAt: ago(2 * DAY + 6 * HOUR),
      count: 1,
      kind: {
        $type: `${$group}#followGroup`,
        items: [{actor: maya.did}],
      },
    },
    {
      id: 'follow-back',
      isRead: true,
      indexedAt: ago(3 * DAY),
      count: 1,
      kind: {
        $type: `${$group}#followBackNotification`,
        actor: priya.did,
      },
    },
    {
      id: 'follow-back-starter-pack',
      isRead: true,
      indexedAt: ago(3 * DAY + 6 * HOUR),
      count: 1,
      kind: {
        $type: `${$group}#followBackNotification`,
        actor: noah.did,
        starterPack: scicommPack.uri,
      },
    },
    {
      id: 'like-plants',
      isRead: true,
      indexedAt: ago(4 * DAY),
      count: 1,
      kind: {
        $type: `${$group}#likeGroup`,
        post: plantsPost.uri,
        items: [{actor: michael.did}],
      },
    },
    {
      id: 'verified',
      isRead: true,
      indexedAt: ago(5 * DAY),
      count: 1,
      kind: {
        $type: `${$group}#verifiedNotification`,
        actor: bluesky.did,
      },
    },
    {
      id: 'unverified',
      isRead: true,
      indexedAt: ago(6 * DAY),
      count: 1,
      kind: {
        $type: `${$group}#unverifiedNotification`,
        actor: bluesky.did,
      },
    },
    {
      id: 'starter-pack-joined',
      isRead: true,
      indexedAt: ago(7 * DAY),
      count: 1,
      kind: {
        $type: `${$group}#starterPackJoinedNotification`,
        actor: lena.did,
        starterPack: mycologyPack.uri,
      },
    },
    {
      id: 'contact-match',
      isRead: true,
      indexedAt: ago(14 * DAY),
      count: 1,
      kind: {
        $type: `${$group}#contactMatchNotification`,
        actor: jonas.did,
      },
    },
  ]

  return {
    cursor: 'fixture-cursor',
    seenAt: ago(45 * MINUTE),
    groups,
    relatedViews: [
      danielle,
      michael,
      darrin,
      rafael,
      samuel,
      aiko,
      marcus,
      priya,
      sofia,
      jonas,
      lena,
      noah,
      hana,
      theo,
      ines,
      omar,
      wren,
      maya,
      bluesky,
      fungusPost,
      plantsPost,
      photosPost,
      animalsPost,
      broncoPost,
      danielleReply,
      priyaPost,
      michaelReply,
      lenaMention,
      aikoReply,
      jonasReply,
      marcusQuote,
      samuelMention,
      samuelBlog,
      danielleHike,
      danielleTrailMix,
      danielleSummit,
      michaelSubscribed,
      rafaelSubscribed,
      darrinSubscribed,
      blockedPost,
      notFoundPost,
      fungiFeed,
      mycologyPack,
      scicommPack,
    ],
  }
}

/*
 * Builders
 */

function profile({
  did,
  handle,
  displayName,
  description,
  viewer = {},
}: {
  did: DidString
  handle: HandleString
  displayName: string
  description?: string
  viewer?: ProfileViewDetailed['viewer']
}): $Typed<ProfileViewDetailed> {
  return {
    $type: 'app.bsky.actor.defs#profileViewDetailed',
    did,
    handle,
    displayName,
    description,
    avatar: undefined,
    labels: [],
    viewer,
    followersCount: 412,
    followsCount: 287,
    postsCount: 1093,
    createdAt: '2023-05-02T17:24:11.000Z',
    indexedAt: '2023-05-02T17:24:11.000Z',
  }
}

/**
 * The basic view embedded in posts and packs. Left untyped so it also
 * satisfies `ProfileView`, which a generator's `creator` requires.
 */
function basic(profile: ProfileViewDetailed) {
  return {
    did: profile.did,
    handle: profile.handle,
    displayName: profile.displayName,
    avatar: profile.avatar,
    labels: [],
    viewer: profile.viewer,
  }
}

function post({
  author,
  rkey,
  text,
  indexedAt,
  embed,
  quote,
  reply,
  mention,
  viewer = {},
  likeCount = 0,
  repostCount = 0,
  replyCount = 0,
  quoteCount = 0,
}: {
  author: ProfileViewDetailed
  rkey: string
  text: string
  indexedAt: DatetimeString
  embed?: $Typed<app.bsky.embed.images.View>
  /**
   * A post to embed as a quote, which sets both the record embed and the
   * hydrated embed view.
   */
  quote?: PostView
  /**
   * The root and parent of a reply. Only their `uri` is read, so a blocked or
   * not-found view works too.
   */
  reply?: {root: {uri: AtUriString}; parent: {uri: AtUriString}}
  mention?: {did: DidString; byteStart: number; byteEnd: number}
  viewer?: PostView['viewer']
  likeCount?: number
  repostCount?: number
  replyCount?: number
  quoteCount?: number
}): $Typed<PostView> {
  return {
    $type: 'app.bsky.feed.defs#postView',
    uri: `at://${author.did}/app.bsky.feed.post/${rkey}`,
    cid: cid(rkey),
    author: basic(author),
    /*
     * Image embeds are left out of the record, since their blob refs need
     * real CIDs and nothing reads them. Rendering uses the embed view.
     */
    record: {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: indexedAt,
      langs: ['en'],
      ...(reply && {
        reply: {
          root: {uri: reply.root.uri, cid: cid(`${rkey}-root`)},
          parent: {uri: reply.parent.uri, cid: cid(`${rkey}-parent`)},
        },
      }),
      ...(mention && {
        facets: [
          {
            index: {byteStart: mention.byteStart, byteEnd: mention.byteEnd},
            features: [
              {$type: 'app.bsky.richtext.facet#mention', did: mention.did},
            ],
          },
        ],
      }),
      ...(quote && {
        embed: {
          $type: 'app.bsky.embed.record',
          record: {uri: quote.uri, cid: quote.cid},
        },
      }),
    },
    embed: quote ? quoteView(quote) : embed,
    indexedAt,
    viewer,
    labels: [],
    likeCount,
    repostCount,
    replyCount,
    quoteCount,
    bookmarkCount: 0,
  }
}

function imagesView(
  images: {alt: string; name: string; width: number; height: number}[],
): $Typed<app.bsky.embed.images.View> {
  return {
    $type: 'app.bsky.embed.images#view',
    images: images.map(({alt, name, width, height}) => ({
      alt,
      thumb: `https://example.com/fixtures/${name}-thumb.jpg`,
      fullsize: `https://example.com/fixtures/${name}.jpg`,
      aspectRatio: {width, height},
    })),
  }
}

function quoteView(quoted: PostView): $Typed<app.bsky.embed.record.View> {
  return {
    $type: 'app.bsky.embed.record#view',
    record: {
      $type: 'app.bsky.embed.record#viewRecord',
      uri: quoted.uri,
      cid: quoted.cid,
      author: quoted.author,
      value: quoted.record,
      embeds: quoted.embed ? [quoted.embed] : [],
      labels: [],
      indexedAt: quoted.indexedAt,
      likeCount: quoted.likeCount,
      repostCount: quoted.repostCount,
      replyCount: quoted.replyCount,
      quoteCount: quoted.quoteCount,
    },
  }
}

function starterPack({
  creator,
  rkey,
  name,
  description,
  indexedAt,
  joinedWeekCount,
  joinedAllTimeCount,
}: {
  creator: ProfileViewDetailed
  rkey: string
  name: string
  description: string
  indexedAt: DatetimeString
  joinedWeekCount: number
  joinedAllTimeCount: number
}): $Typed<StarterPackView> {
  return {
    $type: 'app.bsky.graph.defs#starterPackView',
    uri: `at://${creator.did}/app.bsky.graph.starterpack/${rkey}`,
    cid: cid(`pack-${rkey}`),
    creator: basic(creator),
    record: {
      $type: 'app.bsky.graph.starterpack',
      name,
      description,
      list: `at://${creator.did}/app.bsky.graph.list/${rkey}`,
      createdAt: indexedAt,
    },
    labels: [],
    indexedAt,
    joinedWeekCount,
    joinedAllTimeCount,
  }
}

function followUri(from: DidString, rkey: string): AtUriString {
  return `at://${from}/app.bsky.graph.follow/${rkey}`
}

function blockUri(): AtUriString {
  return `at://${VIEWER_DID}/app.bsky.graph.block/blockeduser`
}

/**
 * A stable, obviously fake CID. Nothing in the client verifies these.
 */
function cid(seed: string): string {
  return `bafyreifixture${seed.replace(/[^a-z0-9]/g, '')}`
}
