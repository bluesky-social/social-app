import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {
  EmbeddingDisabledError,
  type LinkResolvers,
  type ResolvedLink,
  type resolveLink,
} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type MediaCardValue,
  type PostMediaImageInput,
  type PostMediaVideoInput,
  type RecordAttachmentValue,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {type Gif} from '#/features/gifPicker/types'
import {type app} from '#/lexicons'
import {simulatedUploadWorkers} from './uploadTestUtils'

const POST_URL = 'https://bsky.app/profile/test.bsky.social/post/abc'
const EXTERNAL_URL = 'https://example.com'
const ref = {
  uri: 'at://did:plc:example/app.bsky.feed.post/abc',
  cid: 'cid',
} as const
const postView = {...ref} as unknown as app.bsky.feed.defs.PostView
const record: RecordAttachmentValue = {
  kind: 'post',
  record: ref,
  view: postView,
}
const image: PostMediaImageInput = {
  uri: 'file:///draft.jpg',
  width: 120,
  height: 80,
  altText: 'photo',
  localRefPath: 'image:original',
}
const video: PostMediaVideoInput = {
  uri: 'file:///draft.mp4',
  width: 1920,
  height: 1080,
  mimeType: 'video/mp4',
  altText: 'video',
  localRefPath: 'video:original',
  captions: [{lang: 'en', content: 'WEBVTT\n'}],
}
const gif = {url: 'https://example.com/gif'} as Gif
const cards: MediaCardValue[] = [
  {
    kind: 'external',
    uri: EXTERNAL_URL,
    title: 'Example',
    description: 'Description',
    thumb: undefined,
    associatedRefs: [ref],
  },
  {
    kind: 'chat-invite',
    uri: 'https://bsky.app/chat/abc1234',
    code: 'abc1234',
    view: undefined,
  },
]
const postLink: ResolvedLink = {
  type: 'record',
  kind: 'post',
  record: ref,
  view: postView,
}
const externalLink: ResolvedLink = {
  type: 'external',
  uri: EXTERNAL_URL,
  title: 'Example',
  description: '',
  thumb: undefined,
}

let mockResolveLink: jest.Mock<typeof resolveLink>

beforeEach(() => {
  jest.useFakeTimers()
  mockResolveLink = jest.fn<typeof resolveLink>()
})
afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

function makeStore(initialState?: ThreadStoreInitialState) {
  let id = 0
  return createThreadStore({
    initialState,
    resolvers: {} as LinkResolvers,
    __resolveLink: mockResolveLink,
    __createId: () => `id-${++id}`,
    __uploadWorkers: simulatedUploadWorkers,
  })
}

function root(store: ReturnType<typeof makeStore>) {
  const state = store.getState()
  const id = Object.keys(state.posts)[0]
  return {id, post: state.posts[id]}
}

function deferred() {
  let resolve!: (value: ResolvedLink) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<ResolvedLink>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

describe('normalized initial state', () => {
  test.each([undefined, {}, {posts: []}])(
    'defaults to one clean empty post: %p',
    input => {
      const store = makeStore(input)
      expect(Object.keys(store.getState().posts)).toEqual(['id-1'])
      expect(root(store).post).toEqual({
        text: '',
        langs: [],
        labels: [],
        attachments: {record: undefined, media: undefined},
        imageSelectionsRemaining: 10,
        videoSelectionsRemaining: 1,
        gifSelectionsRemaining: 1,
      })
      expect(store.getState().isDirty).toBe(false)
      expect(store.getState().draftId).toBeUndefined()
      expect(mockResolveLink).not.toHaveBeenCalled()
      expect(jest.getTimerCount()).toBe(0)
    },
  )

  test('builds all posts in input order without altering text or resolving text URLs', () => {
    const input = {
      draftId: 'draft-1',
      posts: [
        {
          text: '  Hello 👩🏽‍🍳 https://example.com\n',
          langs: ['en'],
          labels: ['sexual'],
        },
        {text: 'Second post'},
        {},
      ],
    } satisfies ThreadStoreInitialState
    const store = makeStore(input)
    expect(Object.keys(store.getState().posts)).toEqual([
      'id-1',
      'id-2',
      'id-3',
    ])
    expect(
      Object.values(store.getState().posts).map(post => post.text),
    ).toEqual([input.posts[0].text, 'Second post', ''])
    expect(root(store).post.langs).toEqual(['en'])
    expect(root(store).post.labels).toEqual(['sexual'])
    expect(store.getState().draftId).toBe('draft-1')
    expect(store.getState().isDirty).toBe(false)
    expect(mockResolveLink).not.toHaveBeenCalled()
    expect(store.getState()).toBe(store.getState())
    store.actions.setPostText('id-2', 'Edited')
    expect(store.getState().isDirty).toBe(true)
  })

  test('can explicitly initialize an unsaved composition', () => {
    const store = makeStore({isDirty: true, posts: [{text: 'Unsaved'}]})
    expect(store.getState().isDirty).toBe(true)
  })

  test('copies editable data and preserves caller-owned snapshots', () => {
    const langs = ['en']
    const labels = ['sexual']
    const captions = [{lang: 'en', content: 'WEBVTT\n'}]
    const input: ThreadStoreInitialState = {
      posts: [
        {
          text: 'Initial',
          langs,
          labels,
          attachments: {
            record,
            media: {kind: 'video', item: {...video, captions}},
          },
        },
      ],
    }
    const store = makeStore(input)
    const {id, post} = root(store)
    const media = post.attachments.media
    if (media?.state !== 'resolved' || media.kind !== 'video')
      throw new Error('expected video')
    expect(post.langs).not.toBe(langs)
    expect(post.labels).not.toBe(labels)
    expect(media.item.captions).not.toBe(captions)
    expect(media.item.captions[0]).not.toBe(captions[0])
    langs.push('fr')
    labels.push('nudity')
    captions[0].content = 'changed'
    expect(post.langs).toEqual(['en'])
    expect(post.labels).toEqual(['sexual'])
    expect(media.item.captions[0].content).toBe('WEBVTT\n')
    store.actions.updateMediaAltText(id, media.item.id, 'Edited')
    expect(media.item.altText).toBe('video')
    expect(video.altText).toBe('video')
    store.destroy()
  })

  test.each(['post', 'feed', 'list', 'starter-pack'] as const)(
    'hydrates a known %s ref without lookup',
    kind => {
      const store = makeStore({
        posts: [{attachments: {record: {kind, record: ref}}}],
      })
      expect(root(store).post.attachments.record).toEqual({
        state: 'resolved',
        kind,
        record: ref,
      })
      expect(root(store).post.imageSelectionsRemaining).toBe(10)
      expect(mockResolveLink).not.toHaveBeenCalled()
    },
  )

  test('keeps a supplied record view and card without refetching', () => {
    const store = makeStore({posts: [{attachments: {record, media: cards[0]}}]})
    const attachments = root(store).post.attachments
    expect(attachments.record).toEqual({state: 'resolved', ...record})
    if (attachments.record?.state !== 'resolved')
      throw new Error('expected resolved record')
    expect(attachments.record.view).toBe(postView)
    expect(attachments.record.record).not.toBe(ref)
    expect(attachments.media).toEqual({state: 'resolved', ...cards[0]})
    expect(mockResolveLink).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
  })

  test.each(cards)(
    'hydrates $kind in the media slot and blocks competing media',
    card => {
      const store = makeStore({posts: [{attachments: {media: card}}]})
      const {id, post} = root(store)
      expect(post.attachments.media).toEqual({state: 'resolved', ...card})
      expect(post.imageSelectionsRemaining).toBe(0)
      expect(store.actions.addMedia(id, [{...image, kind: 'image'}])).toEqual({
        addedMediaIds: [],
      })
      expect(mockResolveLink).not.toHaveBeenCalled()
      expect(jest.getTimerCount()).toBe(0)
    },
  )
})

describe('initial media and eager uploads', () => {
  test.each([0, 4, 5, 10])(
    'initializes %i images with correct capacity and uploads only accepted items',
    count => {
      const inputs = Array.from({length: count}, (_, i) => ({
        ...image,
        uri: `file:///image-${i}.jpg`,
      }))
      const store = makeStore({
        posts: [
          {attachments: {record, media: {kind: 'images', items: inputs}}},
        ],
      })
      const {id, post} = root(store)
      expect(store.getState().isDirty).toBe(false)
      expect(post.imageSelectionsRemaining).toBe(10 - count)
      expect(post.videoSelectionsRemaining).toBe(count ? 0 : 1)
      expect(post.gifSelectionsRemaining).toBe(count ? 0 : 1)
      expect(jest.getTimerCount()).toBe(count)
      const media = post.attachments.media
      if (count === 0) {
        expect(media).toBeUndefined()
        return
      }
      if (media?.state !== 'resolved' || media.kind !== 'images')
        throw new Error('expected images')
      expect(media.items.map(item => item.uri)).toEqual(
        inputs.map(item => item.uri),
      )
      expect(new Set(media.items.map(item => item.id)).size).toBe(count)
      expect(
        media.items.every(
          item => item.postId === id && item.upload.state === 'pending',
        ),
      ).toBe(true)
      expect(media.items[0].localRefPath).toBe(image.localRefPath)
      expect(media.items[0].altText).toBe(image.altText)
      const notify = jest.fn()
      store.subscribe(notify)
      expect(notify).not.toHaveBeenCalled()
      jest.runAllTimers()
      const after = root(store).post.attachments.media
      if (after?.state !== 'resolved' || after.kind !== 'images')
        throw new Error('expected images')
      expect(after.items.every(item => item.upload.state === 'uploaded')).toBe(
        true,
      )
      expect(store.getState().isDirty).toBe(false)
      expect(post.attachments.record).toBe(root(store).post.attachments.record)
      expect(media.items[0].upload.state).toBe('pending')
    },
  )

  test('rejects oversized initial images before starting any work, without dropping input', () => {
    const input: ThreadStoreInitialState = {
      posts: [
        {
          attachments: {
            media: {kind: 'video', item: video},
            record: {kind: 'uri', uri: POST_URL},
          },
        },
        {
          attachments: {
            media: {
              kind: 'images',
              items: Array.from({length: 11}, () => image),
            },
          },
        },
      ],
    }
    expect(() => makeStore(input)).toThrow(RangeError)
    expect(mockResolveLink).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
  })

  test('preserves video local refs, captions and alt text across upload/retry', () => {
    const store = makeStore({
      draftId: 'draft-video',
      posts: [{attachments: {media: {kind: 'video', item: video}}}],
    })
    const {id, post} = root(store)
    const media = post.attachments.media
    if (media?.state !== 'resolved' || media.kind !== 'video')
      throw new Error('expected video')
    expect(media.item).toMatchObject({
      ...video,
      postId: id,
      upload: {state: 'pending'},
    })
    store.actions.setUploadStatus(id, media.item.id, {
      state: 'failed',
      error: 'network',
    })
    const failed = root(store).post.attachments.media
    if (
      failed?.state !== 'resolved' ||
      failed.kind !== 'video' ||
      failed.item.upload.state !== 'failed'
    )
      throw new Error('expected failed upload')
    failed.item.upload.retry()
    jest.runAllTimers()
    const after = root(store).post.attachments.media
    if (after?.state !== 'resolved' || after.kind !== 'video')
      throw new Error('expected video')
    expect(after.item).toMatchObject({...video, upload: {state: 'uploaded'}})
    expect(store.getState().draftId).toBe('draft-video')
    expect(store.getState().isDirty).toBe(false)
  })

  test('never imports item identity, upload status, or retry callbacks from a source object', () => {
    const staleSource = {
      ...image,
      id: 'old-item',
      postId: 'old-post',
      upload: {state: 'failed', error: 'old failure', retry: jest.fn()},
    }
    const store = makeStore({
      posts: [{attachments: {media: {kind: 'images', items: [staleSource]}}}],
    })
    const {id, post} = root(store)
    const media = post.attachments.media
    if (media?.state !== 'resolved' || media.kind !== 'images')
      throw new Error('expected images')
    expect(media.items[0].id).not.toBe(staleSource.id)
    expect(media.items[0].postId).toBe(id)
    expect(media.items[0].upload).toEqual({state: 'pending'})
    expect(staleSource.upload.retry).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(1)
  })

  test('GIFs have fresh item identity but no upload lifecycle', () => {
    const store = makeStore({
      posts: [
        {attachments: {media: {kind: 'gif', item: {gif, altText: 'Animated'}}}},
      ],
    })
    const {id, post} = root(store)
    expect(post.attachments.media).toEqual({
      state: 'resolved',
      kind: 'gif',
      item: {id: 'id-2', postId: id, kind: 'gif', gif, altText: 'Animated'},
    })
    expect(post.imageSelectionsRemaining).toBe(0)
    expect(jest.getTimerCount()).toBe(0)
  })

  test('assigns every initial item to its own post and cancels removed work', () => {
    const store = makeStore({
      posts: [
        {
          text: 'Images',
          attachments: {media: {kind: 'images', items: [image, image]}},
        },
        {text: 'Video', attachments: {media: {kind: 'video', item: video}}},
      ],
    })
    const postIds = Object.keys(store.getState().posts)
    expect(postIds).toEqual(['id-1', 'id-4'])
    const second = store.getState().posts[postIds[1]].attachments.media
    if (second?.state !== 'resolved' || second.kind !== 'video')
      throw new Error('expected video')
    expect(second.item.postId).toBe(postIds[1])
    store.actions.removePost(postIds[0])
    expect(jest.getTimerCount()).toBe(1)
    store.destroy()
    const before = store.getState()
    expect(jest.getTimerCount()).toBe(0)
    jest.runAllTimers()
    expect(store.getState()).toBe(before)
  })

  test('each store starts an independent lifecycle when given the same input', () => {
    const input: ThreadStoreInitialState = {
      posts: [{attachments: {media: {kind: 'images', items: [image]}}}],
    }
    const first = makeStore(input)
    const second = makeStore(input)
    expect(first.getState()).not.toBe(second.getState())
    expect(root(first).post.attachments.media).not.toBe(
      root(second).post.attachments.media,
    )
    first.actions.removeMediaAttachment(root(first).id)
    expect(root(second).post.attachments.media).toBeDefined()
    expect(jest.getTimerCount()).toBe(1)
    first.destroy()
    second.destroy()
  })
})

describe('initial URI resolution', () => {
  test('publishes both reserved slots before resolving them without dirtying state', async () => {
    const pendingRecord = deferred()
    const pendingMedia = deferred()
    mockResolveLink
      .mockReturnValueOnce(pendingRecord.promise)
      .mockReturnValueOnce(pendingMedia.promise)
    const store = makeStore({
      draftId: 'draft-1',
      posts: [
        {
          attachments: {
            record: {kind: 'uri', uri: POST_URL},
            media: {kind: 'uri', uri: EXTERNAL_URL},
          },
        },
      ],
    })
    const before = store.getState()
    expect(root(store).post.attachments).toEqual({
      record: {state: 'pending', uri: POST_URL},
      media: {state: 'pending', uri: EXTERNAL_URL},
    })
    expect(root(store).post.imageSelectionsRemaining).toBe(0)
    expect(mockResolveLink).toHaveBeenCalledTimes(2)
    pendingRecord.resolve(postLink)
    pendingMedia.resolve(externalLink)
    await Promise.all([pendingRecord.promise, pendingMedia.promise])
    expect(root(store).post.attachments.record?.state).toBe('resolved')
    expect(root(store).post.attachments.media?.state).toBe('resolved')
    expect(store.getState().isDirty).toBe(false)
    expect(store.getState().draftId).toBe('draft-1')
    expect(Object.values(before.posts)[0].attachments.record?.state).toBe(
      'pending',
    )
  })

  test('initial resolution shares retry policy without turning retries into user edits', async () => {
    mockResolveLink
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(externalLink)
    const store = makeStore({
      posts: [{attachments: {media: {kind: 'uri', uri: EXTERNAL_URL}}}],
    })
    await Promise.resolve()
    const failed = root(store).post.attachments.media
    if (failed?.state !== 'failed') throw new Error('expected failure')
    expect(failed.retry).toEqual(expect.any(Function))
    expect(store.getState().isDirty).toBe(false)
    failed.retry?.()
    await Promise.resolve()
    expect(root(store).post.attachments.media?.state).toBe('resolved')
    expect(store.getState().isDirty).toBe(false)
  })

  test('retries retain the normalized slot even when the URI cannot be pre-classified', async () => {
    const uri = 'https://short.example/post'
    mockResolveLink
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(postLink)
    const store = makeStore({
      posts: [
        {
          attachments: {
            record: {kind: 'uri', uri},
            media: {kind: 'images', items: [image]},
          },
        },
      ],
    })
    await Promise.resolve()
    const failed = root(store).post.attachments.record
    if (failed?.state !== 'failed') throw new Error('expected failure')
    const media = root(store).post.attachments.media
    failed.retry?.()
    await Promise.resolve()
    expect(root(store).post.attachments.record).toMatchObject({
      state: 'resolved',
      kind: 'post',
    })
    expect(root(store).post.attachments.media).toBe(media)
    expect(store.getState().isDirty).toBe(false)
    expect(mockResolveLink).toHaveBeenLastCalledWith(expect.anything(), uri)
  })

  test('embedding-disabled remains non-retryable on initial resolution', async () => {
    mockResolveLink.mockRejectedValue(new EmbeddingDisabledError())
    const store = makeStore({
      posts: [{attachments: {record: {kind: 'uri', uri: POST_URL}}}],
    })
    await Promise.resolve()
    expect(root(store).post.attachments.record).toMatchObject({
      state: 'failed',
      code: 'embedding-disabled',
      retry: undefined,
    })
    expect(store.getState().isDirty).toBe(false)
  })

  test('an initial URI can be superseded without its old result winning', async () => {
    const first = deferred()
    mockResolveLink
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(externalLink)
    const store = makeStore({
      posts: [
        {attachments: {media: {kind: 'uri', uri: 'https://old.example'}}},
      ],
    })
    store.actions.addUri(root(store).id, EXTERNAL_URL)
    await Promise.resolve()
    const current = store.getState()
    first.resolve({...externalLink, uri: 'https://old.example'})
    await first.promise
    expect(store.getState()).toBe(current)
    expect(current.isDirty).toBe(true)
  })

  test.each(['remove', 'destroy'])(
    '%s invalidates initial work',
    async action => {
      const first = deferred()
      mockResolveLink.mockReturnValue(first.promise)
      const store = makeStore({
        posts: [{attachments: {record: {kind: 'uri', uri: POST_URL}}}],
      })
      if (action === 'remove')
        store.actions.removeRecordAttachment(root(store).id)
      else store.destroy()
      const before = store.getState()
      first.resolve(postLink)
      await first.promise
      expect(store.getState()).toBe(before)
    },
  )
})
