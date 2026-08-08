import {type $Typed} from '@atproto/lex'

import {type app} from '#/lexicons'
import {
  type Embed,
  type EmbedType,
  parseEmbed,
  parseEmbedRecordView,
} from '#/types/bsky/post'

const now = () => new Date().toISOString()

const imagesView = {
  $type: 'app.bsky.embed.images#view',
  images: [
    {
      $type: 'app.bsky.embed.images#viewImage',
      thumb: 'https://example.com/thumb.jpg',
      fullsize: 'https://example.com/full.jpg',
      alt: 'alt text',
    },
  ],
}

const galleryView = {
  $type: 'app.bsky.embed.gallery#view',
  items: [
    {
      $type: 'app.bsky.embed.gallery#viewImage',
      thumbnail: 'https://example.com/thumb.jpg',
      fullsize: 'https://example.com/full.jpg',
      alt: 'alt text',
      aspectRatio: {width: 1, height: 1},
    },
  ],
}

const externalView = {
  $type: 'app.bsky.embed.external#view',
  external: {
    $type: 'app.bsky.embed.external#viewExternal',
    uri: 'https://example.com',
    title: 'title',
    description: 'description',
  },
}

const videoView = {
  $type: 'app.bsky.embed.video#view',
  cid: 'bafyvideo',
  playlist: 'https://example.com/playlist.m3u8',
}

const viewRecord = {
  $type: 'app.bsky.embed.record#viewRecord',
  uri: 'at://did:plc:abc/app.bsky.feed.post/123',
  cid: 'bafypost',
  author: {
    $type: 'app.bsky.actor.defs#profileViewBasic',
    did: 'did:plc:abc',
    handle: 'alice.test',
  },
  value: {$type: 'app.bsky.feed.post', text: 'hello', createdAt: now()},
  indexedAt: now(),
}

const recordView = {
  $type: 'app.bsky.embed.record#view',
  record: viewRecord,
}

const generatorView = {
  $type: 'app.bsky.feed.defs#generatorView',
  uri: 'at://did:plc:abc/app.bsky.feed.generator/feed',
  cid: 'bafyfeed',
  did: 'did:web:example.com',
  creator: {
    $type: 'app.bsky.actor.defs#profileView',
    did: 'did:plc:abc',
    handle: 'alice.test',
  },
  displayName: 'Cool feed',
  indexedAt: now(),
}

const starterPackViewBasic = {
  $type: 'app.bsky.graph.defs#starterPackViewBasic',
  uri: 'at://did:plc:abc/app.bsky.graph.starterpack/123',
  cid: 'bafypack',
  record: {},
  creator: {
    $type: 'app.bsky.actor.defs#profileViewBasic',
    did: 'did:plc:abc',
    handle: 'alice.test',
  },
  indexedAt: now(),
}

/**
 * Casts a fixture into the `parseEmbed` input position. The fixtures are plain
 * objects standing in for app view responses; the guards under test only read
 * `$type`, so the structural detail beyond that is not load-bearing.
 */
const asEmbed = (v: unknown) => v as app.bsky.feed.defs.PostView['embed']

/*
 * Type-level assertions for the embed union. Compile-time only: each arm must
 * accept the `#/lexicons` view of its def, and `parseEmbed` must accept a
 * `PostView.embed`.
 */
type Assignable<From, To> = From extends To ? true : false
type Expect<T extends true> = T

type _PostArmAcceptsView = Expect<
  Assignable<
    {type: 'post'; view: $Typed<app.bsky.embed.record.ViewRecord>},
    EmbedType<'post'>
  >
>
type _ParseEmbedAcceptsPostViewEmbed = Expect<
  Assignable<
    app.bsky.feed.defs.PostView['embed'],
    Parameters<typeof parseEmbed>[0]
  >
>
type _ParseEmbedReturnsEmbed = Expect<
  Assignable<ReturnType<typeof parseEmbed>, Embed>
>

describe('types/bsky/post parseEmbed', () => {
  it('parses an images view', () => {
    const embed = parseEmbed(asEmbed(imagesView))
    expect(embed.type).toBe('images')
    if (embed.type === 'images') {
      expect(embed.view.images).toHaveLength(1)
    }
  })

  it('parses a gallery view', () => {
    const embed = parseEmbed(asEmbed(galleryView))
    expect(embed.type).toBe('gallery')
    if (embed.type === 'gallery') {
      expect(embed.view.items).toHaveLength(1)
    }
  })

  it('parses an external view', () => {
    const embed = parseEmbed(asEmbed(externalView))
    expect(embed.type).toBe('link')
    if (embed.type === 'link') {
      expect(embed.view.external.uri).toBe('https://example.com')
    }
  })

  it('parses a video view', () => {
    const embed = parseEmbed(asEmbed(videoView))
    expect(embed.type).toBe('video')
    if (embed.type === 'video') {
      expect(embed.view.playlist).toBe('https://example.com/playlist.m3u8')
    }
  })

  it('parses a record view through to its inner record', () => {
    const embed = parseEmbed(asEmbed(recordView))
    expect(embed.type).toBe('post')
    if (embed.type === 'post') {
      expect(embed.view.uri).toBe('at://did:plc:abc/app.bsky.feed.post/123')
    }
  })

  it('parses a recordWithMedia view into both halves', () => {
    const embed = parseEmbed(
      asEmbed({
        $type: 'app.bsky.embed.recordWithMedia#view',
        record: recordView,
        media: imagesView,
      }),
    )
    expect(embed.type).toBe('post_with_media')
    if (embed.type === 'post_with_media') {
      expect(embed.view.type).toBe('post')
      expect(embed.media.type).toBe('images')
    }
  })

  it('returns the unknown arm for an unrecognised $type', () => {
    const embed = parseEmbed(asEmbed({$type: 'com.example.someEmbed#view'}))
    expect(embed).toEqual({type: 'unknown', view: null})
  })

  it('returns the unknown arm for undefined', () => {
    expect(parseEmbed(undefined)).toEqual({type: 'unknown', view: null})
  })

  it('does not match an embed with no $type', () => {
    expect(parseEmbed(asEmbed({images: []}))).toEqual({
      type: 'unknown',
      view: null,
    })
  })
})

describe('types/bsky/post parseEmbedRecordView', () => {
  const asRecordView = (record: unknown) =>
    ({record}) as app.bsky.embed.record.View

  it('parses each known record variant', () => {
    expect(parseEmbedRecordView(asRecordView(viewRecord)).type).toBe('post')
    expect(
      parseEmbedRecordView(
        asRecordView({$type: 'app.bsky.embed.record#viewNotFound'}),
      ).type,
    ).toBe('post_not_found')
    expect(
      parseEmbedRecordView(
        asRecordView({$type: 'app.bsky.embed.record#viewBlocked'}),
      ).type,
    ).toBe('post_blocked')
    expect(
      parseEmbedRecordView(
        asRecordView({$type: 'app.bsky.embed.record#viewDetached'}),
      ).type,
    ).toBe('post_detached')
    expect(parseEmbedRecordView(asRecordView(generatorView)).type).toBe('feed')
    expect(
      parseEmbedRecordView(
        asRecordView({$type: 'app.bsky.graph.defs#listView'}),
      ).type,
    ).toBe('list')
    expect(
      parseEmbedRecordView(
        asRecordView({$type: 'app.bsky.labeler.defs#labelerView'}),
      ).type,
    ).toBe('labeler')
    expect(parseEmbedRecordView(asRecordView(starterPackViewBasic)).type).toBe(
      'starter_pack',
    )
  })

  it('returns the unknown arm for an unrecognised record', () => {
    expect(
      parseEmbedRecordView(asRecordView({$type: 'com.example.thing'})),
    ).toEqual({type: 'unknown', view: null})
  })
})

describe('types/bsky/post Embed dual-world types', () => {
  it('has the compile-time dual-world assertions above satisfied', () => {
    /*
     * The assertions are the `_*` types declared at module scope; a failure
     * surfaces as a typecheck error, not a test failure. This case exists so the
     * intent is visible when reading the suite.
     */
    const parsedNewWorld: Embed = parseEmbed(
      asEmbed({$type: 'app.bsky.embed.images#view', images: []}),
    )
    expect(parsedNewWorld.type).toBe('images')
  })
})
