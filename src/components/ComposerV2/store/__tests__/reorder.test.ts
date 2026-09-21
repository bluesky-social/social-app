import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {
  type LinkResolvers,
  type ResolvedLink,
  type resolveLink,
} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type ThreadStoreInitialState,
  type UploadStatus,
} from '#/components/ComposerV2/store/types'
import {type UploadWorkerOverrides} from '#/components/ComposerV2/store/uploads'

const resolvers = {} as LinkResolvers
const postUri = 'https://bsky.app/profile/example.com/post/abc'
const recordLink = {
  type: 'record',
  kind: 'post',
  record: {
    uri: 'at://did:plc:example/app.bsky.feed.post/abc',
    cid: 'cid-1',
  },
  view: undefined,
} as unknown as ResolvedLink

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

function makeStore(initialState?: ThreadStoreInitialState) {
  return createThreadStore({
    resolvers,
    initialState: initialState ?? {
      posts: [{}, {}, {}],
    },
    __createId: makeIdGenerator(),
  })
}

describe('movePost', () => {
  test('moves posts to arbitrary final indexes', () => {
    const store = makeStore()
    const before = store.getState()
    const postRefs = Object.values(before.posts)
    const notify = jest.fn()
    store.subscribe(notify)

    expect(store.actions.movePost('id-1', 1)).toEqual({
      movedPostId: 'id-1',
    })
    expect(Object.keys(store.getState().posts)).toEqual([
      'id-2',
      'id-1',
      'id-3',
    ])
    expect(store.getState().posts['id-1']).toBe(postRefs[0])
    expect(store.getState().posts['id-2']).toBe(postRefs[1])
    expect(store.getState().posts['id-3']).toBe(postRefs[2])

    expect(store.actions.movePost('id-1', 2)).toEqual({
      movedPostId: 'id-1',
    })
    expect(Object.keys(store.getState().posts)).toEqual([
      'id-2',
      'id-3',
      'id-1',
    ])

    expect(store.actions.movePost('id-1', 1)).toEqual({
      movedPostId: 'id-1',
    })
    expect(Object.keys(store.getState().posts)).toEqual([
      'id-2',
      'id-1',
      'id-3',
    ])

    expect(store.actions.movePost('id-1', 0)).toEqual({
      movedPostId: 'id-1',
    })
    expect(Object.keys(store.getState().posts)).toEqual([
      'id-1',
      'id-2',
      'id-3',
    ])
    expect(notify).toHaveBeenCalledTimes(4)
    expect(store.getState().isDirty).toBe(true)
  })

  test('preserves identity and avoids notification for same-position and invalid moves', () => {
    const store = makeStore()
    const before = store.getState()
    const notify = jest.fn()
    store.subscribe(notify)

    expect(store.actions.movePost('id-1', 0)).toBeUndefined()
    expect(store.actions.movePost('id-2', 1)).toBeUndefined()
    expect(store.actions.movePost('id-3', 2)).toBeUndefined()
    expect(store.actions.movePost('missing', 1)).toBeUndefined()
    expect(store.actions.movePost('id-2', -1)).toBeUndefined()
    expect(store.actions.movePost('id-2', 3)).toBeUndefined()
    expect(store.actions.movePost('id-2', 1.5)).toBeUndefined()

    expect(store.getState()).toBe(before)
    expect(notify).not.toHaveBeenCalled()
    expect(store.getState().isDirty).toBe(false)
  })

  test('does not publish or notify after destruction', () => {
    const store = makeStore()
    const before = store.getState()
    const notify = jest.fn()
    store.subscribe(notify)
    store.destroy()

    expect(store.actions.movePost('id-2', 0)).toBeUndefined()
    expect(store.getState()).toBe(before)
    expect(notify).not.toHaveBeenCalled()
  })
})

describe('movePost async ownership', () => {
  test('keeps mixed attachment ownership addressable after a move', async () => {
    let resolveResolvedLink!: (link: ResolvedLink) => void
    const linkPromise = new Promise<ResolvedLink>(resolve => {
      resolveResolvedLink = resolve
    })
    const mockResolveLink = jest.fn<typeof resolveLink>()
    mockResolveLink.mockReturnValue(linkPromise)

    type ImageOptions = Parameters<
      NonNullable<UploadWorkerOverrides['startImageUpload']>
    >[0]
    let imageOptions!: ImageOptions
    const cancel = jest.fn()
    const startImageUpload = jest.fn((options: ImageOptions) => {
      imageOptions = options
      return {cancel}
    })

    const store = createThreadStore({
      resolvers,
      initialState: {
        posts: [
          {
            text: 'image post',
            attachments: {
              media: {
                kind: 'images',
                items: [{uri: 'file:///image.jpg', width: 100, height: 80}],
              },
            },
          },
          {
            text: 'record post',
            attachments: {record: {kind: 'uri', uri: postUri}},
          },
          {text: 'third post'},
        ],
      },
      __createId: makeIdGenerator(),
      __resolveLink: mockResolveLink,
      __uploadWorkers: {startImageUpload},
    })
    const [imagePostId, recordPostId, thirdPostId] = Object.keys(
      store.getState().posts,
    )
    const before = store.getState()
    const imagePost = before.posts[imagePostId]
    const recordPost = before.posts[recordPostId]
    const media = imagePost.attachments.media
    if (media?.state !== 'resolved' || media.kind !== 'images') {
      throw new Error('expected initial image attachment')
    }
    const mediaItem = media.items[0]

    expect(store.actions.movePost(imagePostId, 1)).toEqual({
      movedPostId: imagePostId,
    })
    expect(Object.keys(store.getState().posts)).toEqual([
      recordPostId,
      imagePostId,
      thirdPostId,
    ])
    expect(store.getState().posts[imagePostId]).toBe(imagePost)
    expect(store.getState().posts[recordPostId]).toBe(recordPost)
    expect(store.getState().posts[imagePostId].attachments.media).toBe(media)
    expect(media.items[0]).toBe(mediaItem)
    expect(startImageUpload).toHaveBeenCalledTimes(1)
    expect(cancel).not.toHaveBeenCalled()

    const blob = {
      $type: 'blob',
      ref: {$link: 'uploaded-image'},
      mimeType: 'image/jpeg',
      size: 1,
    } as never
    const uploaded: UploadStatus = {state: 'uploaded', blob}
    imageOptions.setUploadStatus(imagePostId, mediaItem.id, uploaded)
    expect(store.getState().posts[imagePostId].attachments.media).toMatchObject(
      {
        kind: 'images',
        items: [{id: mediaItem.id, upload: uploaded}],
      },
    )

    resolveResolvedLink(recordLink)
    await linkPromise
    await Promise.resolve()
    expect(
      store.getState().posts[recordPostId].attachments.record,
    ).toMatchObject({
      state: 'resolved',
      kind: 'post',
    })
    expect(Object.keys(store.getState().posts)).toEqual([
      recordPostId,
      imagePostId,
      thirdPostId,
    ])
    store.destroy()
  })
})
