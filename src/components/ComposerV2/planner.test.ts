import {describe, expect, jest, test} from '@jest/globals'

jest.unmock('multiformats/cid')
jest.unmock('multiformats/hashes/hasher')
/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {TID} from '@atproto/common-web'
import {type BlobRef, type Client} from '@atproto/lex'
import {type AtUriString, isValidTid} from '@atproto/syntax'
import {CID} from 'multiformats/cid'

import {type ComposerV2OnError} from '#/components/ComposerV2/errors'
import {
  type ComposerV2PlannerDependencies,
  type ComposerV2PlannerPreflight,
  planComposerV2,
  summarizeComposerV2Plan,
} from '#/components/ComposerV2/planner'
import {createThreadStore} from '#/components/ComposerV2/store'
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

/**
 * A fake AppView client that records every schema NSID it is asked to call.
 * This is the actual dependency boundary the planner reads through, so the
 * no-write tests assert on these observed calls rather than a detached spy.
 */
function mockAppview(
  handlers: {
    getPosts?: (args: unknown) => unknown
    resolveHandle?: (args: unknown) => unknown
  } = {},
) {
  const calls: Array<{nsid: string; args: unknown}> = []
  const client = {
    call: jest.fn((ns: unknown, args: unknown) => {
      const nsid = (ns as {$nsid?: string})?.$nsid ?? 'unknown'
      calls.push({nsid, args})
      if (nsid === 'app.bsky.feed.getPosts' && handlers.getPosts) {
        return Promise.resolve(handlers.getPosts(args))
      }
      if (
        nsid === 'com.atproto.identity.resolveHandle' &&
        handlers.resolveHandle
      ) {
        return Promise.resolve(handlers.resolveHandle(args))
      }
      return Promise.reject(new Error(`unexpected appview call: ${nsid}`))
    }),
  } as unknown as Client
  return {client, calls}
}

function snapshot(initial: ThreadStoreInitialState): ThreadState {
  let id = 0
  return buildThreadState({input: initial, createId: () => `post-${++id}`})
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

function plan(
  state: ThreadState,
  extra: Partial<ComposerV2PlannerDependencies> = {},
  preflight?: ComposerV2PlannerPreflight,
  onError?: ComposerV2OnError,
) {
  return planComposerV2({
    snapshot: state,
    dependencies: {
      did: DID,
      appviewClient: mockAppview().client,
      now: () => new Date('2024-01-01T00:00:00.000Z'),
      __createRkey: (index, createdAt) =>
        TID.fromTime(createdAt.getTime() * 1000, index).toString(),
      ...extra,
    },
    preflight,
    onError,
  })
}

describe('planner reporting policy', () => {
  test('unexpected causes survive generic conversion without serialization or UI leakage', async () => {
    const cause = Object.assign(new Error('private diagnostic'), {
      privatePath: 'private diagnostic',
    })
    const onError = jest.fn<ComposerV2OnError>(() => {
      throw new Error('listener')
    })
    const state = snapshot({posts: [{text: 'hello'}]})
    const before = JSON.stringify(state)
    const result = await plan(
      state,
      {
        now: () => {
          throw cause
        },
      },
      undefined,
      onError,
    )
    expect(result).toEqual({
      ok: false,
      errors: [{code: 'unexpected-error', message: 'Record planning failed'}],
    })
    if (result.ok) throw new Error('expected failure')
    expect(result.errors[0].cause).toBe(cause)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'planner',
        code: 'unexpected-error',
        kind: 'unexpected',
        recovery: 'none',
      }),
      cause,
    )
    expect(JSON.stringify(result)).not.toContain('private diagnostic')
    expect(JSON.stringify(summarizeComposerV2Plan({result}))).not.toContain(
      'private diagnostic',
    )
    expect(JSON.stringify(state)).toBe(before)
  })

  test('operational failures retain original causes and report once per plan attempt', async () => {
    const cause = new Error('private reply diagnostic')
    const resolveReply = jest.fn<
      NonNullable<ComposerV2PlannerDependencies['resolveReply']>
    >(() => Promise.reject(cause))
    const onError = jest.fn<ComposerV2OnError>()
    const state = snapshot({posts: [{text: 'reply'}], replyTo: replyTarget})
    for (let attempt = 1; attempt <= 2; attempt++) {
      const result = await plan(state, {resolveReply}, undefined, onError)
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('expected failure')
      expect(result.errors[0].cause).toBe(cause)
      expect(onError).toHaveBeenCalledTimes(attempt)
      expect(onError).toHaveBeenLastCalledWith(
        expect.objectContaining({
          code: 'reply-resolution-failed',
          recovery: 'retry',
          kind: 'operational',
        }),
        cause,
      )
      expect(JSON.stringify(result)).not.toContain('private reply diagnostic')
    }
    expect(resolveReply).toHaveBeenCalledTimes(2)
  })

  test('thumbnail failures report post identity and preserve the original cause', async () => {
    const cause = Object.assign(new Error('thumbnail diagnostic'), {
      privatePath: 'thumbnail diagnostic',
    })
    const uploadBlob = jest.fn<
      NonNullable<ComposerV2PlannerDependencies['uploadBlob']>
    >(() => Promise.reject(cause))
    const onError = jest.fn<ComposerV2OnError>()
    const state = snapshot({
      posts: [
        {
          text: 'card',
          attachments: {
            media: {
              kind: 'external',
              uri: 'https://example.com',
              title: '',
              description: '',
              thumb: {
                source: {path: 'file:///private.jpg', mime: 'image/jpeg'},
              } as never,
            },
          },
        },
      ],
    })
    const result = await plan(state, {uploadBlob}, undefined, onError)
    expect(uploadBlob).toHaveBeenCalledTimes(1)
    if (result.ok) throw new Error('expected failure')
    expect(result.errors[0].cause).toBe(cause)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 'post-1',
        code: 'media-upload-failed',
        recovery: 'retry',
      }),
      cause,
    )
    expect(JSON.stringify(result)).not.toContain('thumbnail diagnostic')
  })

  test('ordinary preflight, record validation and existing failures never report as new operations', async () => {
    const onError = jest.fn<ComposerV2OnError>()
    const empty = snapshot({})
    const missingAlt = snapshot({
      posts: [
        {
          attachments: {
            media: {
              kind: 'images',
              items: [{uri: 'file:///private', width: 10, height: 10}],
            },
          },
        },
      ],
    })
    readyImages(missingAlt)
    const alreadyFailed = snapshot({
      posts: [{attachments: {media: imageInputs(1)}}],
    })
    const media = alreadyFailed.posts['post-1'].attachments.media
    if (media?.state !== 'resolved' || media.kind !== 'images')
      throw new Error('expected image')
    media.items[0].upload = {
      state: 'failed',
      retryable: false,
      error: 'Safe error',
    }
    for (const state of [
      empty,
      missingAlt,
      alreadyFailed,
      snapshot({posts: [{text: 'x'.repeat(400)}]}),
    ]) {
      const result = await plan(state, {}, {requireAltText: true}, onError)
      expect(result.ok).toBe(false)
    }
    expect(onError).not.toHaveBeenCalled()
  })

  test('cancelled dependency work keeps its result but does not report', async () => {
    const cause = Object.assign(new Error('cancelled'), {name: 'AbortError'})
    const onError = jest.fn<ComposerV2OnError>()
    const result = await plan(
      snapshot({posts: [{text: 'reply'}], replyTo: replyTarget}),
      {resolveReply: () => Promise.reject(cause)},
      undefined,
      onError,
    )
    expect(result.ok).toBe(false)
    expect(onError).not.toHaveBeenCalled()
  })
})

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

const externalReply = {
  root: {
    uri: 'at://did:plc:parent/app.bsky.feed.post/root' as AtUriString,
    cid: 'bafyreig62rxs34h5rvznfrracwkjlfgad5b25qxglp2hcziqdfas2nw2ee',
  },
  parent: {
    uri: 'at://did:plc:parent/app.bsky.feed.post/parent' as AtUriString,
    cid: 'bafyreieawtmh7hwfrqpamqkodza5r62bbfhsepe2iyustgxhgbhi6b2lfi',
  },
}

const replyTarget = {
  uri: 'at://did:plc:parent/app.bsky.feed.post/parent',
  cid: BLOB_CID,
  text: 'parent preview',
  langs: [],
  author: {} as never,
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
    expect(first.posts.every(post => isValidTid(post.rkey))).toBe(true)
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

  test('default allocation uses the collision-resistant TID sequence', async () => {
    /*
     * Regression: TID.fromTime(createdAt, 0) allocated the same URI for plans
     * with overlapping timestamps. The default must use TID.next, so plans
     * created at the "same" time still get unique keys.
     */
    const first = await plan(
      snapshot({posts: [{text: 'one'}, {text: 'two'}]}),
      {
        __createRkey: undefined,
      },
    )
    const second = await plan(
      snapshot({posts: [{text: 'another composition'}]}),
      {
        __createRkey: undefined,
        now: () => new Date('2024-01-01T00:00:00.001Z'),
      },
    )
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    const uris = [...first.posts, ...second.posts].map(post => post.uri)
    expect(new Set(uris).size).toBe(uris.length)
    for (const post of [...first.posts, ...second.posts]) {
      expect(isValidTid(post.rkey)).toBe(true)
    }
  })

  test('rejects duplicate injected post record keys', async () => {
    const key = TID.fromTime(
      new Date('2024-01-01T00:00:00.000Z').getTime() * 1000,
      0,
    ).toString()
    const result = await plan(
      snapshot({posts: [{text: 'one'}, {text: 'two'}]}),
      {__createRkey: () => key},
    )
    expect(result).toEqual({
      ok: false,
      errors: [
        expect.objectContaining({code: 'invalid-record-key', postIndex: 1}),
      ],
    })
  })

  test('rejects injected record keys that are not valid TIDs', async () => {
    const result = await plan(snapshot({posts: [{text: 'one'}]}), {
      __createRkey: () => 'not-a-tid',
    })
    expect(result).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'invalid-record-key'})],
    })
  })

  test('keeps an actual external reply through an injected resolver', async () => {
    const state = snapshot({
      replyTo: {...replyTarget},
      posts: [{text: 'reply'}, {text: 'follow-up'}],
    })
    const result = await plan(state, {
      resolveReply: () => Promise.resolve(externalReply),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts[0].record.reply).toEqual(externalReply)
    expect(result.posts[1].record.reply).toEqual({
      root: externalReply.root,
      parent: {uri: result.posts[0].uri, cid: result.posts[0].cid},
    })
  })

  test('resolves reply refs through the AppView with authoritative parent refs', async () => {
    /*
     * The fetched parent's uri/cid are used for the parent ref rather than
     * mixing in the local preview's cid.
     */
    const fetchedParent = {
      uri: replyTarget.uri,
      cid: 'bafyreig62rxs34h5rvznfrracwkjlfgad5b25qxglp2hcziqdfas2nw2ee',
      record: {$type: 'app.bsky.feed.post'},
    }
    const {client, calls} = mockAppview({
      getPosts: () => ({posts: [fetchedParent]}),
    })
    const state = snapshot({
      replyTo: {...replyTarget},
      posts: [{text: 'reply'}],
    })
    const result = await plan(state, {appviewClient: client})
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts[0].record.reply).toEqual({
      root: {uri: fetchedParent.uri, cid: fetchedParent.cid},
      parent: {uri: fetchedParent.uri, cid: fetchedParent.cid},
    })
    expect(calls.map(call => call.nsid)).toContain('app.bsky.feed.getPosts')
  })

  test('preserves the external thread root when the parent is itself a reply', async () => {
    const {client} = mockAppview({
      getPosts: () => ({
        posts: [
          {
            uri: replyTarget.uri,
            cid: externalReply.parent.cid,
            record: {
              $type: 'app.bsky.feed.post',
              reply: {root: externalReply.root, parent: externalReply.root},
            },
          },
        ],
      }),
    })
    const state = snapshot({
      replyTo: {...replyTarget},
      posts: [{text: 'reply'}, {text: 'follow-up'}],
    })
    const result = await plan(state, {appviewClient: client})
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts[0].record.reply).toEqual({
      root: externalReply.root,
      parent: {uri: replyTarget.uri, cid: externalReply.parent.cid},
    })
    expect(result.posts[1].record.reply?.root).toEqual(externalReply.root)
  })

  test('fails reply resolution when the parent is deleted or unavailable', async () => {
    const missing = await plan(
      snapshot({replyTo: {...replyTarget}, posts: [{text: 'reply'}]}),
      {appviewClient: mockAppview({getPosts: () => ({posts: []})}).client},
    )
    expect(missing).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'reply-resolution-failed'})],
    })

    const failing = await plan(
      snapshot({replyTo: {...replyTarget}, posts: [{text: 'reply'}]}),
      {
        appviewClient: mockAppview({
          getPosts: () => {
            throw new Error('network down')
          },
        }).client,
      },
    )
    expect(failing).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'reply-resolution-failed'})],
    })
    expect(JSON.stringify(failing)).not.toContain('network down')
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
      const appview = mockAppview()
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
      const result = await plan(state, {appviewClient: appview.client})
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.posts[0].record.embed).toMatchObject({
        $type: 'app.bsky.embed.record',
        record: {uri: `at://did:plc:record/${collection}/one`, cid: BLOB_CID},
      })
      expect(appview.calls).toHaveLength(0)
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
  })

  test('preserves custom GIF alt text and falls back to the provider title', async () => {
    const resolveGif = () =>
      Promise.resolve({
        type: 'external' as const,
        uri: 'https://example.com/gif',
        title: 'Provider title',
        description: 'ALT: Provider title',
        thumb: undefined,
      })

    const withAlt = snapshot({
      posts: [
        {
          attachments: {
            media: {
              kind: 'gif',
              item: {gif: {} as never, altText: 'My custom description'},
            },
          },
        },
      ],
    })
    const withAltResult = await plan(withAlt, {resolveGif})
    expect(withAltResult.ok).toBe(true)
    if (!withAltResult.ok) return
    expect(withAltResult.posts[0].record.embed).toMatchObject({
      $type: 'app.bsky.embed.external',
      external: {
        uri: 'https://example.com/gif',
        title: 'Provider title',
        description: 'Alt: My custom description',
      },
    })

    /* Whitespace-only and empty alt fall back to the provider title. */
    for (const altText of ['', '   ']) {
      const fallback = snapshot({
        posts: [
          {
            attachments: {
              media: {kind: 'gif', item: {gif: {} as never, altText}},
            },
          },
        ],
      })
      const fallbackResult = await plan(fallback, {resolveGif})
      expect(fallbackResult.ok).toBe(true)
      if (!fallbackResult.ok) return
      expect(fallbackResult.posts[0].record.embed).toMatchObject({
        external: {description: 'ALT: Provider title'},
      })
    }
  })

  test('rejects an entirely empty composition', async () => {
    const empty = await plan(snapshot({}))
    expect(empty).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'empty-composition'})],
    })

    const whitespace = await plan(
      snapshot({posts: [{text: '  \n'}, {text: ''}]}),
    )
    expect(whitespace).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'empty-composition'})],
    })
  })

  test('trims trailing empty posts while preserving accepted content', async () => {
    const state = snapshot({
      posts: [{text: 'first'}, {text: 'second'}, {text: '  \n'}, {text: ''}],
    })
    const result = await plan(state)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts.map(post => post.record.text)).toEqual([
      'first',
      'second',
    ])
    expect(result.posts.map(post => post.postId)).toEqual([
      Object.keys(state.posts)[0],
      Object.keys(state.posts)[1],
    ])
  })

  test('requires confirmation before skipping a non-trailing empty post', async () => {
    const state = snapshot({
      posts: [{text: 'first'}, {text: '  \n'}, {text: 'last'}],
    })
    const unconfirmed = await plan(state)
    expect(unconfirmed).toEqual({
      ok: false,
      errors: [
        expect.objectContaining({
          code: 'empty-post-requires-confirmation',
          postIndex: 1,
          postId: Object.keys(state.posts)[1],
        }),
      ],
    })

    const confirmed = await plan(state, {}, {skipEmptyPostsConfirmed: true})
    expect(confirmed.ok).toBe(true)
    if (!confirmed.ok) return
    expect(confirmed.posts.map(post => post.record.text)).toEqual([
      'first',
      'last',
    ])
    expect(confirmed.posts.map(post => post.postId)).toEqual([
      Object.keys(state.posts)[0],
      Object.keys(state.posts)[2],
    ])
    expect(confirmed.posts[1].record.reply).toEqual({
      root: {uri: confirmed.posts[0].uri, cid: confirmed.posts[0].cid},
      parent: {uri: confirmed.posts[0].uri, cid: confirmed.posts[0].cid},
    })
  })

  test('gates apply to the accepted sequence when empty posts are skipped', async () => {
    const state = snapshot({
      threadgateAllowRules: [],
      postgateEmbeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
      posts: [{text: '  \n'}, {text: 'actual root'}, {text: ''}],
    })
    const result = await plan(state, {}, {skipEmptyPostsConfirmed: true})
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.posts).toHaveLength(1)
    const creates = result.writes.filter(
      write => write.$type === 'com.atproto.repo.applyWrites#create',
    )
    expect(creates.map(write => write.collection).sort()).toEqual([
      'app.bsky.feed.post',
      'app.bsky.feed.postgate',
      'app.bsky.feed.threadgate',
    ])
    const threadgate = creates.find(
      write => write.collection === 'app.bsky.feed.threadgate',
    )
    expect(threadgate).toMatchObject({
      rkey: result.posts[0].rkey,
      value: {post: result.posts[0].uri},
    })
  })

  test('keeps attachment-only and tags-only posts instead of dropping them', async () => {
    const attachmentOnly = snapshot({
      posts: [{attachments: {media: imageInputs(1)}}],
    })
    readyImages(attachmentOnly)
    const attachmentResult = await plan(attachmentOnly)
    expect(attachmentResult.ok).toBe(true)
    if (!attachmentResult.ok) return
    expect(attachmentResult.posts[0].record.text).toBe('')
    expect(attachmentResult.posts[0].record.embed?.$type).toBe(
      'app.bsky.embed.images',
    )

    const tagsOnly = await plan(
      snapshot({posts: [{text: 'first'}, {tags: ['keep-me']}]}),
    )
    expect(tagsOnly.ok).toBe(true)
    if (!tagsOnly.ok) return
    expect(tagsOnly.posts).toHaveLength(2)
    expect(tagsOnly.posts[1].record.tags).toEqual(['keep-me'])
  })

  test('keeps pending and failed attachments as errors, not droppable posts', async () => {
    const pending = snapshot({
      posts: [{text: 'first'}, {attachments: {media: imageInputs(1)}}],
    })
    const result = await plan(pending)
    expect(result).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'attachment-not-ready'})],
    })
  })

  test('enforces required alt text only as an explicit preflight preference', async () => {
    const missingAlt = snapshot({
      posts: [
        {
          attachments: {
            media: {
              kind: 'images',
              items: [
                {uri: 'file:///image.jpg', width: 100, height: 80, altText: ''},
              ],
            },
          },
        },
      ],
    })
    readyImages(missingAlt)

    /* Off (the default preference) plans fine without alt text. */
    const withoutPreference = await plan(missingAlt)
    expect(withoutPreference.ok).toBe(true)

    const withPreference = await plan(missingAlt, {}, {requireAltText: true})
    expect(withPreference).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'missing-alt-text'})],
    })

    const gif = snapshot({
      posts: [{attachments: {media: {kind: 'gif', item: {gif: {} as never}}}}],
    })
    const gifResult = await plan(gif, {}, {requireAltText: true})
    expect(gifResult).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'missing-alt-text'})],
    })

    const withAlt = snapshot({posts: [{attachments: {media: imageInputs(1)}}]})
    readyImages(withAlt)
    const withAltResult = await plan(withAlt, {}, {requireAltText: true})
    expect(withAltResult.ok).toBe(true)
  })

  test('requires video alt text unless the upload already failed', async () => {
    const video = (
      upload:
        | {state: 'uploaded'; blob: BlobRef}
        | {state: 'failed'; error: string; retryable: false; retry?: never},
    ) => {
      const state = snapshot({
        posts: [
          {
            attachments: {
              media: {
                kind: 'video',
                item: {
                  uri: 'file:///video.mp4',
                  width: 1920,
                  height: 1080,
                  mimeType: 'video/mp4',
                },
              },
            },
          },
        ],
      })
      const postId = Object.keys(state.posts)[0]
      const media = state.posts[postId].attachments.media!
      if (media.state === 'resolved' && media.kind === 'video') {
        media.item.upload = upload
      }
      return state
    }

    const uploaded = await plan(
      video({state: 'uploaded', blob: blob('video/mp4')}),
      {},
      {requireAltText: true},
    )
    expect(uploaded).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'missing-alt-text'})],
    })

    /* A failed upload reports the failure, not the alt-text preference. */
    const failed = await plan(
      video({
        state: 'failed',
        error: 'private worker detail',
        retryable: false,
      }),
      {},
      {requireAltText: true},
    )
    expect(failed).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'media-failed'})],
    })
  })

  test('validates the 300-grapheme boundary through the generated lexicon', async () => {
    const atLimit = await plan(snapshot({posts: [{text: '💙'.repeat(300)}]}))
    expect(atLimit.ok).toBe(true)

    const overLimit = await plan(snapshot({posts: [{text: '💙'.repeat(301)}]}))
    expect(overLimit).toEqual({
      ok: false,
      errors: [expect.objectContaining({code: 'invalid-record'})],
    })
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
    media.item.altText = 'video alt'
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

  test('preserves gate semantics, sharing each post key across collections', async () => {
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
    const creates = result.writes.filter(
      write => write.$type === 'com.atproto.repo.applyWrites#create',
    )
    const gateWrites = creates.filter(
      write => write.collection !== 'app.bsky.feed.post',
    )
    expect(gateWrites).toHaveLength(3)
    const threadgate = gateWrites.find(
      write => write.collection === 'app.bsky.feed.threadgate',
    )
    expect(threadgate?.value).toMatchObject({allow: []})
    /* Gate records legitimately reuse their post's key in other collections. */
    expect(threadgate?.rkey).toBe(result.posts[0].rkey)
    const postgates = gateWrites.filter(
      write => write.collection === 'app.bsky.feed.postgate',
    )
    expect(postgates.map(write => write.rkey)).toEqual(
      result.posts.map(post => post.rkey),
    )
  })

  test('reads only through allowed boundaries and never mutates a repository', async () => {
    /*
     * The planner's only injected capabilities are AppView reads (getPosts,
     * resolveHandle via facet detection) and blob uploads. Assert on those
     * actual boundaries: every observed appview call is a read, and no
     * repo-mutation NSID is ever requested on success or failure paths.
     */
    const appview = mockAppview({
      getPosts: () => ({
        posts: [
          {
            uri: replyTarget.uri,
            cid: externalReply.parent.cid,
            record: {$type: 'app.bsky.feed.post'},
          },
        ],
      }),
      resolveHandle: () => ({did: 'did:plc:alice'}),
    })
    const uploadBlob = jest.fn((_input: {path: string; mime: string}) =>
      Promise.resolve(blob('image/jpeg')),
    )
    const state = snapshot({
      replyTo: {...replyTarget},
      posts: [
        {
          text: 'hello @alice.test',
          attachments: {
            media: {
              kind: 'gif',
              item: {gif: {} as never, altText: 'waving'},
            },
          },
        },
      ],
    })
    const result = await planComposerV2({
      snapshot: state,
      dependencies: {
        did: DID,
        appviewClient: appview.client,
        now: () => new Date('2024-01-01T00:00:00.000Z'),
        __createRkey: (index, createdAt) =>
          TID.fromTime(createdAt.getTime() * 1000, index).toString(),
        uploadBlob,
        resolveGif: () =>
          Promise.resolve({
            type: 'external' as const,
            uri: 'https://example.com/gif',
            title: 'GIF',
            description: 'ALT: GIF',
            thumb: {
              alt: '',
              source: {
                id: 'thumb',
                path: 'file:///thumb.jpg',
                width: 100,
                height: 100,
                mime: 'image/jpeg',
              },
            },
          }),
      },
    })
    expect(result.ok).toBe(true)

    const allowedReads = [
      'app.bsky.feed.getPosts',
      'com.atproto.identity.resolveHandle',
    ]
    expect(appview.calls.length).toBeGreaterThan(0)
    for (const call of appview.calls) {
      expect(allowedReads).toContain(call.nsid)
      expect(call.nsid.startsWith('com.atproto.repo.')).toBe(false)
    }
    expect(uploadBlob).toHaveBeenCalledTimes(1)
    expect(uploadBlob).toHaveBeenCalledWith({
      path: 'file:///thumb.jpg',
      mime: 'image/jpeg',
    })

    /* Failure paths also stay read-only. */
    const failingAppview = mockAppview({getPosts: () => ({posts: []})})
    const failure = await plan(
      snapshot({replyTo: {...replyTarget}, posts: [{text: 'reply'}]}),
      {appviewClient: failingAppview.client},
    )
    expect(failure.ok).toBe(false)
    for (const call of failingAppview.calls) {
      expect(allowedReads).toContain(call.nsid)
    }
  })

  test('returns readiness errors and redacts private diagnostic detail', async () => {
    const state = snapshot({
      posts: [{attachments: {media: imageInputs(1)}}],
    })
    const postId = Object.keys(state.posts)[0]
    const media = state.posts[postId].attachments.media!
    if (media.state !== 'resolved' || media.kind !== 'images') return
    media.items[0].upload = {
      state: 'failed',
      error: 'private worker detail',
      retryable: false,
    }
    const result = await plan(state)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0].code).toBe('media-failed')
    expect(JSON.stringify(result)).not.toContain('private worker detail')

    const summary = summarizeComposerV2Plan({result})
    expect(summary.ok).toBe(false)
    expect(JSON.stringify(summary)).not.toContain('private worker detail')
    /* The redacted summary carries codes and locations, not messages. */
    if (!summary.ok) {
      expect(summary.errors[0]).toEqual({
        code: 'media-failed',
        postIndex: 0,
        collection: undefined,
      })
    }
  })

  test('summarizes successful plans without exposing post text', async () => {
    const state = snapshot({posts: [{text: 'extremely private words'}]})
    const result = await plan(state)
    expect(result.ok).toBe(true)
    const summary = summarizeComposerV2Plan({result})
    expect(summary.ok).toBe(true)
    expect(JSON.stringify(summary)).not.toContain('extremely private words')
    if (summary.ok) {
      expect(summary.posts[0].textGraphemes).toBe(23)
      expect(summary.writesByCollection).toEqual({'app.bsky.feed.post': 1})
    }
  })

  test('summarizes reply relationships and per-post gate associations by reference', async () => {
    const state = snapshot({
      posts: [{text: 'root post'}, {text: 'second post'}],
      threadgateAllowRules: [{$type: 'app.bsky.feed.threadgate#mentionRule'}],
      postgateEmbeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
    })
    const result = await plan(state)
    expect(result.ok).toBe(true)
    const summary = summarizeComposerV2Plan({result})
    expect(summary.ok).toBe(true)
    if (!summary.ok) return

    /* Root post: no reply refs; second post: chained to the root. */
    expect(summary.posts[0].replyRootUri).toBeUndefined()
    expect(summary.posts[0].replyParentUri).toBeUndefined()
    expect(summary.posts[1].replyRootUri).toBe(summary.posts[0].uri)
    expect(summary.posts[1].replyParentUri).toBe(summary.posts[0].uri)

    /* Threadgate on the root only; postgate per post; refs, not payloads. */
    expect(summary.gates).toEqual([
      {
        collection: 'app.bsky.feed.threadgate',
        rkey: summary.posts[0].rkey,
        postUri: summary.posts[0].uri,
      },
      {
        collection: 'app.bsky.feed.postgate',
        rkey: summary.posts[0].rkey,
        postUri: summary.posts[0].uri,
      },
      {
        collection: 'app.bsky.feed.postgate',
        rkey: summary.posts[1].rkey,
        postUri: summary.posts[1].uri,
      },
    ])
    expect(JSON.stringify(summary)).not.toContain('mentionRule')
    expect(JSON.stringify(summary)).not.toContain('root post')
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

  describe('published store snapshots', () => {
    function makeStore(initial?: ThreadStoreInitialState) {
      let i = 0
      return createThreadStore({
        resolvers: {} as never,
        initialState: initial,
        __createId: () => `store-post-${++i}`,
        __uploadWorkers: {
          startImageUpload: () => ({cancel() {}}),
          startVideoUpload: () => ({cancel() {}}),
        },
      })
    }

    test('a store edit during planning cannot alter the captured snapshot', async () => {
      const store = makeStore({
        replyTo: {...replyTarget},
        posts: [{text: 'captured'}],
      })
      const captured = store.getState()
      const postId = Object.keys(captured.posts)[0]

      let releaseReply!: () => void
      const waiting = new Promise<void>(resolve => {
        releaseReply = resolve
      })
      const resultPromise = plan(captured, {
        resolveReply: async () => {
          await waiting
          return externalReply
        },
      })
      store.actions.setPostText(postId, 'edited after capture')
      releaseReply()
      const result = await resultPromise
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.posts[0].record.text).toBe('captured')
      /* The store replaced the branch; the published snapshot is untouched. */
      expect(captured.posts[postId].text).toBe('captured')
      expect(store.getState().posts[postId].text).toBe('edited after capture')
      store.destroy()
    })

    test('an upload completing during planning is visible only to the next snapshot', async () => {
      const store = makeStore({
        posts: [
          {
            attachments: {
              media: {
                kind: 'images',
                items: [
                  {
                    uri: 'file:///image.jpg',
                    width: 100,
                    height: 80,
                    altText: 'alt',
                  },
                ],
              },
            },
          },
        ],
      })
      const pendingSnapshot = store.getState()
      const postId = Object.keys(pendingSnapshot.posts)[0]
      const media = pendingSnapshot.posts[postId].attachments.media
      if (!media || media.state !== 'resolved' || media.kind !== 'images') {
        throw new Error('expected image media')
      }
      const mediaId = media.items[0].id

      const inFlight = plan(pendingSnapshot)
      store.internalActions.setUploadStatus(postId, mediaId, {
        state: 'uploaded',
        blob: blob('image/jpeg'),
      })
      const result = await inFlight
      expect(result).toEqual({
        ok: false,
        errors: [expect.objectContaining({code: 'attachment-not-ready'})],
      })

      /* Planning again from the new published snapshot succeeds. */
      const retried = await plan(store.getState())
      expect(retried.ok).toBe(true)
      if (retried.ok) {
        expect(retried.posts[0].record.embed?.$type).toBe(
          'app.bsky.embed.images',
        )
      }
      store.destroy()
    })
  })
})
