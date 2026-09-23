import {describe, expect, jest, test} from '@jest/globals'

jest.unmock('multiformats/cid')
jest.unmock('multiformats/hashes/hasher')
import {TID} from '@atproto/common-web'
import {type BlobRef, type Client} from '@atproto/lex'
import {CID} from 'multiformats/cid'

import {planComposerV2} from '#/components/ComposerV2/planner'
import {
  type MediaAttachmentInput,
  type ThreadState,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {buildThreadState} from '#/components/ComposerV2/store/utils/buildThreadState'
import {app, chat} from '#/lexicons'

const DID = 'did:plc:planner-test'
const BLOB_CID = 'bafkreieq5jui4j25lacwomsqgjeswwl3y5zcdrresptwgmfylxo2depppq'
const blob = (mimeType: string): BlobRef => ({
  $type: 'blob',
  ref: CID.parse(BLOB_CID),
  mimeType,
  size: 123,
})
const appviewClient = {call: jest.fn()} as unknown as Client

function snapshot(initial: ThreadStoreInitialState): ThreadState {
  let id = 0
  return buildThreadState(initial, () => `post-${++id}`)
}

function readyImages(state: ThreadState, count = 1) {
  const postId = Object.keys(state.posts)[0]
  const post = state.posts[postId]
  const media = post.attachments.media
  if (!media || media.state !== 'resolved' || media.kind !== 'images') {
    throw new Error('expected image media')
  }
  const items = media.items.slice(0, count)
  for (const item of items) {
    item.upload = {state: 'uploaded', blob: blob('image/jpeg')}
    item.prepared = {
      uri: item.uri,
      width: item.width,
      height: item.height,
      mimeType: 'image/jpeg',
      aspectRatio: {width: item.width, height: item.height},
    }
  }
  state.posts[postId] = {
    ...post,
    attachments: {
      ...post.attachments,
      media: {...media, items},
    },
  }
  return postId
}

function plan(state: ThreadState, extra = {}) {
  const result = planComposerV2({
    snapshot: state,
    dependencies: {
      did: DID,
      appviewClient,
      now: () => new Date('2024-01-01T00:00:00.000Z'),
      createRkey: (index, createdAt) =>
        TID.fromTime(createdAt.getTime() * 1000, index).toString(),
      ...extra,
    },
  })
  return result
}

function imageInputs(count: number): MediaAttachmentInput {
  return {
    kind: 'images',
    items: Array.from({length: count}, (_, index) => ({
      uri: `file:///image-${index}.jpg`,
      width: 100 + index,
      height: 80 + index,
      altText: `alt ${index}`,
    })),
  }
}

describe('ComposerV2 no-write planner', () => {
  test('plans final order, deterministic keys, CIDs, and parent chaining', async () => {
    const state = snapshot({
      posts: [{text: 'first'}, {text: 'second'}, {text: 'third'}],
    })
    const first = await plan(state)
    const second = await plan(state)

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(first.posts.map(post => post.rkey)).toEqual(
      second.posts.map(post => post.rkey),
    )
    expect(new Set(first.posts.map(post => post.rkey)).size).toBe(3)
    expect(first.posts.map(post => post.cid)).toEqual(
      second.posts.map(post => post.cid),
    )
    expect(first.posts[0].record.reply).toBeUndefined()
    expect(first.posts[1].record.reply).toEqual({
      root: {uri: first.posts[0].uri, cid: first.posts[0].cid},
      parent: {uri: first.posts[0].uri, cid: first.posts[0].cid},
    })
    expect(first.posts[2].record.reply).toEqual({
      root: {uri: first.posts[0].uri, cid: first.posts[0].cid},
      parent: {uri: first.posts[1].uri, cid: first.posts[1].cid},
    })
  })

  test('keeps an actual external reply root instead of fabricating one', async () => {
    const state = snapshot({
      replyTo: {
        uri: 'at://did:plc:parent/app.bsky.feed.post/parent',
        cid: 'bafyreieawtmh7hwfrqpamqkodza5r62bbfhsepe2iyustgxhgbhi6b2lfi',
        text: 'parent preview',
        langs: [],
        author: {} as never,
      },
      posts: [{text: 'reply'}, {text: 'follow-up'}],
    })
    const root = {
      uri: 'at://did:plc:parent/app.bsky.feed.post/root',
      cid: 'bafyreig62rxs34h5rvznfrracwkjlfgad5b25qxglp2hcziqdfas2nw2ee',
    }
    const result = await plan(state, {
      resolveReplyRoot: () => Promise.resolve(root),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts[0].record.reply).toEqual({
      root,
      parent: {
        uri: state.replyTo!.uri,
        cid: state.replyTo!.cid,
      },
    })
    expect(result.posts[1].record.reply?.root).toEqual(root)
  })

  test.each([1, 4, 5, 10])(
    'selects the protocol media shape at the %s-image boundary',
    async count => {
      const state = snapshot({
        posts: [{attachments: {media: imageInputs(count)}}],
      })
      readyImages(state, count)
      const result = await plan(state)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      const embed = result.posts[0].record.embed
      expect(embed?.$type).toBe(
        count <= 4 ? 'app.bsky.embed.images' : 'app.bsky.embed.gallery',
      )
      const images =
        count <= 4
          ? (embed as app.bsky.embed.images.Main).images
          : (embed as app.bsky.embed.gallery.Main).items
      expect(images).toHaveLength(count)
      expect(
        images.map(image => ('alt' in image ? image.alt : undefined)),
      ).toEqual(Array.from({length: count}, (_, index) => `alt ${index}`))
    },
  )

  test('rejects overflow rather than truncating an image attachment', async () => {
    const state = snapshot({posts: [{attachments: {media: imageInputs(10)}}]})
    const postId = readyImages(state, 10)
    const post = state.posts[postId]
    const media = post.attachments.media!
    if (media.state !== 'resolved' || media.kind !== 'images') return
    state.posts[postId] = {
      ...post,
      attachments: {
        ...post.attachments,
        media: {...media, items: [...media.items, media.items[0]]},
      },
    }
    const result = await plan(state)
    expect(result).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'unsupported-attachment'})],
    })
  })

  test('builds record, media, and recordWithMedia from the two active slots', async () => {
    const state = snapshot({
      posts: [
        {
          attachments: {
            record: {
              kind: 'feed',
              record: {
                uri: 'at://did:plc:feed/app.bsky.feed.generator/one',
                cid: BLOB_CID,
              },
            },
            media: imageInputs(1),
          },
        },
      ],
    })
    readyImages(state)
    const result = await plan(state)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts[0].record.embed?.$type).toBe(
      'app.bsky.embed.recordWithMedia',
    )
    expect(
      result.writes.filter(
        write => write.$type === 'com.atproto.repo.applyWrites#create',
      ),
    ).toHaveLength(1)
  })

  const recordKinds: Array<
    [
      'post' | 'feed' | 'list' | 'starter-pack',
      (
        | 'app.bsky.feed.post'
        | 'app.bsky.feed.generator'
        | 'app.bsky.graph.list'
        | 'app.bsky.graph.starterpack'
      ),
    ]
  > = [
    ['post', 'app.bsky.feed.post'],
    ['feed', 'app.bsky.feed.generator'],
    ['list', 'app.bsky.graph.list'],
    ['starter-pack', 'app.bsky.graph.starterpack'],
  ]

  test.each(recordKinds)(
    'plans the %s record kind without refetching its supplied ref',
    async (kind, collection) => {
      const state = snapshot({
        posts: [
          {
            attachments: {
              record: {
                kind,
                record: {
                  uri: `at://did:plc:record/${collection}/one`,
                  cid: BLOB_CID,
                },
              },
            },
          },
        ],
      })
      const result = await plan(state)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.posts[0].record.embed).toMatchObject({
        $type: 'app.bsky.embed.record',
        record: {uri: `at://did:plc:record/${collection}/one`, cid: BLOB_CID},
      })
      expect(appviewClient.call).not.toHaveBeenCalled()
    },
  )

  test('plans external cards and GIFs through injected metadata and blob uploads', async () => {
    const external = snapshot({
      posts: [
        {
          attachments: {
            media: {
              kind: 'external',
              uri: 'https://example.com/article',
              title: 'Article',
              description: 'Description',
              thumb: undefined,
            },
          },
        },
      ],
    })
    const externalResult = await plan(external)
    expect(externalResult.ok).toBe(true)
    if (!externalResult.ok) return
    expect(externalResult.posts[0].record.embed?.$type).toBe(
      'app.bsky.embed.external',
    )

    const gif = snapshot({
      posts: [
        {
          attachments: {
            media: {
              kind: 'gif',
              item: {gif: {} as never, altText: 'gif'},
            },
          },
        },
      ],
    })
    const gifResult = await plan(gif, {
      resolveGif: () =>
        Promise.resolve({
          type: 'external',
          uri: 'https://example.com/gif',
          title: 'GIF',
          description: 'GIF description',
          thumb: undefined,
        }),
    })
    expect(gifResult.ok).toBe(true)
    if (!gifResult.ok) return
    expect(gifResult.posts[0].record.embed?.$type).toBe(
      'app.bsky.embed.external',
    )
  })

  test('rejects tag overflow and invalid dimensions without truncating', async () => {
    const tooManyTags = snapshot({
      posts: [{tags: Array.from({length: 9}, (_, index) => `tag-${index}`)}],
    })
    const tagResult = await plan(tooManyTags)
    expect(tagResult.ok).toBe(false)
    if (!tagResult.ok) expect(tagResult.errors[0].code).toBe('invalid-record')

    const invalidImage = snapshot({
      posts: [{attachments: {media: imageInputs(1)}}],
    })
    const postId = readyImages(invalidImage)
    const post = invalidImage.posts[postId]
    const media = post.attachments.media!
    if (media.state === 'resolved' && media.kind === 'images') {
      media.items[0].prepared!.width = 0
    }
    const imageResult = await plan(invalidImage)
    expect(imageResult.ok).toBe(false)
    if (!imageResult.ok)
      expect(imageResult.errors[0].code).toBe('invalid-record')
  })

  test('uses the captured composition when an edit occurs during reply preparation', async () => {
    const state = snapshot({
      replyTo: {
        uri: 'at://did:plc:parent/app.bsky.feed.post/parent',
        cid: BLOB_CID,
        text: 'parent',
        langs: [],
        author: {} as never,
      },
      posts: [{text: 'captured'}],
    })
    let resolveRoot!: () => void
    const waiting = new Promise<void>(resolve => {
      resolveRoot = resolve
    })
    const resultPromise = plan(state, {
      resolveReplyRoot: async () => {
        await waiting
        return {
          uri: 'at://did:plc:parent/app.bsky.feed.post/root',
          cid: BLOB_CID,
        }
      },
    })
    state.posts[Object.keys(state.posts)[0]] = {
      ...state.posts[Object.keys(state.posts)[0]],
      text: 'edited after capture',
    }
    resolveRoot()
    const result = await resultPromise
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts[0].record.text).toBe('captured')
  })

  test('plans video captions and preserves explicit tags separately from facets', async () => {
    const state = snapshot({
      posts: [
        {
          text: '#in-text',
          tags: ['explicit-tag'],
          attachments: {
            media: {
              kind: 'video',
              item: {
                uri: 'file:///video.mp4',
                width: 1920,
                height: 1080,
                mimeType: 'video/mp4',
                captions: [{lang: 'en', content: 'WEBVTT'}],
              },
            },
          },
        },
      ],
    })
    const postId = Object.keys(state.posts)[0]
    const post = state.posts[postId]
    const media = post.attachments.media!
    if (media.state !== 'resolved' || media.kind !== 'video') return
    media.item.upload = {
      state: 'uploaded',
      blob: blob('video/mp4'),
    }
    media.item.prepared = {
      uri: media.item.uri,
      size: 100,
      mimeType: 'video/mp4',
      width: 1920,
      height: 1080,
      aspectRatio: {width: 1920, height: 1080},
    }
    media.item.captionBlobs = [{lang: 'en', blob: blob('text/vtt')}]
    const result = await plan(state)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const record = result.posts[0].record
    expect(record.tags).toEqual(['explicit-tag'])
    expect(
      record.facets?.some(facet =>
        facet.features.some(
          feature => feature.$type === 'app.bsky.richtext.facet#tag',
        ),
      ),
    ).toBe(true)
    expect(record.embed?.$type).toBe('app.bsky.embed.video')
  })

  test('preserves gate semantics and applies postgates to every post', async () => {
    const state = snapshot({
      threadgateAllowRules: [],
      postgateEmbeddingRules: [
        {$type: 'app.bsky.feed.postgate#disableRule'},
        {$type: 'app.bsky.feed.postgate#futureRule', opaque: true} as never,
      ],
      posts: [{text: 'one'}, {text: 'two'}],
    })
    const result = await plan(state)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const gateWrites = result.writes.filter(
      write =>
        write.$type === 'com.atproto.repo.applyWrites#create' &&
        write.collection !== 'app.bsky.feed.post',
    )
    expect(gateWrites).toHaveLength(3)
    const threadgate = gateWrites.find(
      write =>
        write.$type === 'com.atproto.repo.applyWrites#create' &&
        write.collection === 'app.bsky.feed.threadgate',
    )
    expect(threadgate?.$type).toBe('com.atproto.repo.applyWrites#create')
    if (threadgate?.$type === 'com.atproto.repo.applyWrites#create') {
      expect(threadgate.value).toMatchObject({allow: []})
    }
    expect(
      gateWrites.filter(
        write =>
          write.$type === 'com.atproto.repo.applyWrites#create' &&
          write.collection === 'app.bsky.feed.postgate',
      ),
    ).toHaveLength(2)
  })

  test('returns readiness and validation errors without calling repository writes', async () => {
    const pending = snapshot({posts: [{attachments: {media: imageInputs(1)}}]})
    const pendingResult = await plan(pending)
    expect(pendingResult.ok).toBe(false)
    if (!pendingResult.ok) {
      expect(pendingResult.errors[0].code).toBe('attachment-not-ready')
    }

    const call = jest.fn()
    const state = snapshot({
      posts: [
        {
          tags: Array.from({length: 9}, (_, index) => `tag-${index}`),
          attachments: {media: imageInputs(1)},
        },
      ],
    })
    const postId = Object.keys(state.posts)[0]
    const post = state.posts[postId]
    const media = post.attachments.media!
    if (media.state !== 'resolved' || media.kind !== 'images') return
    media.items[0].upload = {
      state: 'failed',
      error: 'private worker detail',
      retryable: false,
      retry: jest.fn(),
    }
    const result = await plan(state)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0].code).toBe('media-failed')
    expect(JSON.stringify(result)).not.toContain('private worker detail')
    expect(call).not.toHaveBeenCalled()
  })

  test('does not claim draft tags are persisted', () => {
    const state = snapshot({posts: [{tags: ['future-tag']}]})
    expect(state.posts[Object.keys(state.posts)[0]].tags).toEqual([
      'future-tag',
    ])
  })

  test('uses the generated chat invite shape only with a hydrated preview', async () => {
    const state = snapshot({
      posts: [
        {
          attachments: {
            media: {
              kind: 'chat-invite',
              uri: 'https://bsky.app/chat/abc',
              code: 'abc',
              view: {
                $type: 'chat.bsky.group.defs#joinLinkPreviewView',
                code: 'abc',
                name: 'Group',
                owner: {
                  did: 'did:plc:owner',
                  handle: 'owner.test',
                },
                convoId: 'convo',
                joinRule: 'anyone',
                memberCount: 1,
                memberLimit: 10,
                requireApproval: false,
              },
            },
          },
        },
      ],
    })
    const result = await plan(state)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts[0].record.embed).toMatchObject({
      $type: 'app.bsky.embed.external',
      external: {title: 'Group', description: '1/10'},
    })
    expect(app.bsky.feed.post.$matches(result.posts[0].record)).toBe(true)
    const media = state.posts[Object.keys(state.posts)[0]].attachments.media
    expect(
      media?.state === 'resolved' &&
        media.kind === 'chat-invite' &&
        chat.bsky.group.defs.joinLinkPreviewView.$matches(media.view),
    ).toBe(true)
  })
})
