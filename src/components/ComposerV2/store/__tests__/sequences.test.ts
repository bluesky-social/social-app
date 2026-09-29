import {type BlobRef} from '@atproto/lex'
import {describe, expect, jest, test} from '@jest/globals'

jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {type LinkResolvers, type ResolvedLink} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type AddMediaInput,
  type MediaAttachment,
  type PostMediaItem,
  type ThreadState,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {manualUploadWorkers, testUploadRuntime} from './uploadTestUtils'

const image = {
  kind: 'image' as const,
  uri: 'file:///image.jpg',
  width: 100,
  height: 80,
}
const video = {
  kind: 'video' as const,
  uri: 'file:///video.mp4',
  width: 100,
  height: 80,
  mimeType: 'video/mp4',
}
const gif: AddMediaInput = {
  kind: 'gif',
  gif: {url: 'https://example.test/gif'} as never,
}
const recordUri = 'https://bsky.app/profile/example.test/post/one'
const mediaUri = 'https://example.test/card'
const record: ResolvedLink & {type: 'record'} = {
  type: 'record',
  kind: 'post',
  record: {
    uri: 'at://did:plc:example/app.bsky.feed.post/one',
    cid: 'record-cid',
  },
  view: {
    uri: 'at://did:plc:example/app.bsky.feed.post/one',
    cid: 'record-cid',
    author: {did: 'did:plc:example', handle: 'example.test'},
    record: {},
    indexedAt: '2026-01-01T00:00:00.000Z',
  },
}
const blob = (name: string) =>
  ({
    $type: 'blob',
    ref: {$link: name},
    mimeType: 'application/octet-stream',
    size: 1,
  }) as unknown as BlobRef

type Attempt = ReturnType<typeof manualUploadWorkers>['attempts'][number]

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

function makeStore(initialState: ThreadStoreInitialState) {
  let id = 0
  const {attempts, workers} = manualUploadWorkers()
  const requests: Array<
    ReturnType<typeof deferred<ResolvedLink>> & {uri: string; settled: boolean}
  > = []
  const store = createThreadStore({
    ...testUploadRuntime,
    resolvers: {} as LinkResolvers,
    initialState,
    __createId: () => `id-${++id}`,
    __uploadWorkers: workers,
    __resolveLink: (_resolvers, uri) => {
      const request = {...deferred<ResolvedLink>(), uri, settled: false}
      requests.push(request)
      return request.promise
    },
  })
  return {store, attempts, requests}
}

/** Inspect the raw attachment, without sharing the production filtering helper. */
function items(media: MediaAttachment | undefined): PostMediaItem[] {
  if (media?.state !== 'resolved') return []
  return media.kind === 'images'
    ? media.items
    : media.kind === 'video' || media.kind === 'gif'
      ? [media.item]
      : []
}

/** Fixtures are plain data; functions are retained so retries are checked too. */
function copy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(copy)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, copy(entry)]),
    )
  }
  return value
}

function assertInvariants(state: ThreadState) {
  expect(Object.keys(state.posts).length).toBeGreaterThan(0)
  const ids = new Set<string>(Object.keys(state.posts))
  for (const [postId, post] of Object.entries(state.posts)) {
    const {record: quote, media} = post.attachments
    if (quote?.state === 'resolved')
      expect(['post', 'feed', 'list', 'starter-pack']).toContain(quote.kind)
    let capacity = [10, 1, 1]
    if (media) {
      capacity = [0, 0, 0]
      if (media.state === 'resolved') {
        expect(['images', 'video', 'gif', 'external', 'chat-invite']).toContain(
          media.kind,
        )
        if (media.kind === 'images') {
          expect(media.items.length).toBeGreaterThan(0)
          expect(media.items.length).toBeLessThanOrEqual(10)
          expect(media.items.every(item => item.kind === 'image')).toBe(true)
          capacity = [10 - media.items.length, 0, 0]
        } else if (media.kind === 'video' || media.kind === 'gif') {
          expect(media.item.kind).toBe(media.kind)
        }
      }
    }
    expect([
      post.imageSelectionsRemaining,
      post.videoSelectionsRemaining,
      post.gifSelectionsRemaining,
    ]).toEqual(capacity)
    for (const item of items(media)) {
      expect(ids.has(item.id)).toBe(false)
      ids.add(item.id)
      expect(item.postId).toBe(postId)
      if (item.kind !== 'gif' && item.upload.state === 'failed') {
        if (item.upload.retryable)
          expect(item.upload.retry).toEqual(expect.any(Function))
        else {
          expect(item.upload.retryable).toBe(false)
          expect(Object.hasOwn(item.upload, 'retry')).toBe(false)
        }
      }
      if (item.kind === 'video') {
        expect(
          new Set(item.captionBlobs.map(caption => caption.lang)).size,
        ).toBe(item.captionBlobs.length)
        for (const caption of item.captionBlobs) {
          expect(item.captions.some(input => input.lang === caption.lang)).toBe(
            true,
          )
        }
      }
    }
  }
}

/** Exercise every guarded callback even when the worker ignores cancellation. */
function lateCallbacks(attempt: Attempt) {
  const {postId, mediaId} = attempt
  return [
    () => attempt.report({state: 'uploading', progress: 0.9}),
    () => attempt.report({state: 'failed', error: 'late failure'}),
    () => attempt.report({state: 'uploaded', blob: blob('late')}),
    () =>
      attempt.setPrepared?.(postId, mediaId, {
        kind: attempt.media.kind,
        uri: 'file:///late',
        size: 1,
        mimeType: 'application/octet-stream',
        width: 1,
        height: 1,
        aspectRatio: {width: 1, height: 1},
      }),
    () =>
      attempt.setCaptionBlobs?.(postId, mediaId, [
        {lang: 'en', blob: blob('late-caption')},
      ]),
  ]
}

describe.each([image, video])('stale $kind worker ownership', input => {
  test.each([
    'retry',
    'bulk-retry',
    'remove',
    'clear',
    'replace',
    'remove-post',
    'complete',
    'destroy',
    ...(input.kind === 'video' ? ['edit-captions'] : []),
  ])('ignores all callbacks after %s', transition => {
    const {store, attempts} = makeStore({
      posts: [
        {},
        {
          attachments: {
            media:
              input.kind === 'image'
                ? {kind: 'images', items: [input]}
                : {kind: 'video', item: input},
          },
        },
      ],
    })
    const old = attempts[0]
    const {postId, mediaId} = old
    old.report({state: 'uploading', progress: 0.2})
    if (transition === 'retry' || transition === 'bulk-retry') {
      old.report({state: 'failed', error: 'retry me'})
      if (transition === 'retry')
        store.actions.retryMediaUpload(postId, mediaId)
      else store.actions.retryAllFailedUploads()
      expect(attempts).toHaveLength(2)
      expect(store.getState().isDirty).toBe(false)
    } else if (transition === 'edit-captions')
      store.actions.setVideoCaptions(postId, mediaId, [
        {lang: 'en', content: 'edited'},
      ])
    else if (transition === 'remove') store.actions.removeMedia(postId, mediaId)
    else if (transition === 'remove-post') store.actions.removePost(postId)
    else if (transition === 'destroy') store.destroy()
    else if (transition === 'complete')
      old.report({state: 'uploaded', blob: blob('current')})
    else {
      store.actions.removeMediaAttachment(postId)
      if (transition === 'replace') store.actions.addMedia(postId, [input])
    }
    if (transition !== 'complete') expect(old.cancel).toHaveBeenCalledTimes(1)
    const before = store.getState()
    const starts = attempts.length
    const notify = jest.fn()
    store.subscribe(notify)
    for (const callback of lateCallbacks(old)) {
      callback()
      expect(store.getState()).toBe(before)
      expect(notify).not.toHaveBeenCalled()
      expect(attempts).toHaveLength(starts)
    }
    assertInvariants(before)
    store.destroy()
  })
})

/** A fixed integer generator keeps failures reproducible without a dependency. */
function random(seed: number) {
  let value = seed >>> 0
  return (length: number) => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return Math.floor((value / 0x100000000) * length)
  }
}

test.each([7, 42, 2025, 0xc0ffee])(
  'mixed action sequences preserve invariants (seed %i)',
  async seed => {
    const choose = random(seed)
    const {store, attempts, requests} = makeStore({
      posts: [
        {attachments: {media: {kind: 'images', items: [image]}}},
        {
          attachments: {
            media: {
              kind: 'video',
              item: {...video, captions: [{lang: 'en', content: 'original'}]},
            },
          },
        },
        {
          attachments: {
            record: {kind: 'uri', uri: recordUri},
            media: {kind: 'uri', uri: mediaUri},
          },
        },
      ],
    })
    let order = Object.keys(store.getState().posts)
    const history: Array<{snapshot: ThreadState; value: unknown}> = []
    const capture = () => {
      const snapshot = store.getState()
      history.push({snapshot, value: copy(snapshot)})
    }
    capture()
    store.subscribe(capture)
    const owners = new Map<string, string>()
    const retired = new Set<string>()
    let previousIds = new Set<string>()
    const trace: string[] = []
    const check = () => {
      const state = store.getState()
      assertInvariants(state)
      expect(Object.keys(state.posts)).toEqual(order)
      const live = new Set<string>()
      for (const [postId, post] of Object.entries(state.posts)) {
        for (const item of items(post.attachments.media)) {
          expect(retired.has(item.id)).toBe(false)
          if (owners.has(item.id)) expect(owners.get(item.id)).toBe(postId)
          owners.set(item.id, postId)
          live.add(item.id)
        }
      }
      for (const id of previousIds) if (!live.has(id)) retired.add(id)
      previousIds = live
      for (const {snapshot, value} of history)
        expect(snapshot).toStrictEqual(value)
    }
    const step = async (label: string, action: () => void | Promise<void>) => {
      trace.push(label)
      await action()
      check()
    }
    const settle = async (
      request: (typeof requests)[number],
      fail: boolean,
    ) => {
      request.settled = true
      if (fail) request.reject(new Error('controlled resolution failure'))
      else
        request.resolve(
          request.uri.startsWith(recordUri)
            ? record
            : {
                type: 'external',
                uri: request.uri,
                title: 'Card',
                description: '',
                thumb: undefined,
              },
        )
      await request.promise.catch(() => {})
    }
    try {
      check()
      // Begin clean: retry and worker events must not turn hydration into an edit.
      await step('fail initial workers', () => {
        for (const attempt of attempts)
          attempt.report({state: 'failed', error: 'initial failure'})
        expect(store.getState().isDirty).toBe(false)
      })
      await step('bulk retry twice', () => {
        expect(
          store.actions.retryAllFailedUploads().retriedMediaIds,
        ).toHaveLength(2)
        expect(store.actions.retryAllFailedUploads().retriedMediaIds).toEqual(
          [],
        )
        expect(store.getState().isDirty).toBe(false)
      })
      const operations = [
        'add-post',
        'remove-post',
        'move',
        'add-media',
        'remove-media',
        'replace-media',
        'text',
        'alt',
        'captions',
        'uri',
        'remove-slot',
        'resolve',
        'worker',
        'retry',
        'bulk-retry',
      ] as const
      for (let index = 0; index < 60; index++) {
        const operation = operations[choose(operations.length)]
        const postId = order[choose(order.length)]
        const post = store.getState().posts[postId]
        const media = items(post.attachments.media)
        const item = media[choose(media.length)]
        await step(
          `${index}: ${operation} ${postId} ${item?.id ?? ''}`,
          async () => {
            const before = store.getState()
            if (operation === 'add-post' && order.length < 4) {
              const position = choose(2) ? 'before' : 'after'
              const added = store.actions.addPost(position, postId)!
              trace.push(`${position} ${postId}: ${added.addedPostId}`)
              order.splice(
                order.indexOf(postId) + (position === 'after' ? 1 : 0),
                0,
                added.addedPostId,
              )
            } else if (operation === 'remove-post') {
              store.actions.removePost(postId)
              if (order.length > 1) order = order.filter(id => id !== postId)
            } else if (operation === 'move') {
              const to = choose(order.length)
              trace.push(`to index ${to}`)
              const starts = attempts.length
              const cancellations = attempts.map(
                a => a.cancel.mock.calls.length,
              )
              const resolutions = requests.length
              store.actions.movePost(postId, to)
              order.splice(order.indexOf(postId), 1)
              order.splice(to, 0, postId)
              for (const id of order)
                expect(store.getState().posts[id]).toBe(before.posts[id])
              expect(attempts).toHaveLength(starts)
              expect(attempts.map(a => a.cancel.mock.calls.length)).toEqual(
                cancellations,
              )
              expect(requests).toHaveLength(resolutions)
            } else if (
              operation === 'add-media' ||
              operation === 'replace-media'
            ) {
              if (operation === 'replace-media')
                store.actions.removeMediaAttachment(postId)
              const first = [image, video, gif][choose(3)]
              const count = [1, 4, 5, 10, 11][choose(5)]
              trace.push(`${count} ${first.kind} plus image/video/gif`)
              const inputs = Array.from({length: count}, () => first)
              store.actions.addMedia(postId, [...inputs, image, video, gif])
            } else if (operation === 'remove-media' && item)
              store.actions.removeMedia(postId, item.id)
            else if (operation === 'text') {
              const text = ['', ' ', 'edited', 'x'.repeat(301)][choose(4)]
              trace.push(`text=${JSON.stringify(text)}`)
              store.actions.setPostText(postId, text)
              expect(store.getState().posts[postId].text).toBe(text)
            } else if (operation === 'alt' && item)
              store.actions.updateMediaAltText(postId, item.id, `alt-${index}`)
            else if (operation === 'captions' && item?.kind === 'video') {
              // Real workers report their initial phase synchronously.
              if (item.upload.state === 'pending') {
                attempts
                  .filter(a => a.mediaId === item.id)
                  .at(-1)!
                  .report({
                    state: 'uploading',
                    phase: 'validating',
                  })
              }
              store.actions.setVideoCaptions(postId, item.id, [
                {lang: 'en', content: `caption-${index}`},
              ])
            } else if (operation === 'uri') {
              const uri = `${choose(2) ? recordUri : mediaUri}?step=${index}`
              trace.push(uri)
              store.actions.addUri(postId, uri)
            } else if (operation === 'remove-slot') {
              const slot = choose(2) ? 'record' : 'media'
              trace.push(`clear ${slot}`)
              if (slot === 'record')
                store.actions.removeRecordAttachment(postId)
              else store.actions.removeMediaAttachment(postId)
            } else if (operation === 'resolve') {
              const pending = requests.filter(request => !request.settled)
              const request = pending[choose(pending.length)]
              if (!request) return
              const current = Object.values(before.posts).some(p =>
                [p.attachments.record, p.attachments.media].some(
                  slot => slot?.state === 'pending' && slot.uri === request.uri,
                ),
              )
              const fail = !!choose(2)
              trace.push(`${fail ? 'reject' : 'resolve'} ${request.uri}`)
              await settle(request, fail)
              if (!current) expect(store.getState()).toBe(before)
              expect(store.getState().isDirty).toBe(before.isDirty)
            } else if (operation === 'worker') {
              const attempt = attempts[choose(attempts.length)]
              trace.push(
                `worker attempt=${attempts.indexOf(attempt)} media=${attempt.mediaId}`,
              )
              const current = items(
                before.posts[attempt.postId]?.attachments.media,
              ).find(m => m.id === attempt.mediaId)
              const active =
                attempt ===
                  attempts.filter(a => a.mediaId === attempt.mediaId).at(-1) &&
                !attempt.cancel.mock.calls.length &&
                current?.kind !== 'gif' &&
                (current?.upload.state === 'pending' ||
                  current?.upload.state === 'uploading')
              const event = choose(3)
              trace.push(`event=${['progress', 'failure', 'success'][event]}`)
              if (event === 0)
                attempt.report({state: 'uploading', progress: 0.5})
              else if (event === 1)
                attempt.report({
                  state: 'failed',
                  error: 'controlled failure',
                  retryable: !!choose(2),
                })
              else
                attempt.report({
                  state: 'uploaded',
                  blob: blob(`attempt-${attempts.indexOf(attempt)}`),
                  captionBlobs:
                    attempt.media.kind === 'video'
                      ? attempt.media.captions.map(caption => ({
                          lang: caption.lang,
                          blob: blob(caption.content),
                        }))
                      : undefined,
                })
              if (!active) expect(store.getState()).toBe(before)
              expect(store.getState().isDirty).toBe(before.isDirty)
            } else if (operation === 'retry' && item) {
              store.actions.retryMediaUpload(postId, item.id)
              expect(store.getState().isDirty).toBe(before.isDirty)
              if (
                item.kind === 'gif' ||
                item.upload.state !== 'failed' ||
                !item.upload.retryable
              )
                expect(store.getState()).toBe(before)
            } else if (operation === 'bulk-retry') {
              store.actions.retryAllFailedUploads()
              expect(store.getState().isDirty).toBe(before.isDirty)
            }
          },
        )
      }
      await step('destroy and deliver every retained callback', async () => {
        const before = store.getState()
        const starts = attempts.length
        const published = history.length
        const notify = jest.fn()
        store.subscribe(notify)
        store.destroy()
        store.subscribe(notify)
        for (const attempt of attempts)
          for (const callback of lateCallbacks(attempt)) callback()
        for (const request of requests)
          if (!request.settled) await settle(request, !!choose(2))
        store.actions.setPostText(order[0], 'after destroy')
        store.actions.addMedia(order[0], [image])
        store.actions.addUri(order[0], mediaUri)
        store.actions.retryAllFailedUploads()
        expect(store.getState()).toBe(before)
        expect(attempts).toHaveLength(starts)
        expect(history).toHaveLength(published)
        expect(notify).not.toHaveBeenCalled()
      })
    } catch (error) {
      throw new Error(
        `Seed ${seed}\n${trace.join('\n')}\n${String(error instanceof Error ? error.stack : error)}`,
      )
    } finally {
      store.destroy()
    }
  },
)
