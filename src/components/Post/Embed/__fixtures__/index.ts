/*
 * Fixture data for post embeds, for the Embeds and Notifications sections of
 * the Storybook. Not for use in app code.
 */

import {Asset} from 'expo-asset'
import {type $Typed} from '@atproto/lex'
import {
  type AtUriString,
  type DatetimeString,
  type DidString,
  type HandleString,
  toDatetimeString,
} from '@atproto/syntax'

import {type app} from '#/lexicons'

type PostView = app.bsky.feed.defs.PostView
type ProfileViewBasic = app.bsky.actor.defs.ProfileViewBasic
type RecordView = $Typed<app.bsky.embed.record.View>
type Media = app.bsky.embed.recordWithMedia.View['media']

/**
 * Bluesky's moderation service, which every viewer subscribes to. Labels
 * like `!warn` can't be self-applied, so they come from here.
 */
const MODERATION_DID: DidString = 'did:plc:ar7c4by46qjdydhdevvrndac'

/** Asset URLs are always absolute, which the lexicon type can't know */
function asUri(value: string) {
  return value as `${string}:${string}`
}

/*
 * `Image.resolveAssetSource` doesn't exist on web, so resolve through
 * expo-asset.
 */
const IMAGES = {
  kawaii: {
    uri: asUri(
      Asset.fromModule(require('../../../../../assets/kawaii.png')).uri,
    ),
    width: 1920,
    height: 1080,
    alt: 'Anime-style illustration of a smiling butterfly',
  },
  welcome: {
    uri: asUri(
      Asset.fromModule(
        require('../../../../../assets/images/welcome-modal-bg.jpg'),
      ).uri,
    ),
    width: 1432,
    height: 1025,
    alt: 'Soft blue clouds',
  },
  friends: {
    uri: asUri(
      Asset.fromModule(
        require('../../../../../assets/images/find_friends_illustration.webp'),
      ).uri,
    ),
    width: 1278,
    height: 661,
    alt: 'Illustration of friends waving',
  },
  invite: {
    uri: asUri(
      Asset.fromModule(
        require('../../../../../assets/images/chat-invite-friends.webp'),
      ).uri,
    ),
    width: 706,
    height: 418,
    alt: 'Illustration of chat bubbles',
  },
  poster: {
    uri: asUri(
      Asset.fromModule(
        require('../../../../../assets/images/ipad_beta_nux_poster.webp'),
      ).uri,
    ),
    width: 1572,
    height: 904,
    alt: 'Bluesky running on an iPad',
  },
}

const now = Date.now()
function ago(minutes: number): DatetimeString {
  return toDatetimeString(new Date(now - minutes * 60_000))
}

/**
 * A profile without its `$type`, so it also satisfies `ProfileView`, which a
 * feed's `creator` requires.
 */
function profile(did: DidString, handle: HandleString, displayName: string) {
  return {did, handle, displayName, labels: [], viewer: {}}
}

export const AUTHORS = {
  ines: profile('did:plc:ines', 'ines.example.com', 'Inés Ferreira'),
  marcus: profile('did:plc:marcus', 'marcus.example.com', 'Marcus Webb'),
  priya: profile('did:plc:priya', 'priya.example.com', 'Priya Raman'),
}

/**
 * A stable, obviously fake CID. Nothing in the client verifies these.
 */
function cid(seed: string) {
  return `bafyreifixture${seed.replace(/[^a-z0-9]/g, '')}`
}

/*
 * Media
 */

export function imagesView(
  images: (typeof IMAGES)[keyof typeof IMAGES][],
): $Typed<app.bsky.embed.images.View> {
  return {
    $type: 'app.bsky.embed.images#view',
    images: images.map(image => ({
      thumb: image.uri,
      fullsize: image.uri,
      alt: image.alt,
      aspectRatio: {width: image.width, height: image.height},
    })),
  }
}

export const MEDIA = {
  oneImage: imagesView([IMAGES.kawaii]),
  twoImages: imagesView([IMAGES.kawaii, IMAGES.welcome]),
  threeImages: imagesView([IMAGES.kawaii, IMAGES.welcome, IMAGES.friends]),
  fourImages: imagesView([
    IMAGES.kawaii,
    IMAGES.welcome,
    IMAGES.friends,
    IMAGES.invite,
  ]),
  video: videoView({thumbnail: IMAGES.poster.uri}),
  videoWithoutThumbnail: videoView({}),
  videoGif: videoView({thumbnail: IMAGES.kawaii.uri, presentation: 'gif'}),
  tenorGif: externalView({
    uri: 'https://media.tenor.com/AbcdAAAAC/happy-dance.gif?hh=220&ww=220',
    title: '',
    description: 'Alt: A cartoon cat dancing happily',
    thumb: IMAGES.kawaii.uri,
  }),
  link: externalView({
    uri: 'https://www.example.com/articles/the-largest-organism-on-earth',
    title: 'The largest organism on Earth is a fungus in Oregon',
    description:
      'A honey mushroom in the Blue Mountains covers nearly four square miles, and it may be thousands of years old.',
    thumb: IMAGES.welcome.uri,
  }),
  linkWithoutThumbnail: externalView({
    uri: 'https://docs.example.org/guides/getting-started',
    title: 'Getting started',
    description: 'Everything you need to set up your first project.',
  }),
  linkWithLongTitle: externalView({
    uri: 'https://news.example.net/2026/10/30/a-very-long-path',
    title:
      'Scientists discover that the humble mushroom may be the key to an entirely new class of sustainable building materials',
    description: '',
    thumb: IMAGES.friends.uri,
  }),
  linkWithoutTitle: externalView({
    uri: 'https://example.com/no-title-here',
    title: '',
    description: '',
  }),
}

function videoView({
  thumbnail,
  presentation,
}: {
  thumbnail?: `${string}:${string}`
  presentation?: 'default' | 'gif'
}): $Typed<app.bsky.embed.video.View> {
  return {
    $type: 'app.bsky.embed.video#view',
    cid: cid(`video${presentation ?? ''}${thumbnail ? 'thumb' : ''}`),
    // Never loaded: compact presentations only show the thumbnail
    playlist: 'https://video.example.com/fixture/playlist.m3u8',
    thumbnail,
    alt: 'A short clip of Bluesky on an iPad',
    aspectRatio: {width: 16, height: 9},
    presentation,
  }
}

function externalView(
  external: app.bsky.embed.external.ViewExternal,
): $Typed<app.bsky.embed.external.View> {
  return {$type: 'app.bsky.embed.external#view', external}
}

/*
 * Quoted posts
 */

function quoteOf({
  author = AUTHORS.priya,
  rkey,
  text,
  embed,
  labels = [],
  minutesAgo = 90,
}: {
  author?: ProfileViewBasic
  rkey: string
  text: string
  embed?: NonNullable<app.bsky.embed.record.ViewRecord['embeds']>[number]
  /**
   * Label values on the quoted post. `!warn` comes from the moderation
   * service, and anything else is self-applied.
   */
  labels?: string[]
  minutesAgo?: number
}): RecordView {
  const uri: AtUriString = `at://${author.did}/app.bsky.feed.post/${rkey}`
  return {
    $type: 'app.bsky.embed.record#view',
    record: {
      $type: 'app.bsky.embed.record#viewRecord',
      uri,
      cid: cid(rkey),
      author,
      value: {
        $type: 'app.bsky.feed.post',
        text,
        createdAt: ago(minutesAgo),
      },
      embeds: embed ? [embed] : [],
      labels: labels.map(val => ({
        src: val.startsWith('!') ? MODERATION_DID : author.did,
        uri,
        val,
        cts: ago(minutesAgo),
      })),
      indexedAt: ago(minutesAgo),
      likeCount: 12,
      repostCount: 2,
      replyCount: 3,
      quoteCount: 1,
    },
  }
}

function recordWithMedia(
  media: Media,
  record: RecordView,
): $Typed<app.bsky.embed.recordWithMedia.View> {
  return {$type: 'app.bsky.embed.recordWithMedia#view', media, record}
}

const FUNGUS_TEXT =
  'The largest known organism on Earth by area is a fungus (a honey mushroom in Oregon)'
const LONG_TEXT =
  'Spent the whole weekend repotting every plant in the apartment. The monstera finally got a pot big enough for its roots, the pothos got split into three, and I learned that the fiddle leaf fig does not, in fact, enjoy being moved. Next weekend: shelves.'

const nestedQuote = quoteOf({
  author: AUTHORS.marcus,
  rkey: 'nested',
  text: 'A quote inside the quote, which is dropped as it is in feeds',
})

const feed: $Typed<app.bsky.feed.defs.GeneratorView> = {
  $type: 'app.bsky.feed.defs#generatorView',
  uri: `at://${AUTHORS.ines.did}/app.bsky.feed.generator/fungi`,
  cid: cid('fungi-feed'),
  did: 'did:web:feeds.example.com',
  creator: AUTHORS.ines,
  displayName: 'Fungi Facts',
  description: 'Posts about mushrooms, molds, lichens, and everything mycelial',
  likeCount: 128,
  indexedAt: ago(90 * 24 * 60),
}

/**
 * Quoted posts covering everything a compact quote lays out differently,
 * each as the record embed of the post that quotes it.
 */
export const QUOTES: {title: string; embed: RecordView}[] = [
  {
    title: 'Text only',
    embed: quoteOf({rkey: 'text', text: FUNGUS_TEXT}),
  },
  {
    title: 'Long text, cut short',
    embed: quoteOf({rkey: 'long', text: LONG_TEXT, embed: MEDIA.oneImage}),
  },
  {
    title: 'Text and one image',
    embed: quoteOf({rkey: 'one', text: FUNGUS_TEXT, embed: MEDIA.oneImage}),
  },
  {
    title: 'Text and two images',
    embed: quoteOf({
      rkey: 'two',
      text: 'Before and after',
      embed: MEDIA.twoImages,
    }),
  },
  {
    title: 'Text and three images',
    embed: quoteOf({
      rkey: 'three',
      text: 'Three of my favourites from the trip',
      embed: MEDIA.threeImages,
    }),
  },
  {
    title: 'Text and four images',
    embed: quoteOf({
      rkey: 'four',
      text: 'Photo dump from the weekend',
      embed: MEDIA.fourImages,
    }),
  },
  {
    title: 'Images without text',
    embed: quoteOf({rkey: 'notext', text: '', embed: MEDIA.twoImages}),
  },
  {
    title: 'Video',
    embed: quoteOf({
      rkey: 'video',
      text: 'Bluesky on iPad is here!',
      embed: MEDIA.video,
    }),
  },
  {
    title: 'Video without a thumbnail',
    embed: quoteOf({
      rkey: 'videonothumb',
      text: 'Still processing, apparently',
      embed: MEDIA.videoWithoutThumbnail,
    }),
  },
  {
    title: 'GIF (video)',
    embed: quoteOf({
      rkey: 'videogif',
      text: 'Me right now',
      embed: MEDIA.videoGif,
    }),
  },
  {
    title: 'GIF (Tenor link)',
    embed: quoteOf({rkey: 'tenor', text: 'Friday mood', embed: MEDIA.tenorGif}),
  },
  {
    title: 'Link',
    embed: quoteOf({
      rkey: 'link',
      text: 'This is wild',
      embed: MEDIA.link,
    }),
  },
  {
    title: 'Link without a thumbnail',
    embed: quoteOf({
      rkey: 'linknothumb',
      text: 'Good guide if you’re just starting out',
      embed: MEDIA.linkWithoutThumbnail,
    }),
  },
  {
    title: 'Link without text',
    embed: quoteOf({rkey: 'linknotext', text: '', embed: MEDIA.link}),
  },
  {
    title: 'Images and a quote of its own',
    embed: quoteOf({
      rkey: 'rwm',
      text: 'Adding some photos to this',
      embed: recordWithMedia(MEDIA.oneImage, nestedQuote),
    }),
  },
  {
    title: 'Link and a quote of its own',
    embed: quoteOf({
      rkey: 'rwmlink',
      text: 'Related reading',
      embed: recordWithMedia(MEDIA.link, nestedQuote),
    }),
  },
  {
    title: 'A shared feed',
    embed: quoteOf({
      rkey: 'feed',
      text: 'There’s a feed for exactly that',
      embed: {$type: 'app.bsky.embed.record#view', record: feed},
    }),
  },
  {
    title: 'Media warning (graphic media, self-labelled)',
    embed: quoteOf({
      rkey: 'graphic',
      text: 'Content warning: the aftermath of the storm',
      embed: MEDIA.twoImages,
      labels: ['graphic-media'],
    }),
  },
  {
    title: 'Video behind a media warning',
    embed: quoteOf({
      rkey: 'graphicvideo',
      text: 'Not for the squeamish',
      embed: MEDIA.video,
      labels: ['graphic-media'],
    }),
  },
  {
    title: 'Content warning on the whole post (!warn)',
    embed: quoteOf({
      rkey: 'warn',
      text: 'Hidden until you choose to show it',
      embed: MEDIA.oneImage,
      labels: ['!warn'],
    }),
  },
]

/**
 * Record embeds that stand in for a quoted post that can't be shown.
 */
export const QUOTE_PLACEHOLDERS: {title: string; embed: RecordView}[] = [
  {
    title: 'Blocked',
    embed: {
      $type: 'app.bsky.embed.record#view',
      record: {
        $type: 'app.bsky.embed.record#viewBlocked',
        uri: `at://${AUTHORS.marcus.did}/app.bsky.feed.post/blocked`,
        blocked: true,
        author: {
          did: AUTHORS.marcus.did,
          viewer: {
            blocking: 'at://did:plc:priya/app.bsky.graph.block/marcus',
          },
        },
      },
    },
  },
  {
    title: 'Deleted',
    embed: {
      $type: 'app.bsky.embed.record#view',
      record: {
        $type: 'app.bsky.embed.record#viewNotFound',
        uri: `at://${AUTHORS.marcus.did}/app.bsky.feed.post/deleted`,
        notFound: true,
      },
    },
  },
  {
    title: 'Detached by its author',
    embed: {
      $type: 'app.bsky.embed.record#view',
      record: {
        $type: 'app.bsky.embed.record#viewDetached',
        uri: `at://${AUTHORS.marcus.did}/app.bsky.feed.post/detached`,
        detached: true,
      },
    },
  },
]

/**
 * A post's own images with a quote, as a feed shows a record with media.
 */
export const RECORD_WITH_MEDIA = recordWithMedia(
  MEDIA.twoImages,
  quoteOf({rkey: 'rwmquote', text: FUNGUS_TEXT, embed: MEDIA.oneImage}),
)

/**
 * Links in every shape a compact link card handles.
 */
export const LINKS: {
  title: string
  link: app.bsky.embed.external.ViewExternal
}[] = [
  {title: 'With a thumbnail', link: MEDIA.link.external},
  {title: 'Without a thumbnail', link: MEDIA.linkWithoutThumbnail.external},
  {title: 'Long title', link: MEDIA.linkWithLongTitle.external},
  {title: 'No title', link: MEDIA.linkWithoutTitle.external},
]

/**
 * A post by `author` with `embed`, e.g. for a notification about it.
 */
export function postWith({
  author = AUTHORS.marcus,
  rkey,
  text,
  embed,
  minutesAgo = 30,
}: {
  author?: ProfileViewBasic
  rkey: string
  text: string
  embed?: PostView['embed']
  minutesAgo?: number
}): $Typed<PostView> {
  return {
    $type: 'app.bsky.feed.defs#postView',
    uri: `at://${author.did}/app.bsky.feed.post/${rkey}`,
    cid: cid(rkey),
    author,
    /*
     * The embed is left out of the record, since media blob refs need real
     * CIDs and nothing here reads it. Rendering uses the embed view.
     */
    record: {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: ago(minutesAgo),
    },
    embed,
    indexedAt: ago(minutesAgo),
    viewer: {},
    labels: [],
    likeCount: 0,
    repostCount: 0,
    replyCount: 0,
    quoteCount: 0,
    bookmarkCount: 0,
  }
}
