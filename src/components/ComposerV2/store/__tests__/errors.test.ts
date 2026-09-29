import {describe, expect, jest, test} from '@jest/globals'

jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {
  EmbeddingDisabledError,
  type LinkResolvers,
  type ResolvedLink,
} from '#/lib/api/resolve'
import {type ComposerV2OnError} from '#/components/ComposerV2/errors'
import {createThreadStore} from '#/components/ComposerV2/store'
import {manualUploadWorkers} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {type ThreadStoreInitialState} from '#/components/ComposerV2/store/types'
import {type UploadDependencies} from '#/components/ComposerV2/store/uploads'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'

const image = {
  kind: 'image' as const,
  uri: 'file:///private.jpg',
  width: 10,
  height: 10,
}
const failed = {
  state: 'failed' as const,
  error: 'Safe failure',
  code: 'test-failure',
}
const resolvers = {} as LinkResolvers
const recordUri = 'https://bsky.app/profile/example.test/post/abc'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (cause: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

function setup(onError = jest.fn<ComposerV2OnError>()) {
  const {attempts, workers} = manualUploadWorkers()
  let id = 0
  const store = createThreadStore({
    resolvers,
    onError,
    __createId: () => `id-${++id}`,
    __uploadWorkers: workers,
  })
  const postId = Object.keys(store.getState().posts)[0]
  const items = () =>
    getMediaItems({media: store.getState().posts[postId].attachments.media})
  return {store, postId, items, attempts, onError}
}

describe('session error reporting', () => {
  test('accepted upload failure reports once; only a new failed retry reports again', () => {
    const {store, postId, items, attempts, onError} = setup()
    const mediaId = store.actions.addMedia(postId, [image])!.addedMediaIds[0]
    attempts[0].report({state: 'uploading', progress: 0.5})
    expect(onError).not.toHaveBeenCalled()
    attempts[0].report(failed)
    attempts[0].report(failed)
    const item = items()[0]
    if (item.kind === 'gif' || item.upload.state !== 'failed')
      throw new Error('expected failure')
    const originalRetry = item.upload.retry!
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenLastCalledWith(
      {
        source: 'upload',
        kind: 'operational',
        code: 'test-failure',
        recovery: 'retry',
        postId,
        mediaId,
      },
      undefined,
    )
    expect(attempts[0].cancel).toHaveBeenCalledTimes(1)
    const dirty = store.getState().isDirty
    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: [mediaId],
    })
    expect(store.actions.retryAllFailedUploads()).toEqual({retriedMediaIds: []})
    attempts[0].report(failed)
    expect(onError).toHaveBeenCalledTimes(1)
    attempts[1].report({...failed, retryable: false})
    originalRetry()
    expect(attempts).toHaveLength(2)
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenLastCalledWith(
      expect.objectContaining({recovery: 'edit', kind: 'validation'}),
      undefined,
    )
    expect(store.getState().isDirty).toBe(dirty)
    expect(store.actions.retryAllFailedUploads()).toEqual({retriedMediaIds: []})
    store.destroy()
  })

  test.each(['remove', 'replace', 'destroy'] as const)(
    '%s ignores late upload callbacks',
    action => {
      const {store, postId, attempts, onError} = setup()
      const mediaId = store.actions.addMedia(postId, [image])!.addedMediaIds[0]
      if (action === 'remove') store.actions.removeMedia(postId, mediaId)
      else if (action === 'replace') {
        store.actions.removeMediaAttachment(postId)
        store.actions.addMedia(postId, [image])
      } else store.destroy()
      attempts[0].report(failed)
      expect(onError).not.toHaveBeenCalled()
      store.destroy()
    },
  )

  test('throwing/reentrant callback cannot interrupt state, cleanup, or later reports', () => {
    const onError = jest.fn<ComposerV2OnError>((event, cause) => {
      store.reportError(event, cause)
      throw new Error('callback failure')
    })
    const {store, postId, items, attempts} = setup(onError)
    const notify = jest.fn()
    store.subscribe(notify)
    store.actions.addMedia(postId, [image])
    expect(() => attempts[0].report(failed)).not.toThrow()
    expect(items()[0]).toMatchObject({
      upload: {state: 'failed', retryable: true},
    })
    expect(attempts[0].cancel).toHaveBeenCalledTimes(1)
    store.actions.retryAllFailedUploads()
    attempts[1].report(failed)
    expect(onError).toHaveBeenCalledTimes(2)
    expect(notify).toHaveBeenCalledTimes(4)
    store.destroy()
    store.reportError({
      source: 'writer',
      code: 'apply-writes-failed',
      kind: 'operational',
      recovery: 'reconcile',
    })
    expect(onError).toHaveBeenCalledTimes(2)
  })

  test('eager upload failures are observable before construction returns', () => {
    const onError = jest.fn<ComposerV2OnError>(() => {
      throw new Error('listener')
    })
    const store = createThreadStore({
      resolvers,
      onError,
      initialState: {
        posts: [{attachments: {media: {kind: 'images', items: [image]}}}],
      },
    })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toMatchObject({
      source: 'upload',
      code: 'missing-upload-dependencies',
      kind: 'unexpected',
      recovery: 'none',
    })
    expect(JSON.stringify(store.getState())).not.toContain('cause')
    expect(Object.values(store.getState().posts)[0]).toMatchObject({
      attachments: {
        media: {items: [{upload: {state: 'failed', retryable: false}}]},
      },
    })
    store.destroy()
  })

  test('normalization preserves its original rejection, even if reporting throws', () => {
    const cause = new Error('private input diagnostic')
    const onError = jest.fn<ComposerV2OnError>(() => {
      throw new Error('listener')
    })
    expect(() =>
      createThreadStore({
        resolvers,
        onError,
        __createId: () => {
          throw cause
        },
      }),
    ).toThrow(cause)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      {
        source: 'initialization',
        code: 'initial-state-failed',
        kind: 'unexpected',
        recovery: 'none',
      },
      cause,
    )
  })

  test('a throwing eager worker reports once and cleans up earlier workers', () => {
    const cause = new Error('worker startup')
    const cancel = jest.fn()
    const onError = jest.fn<ComposerV2OnError>(() => {
      throw new Error('listener')
    })
    let starts = 0
    expect(() =>
      createThreadStore({
        resolvers,
        onError,
        initialState: {
          posts: [
            {attachments: {media: {kind: 'images', items: [image, image]}}},
          ],
        },
        __uploadWorkers: {
          startImageUpload: () => {
            if (++starts === 2) throw cause
            return {cancel}
          },
        },
      }),
    ).toThrow(cause)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][1]).toBe(cause)
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  test('a worker that throws after its accepted failure does not report the same attempt twice', () => {
    const cause = new Error('worker threw after reporting')
    const onError = jest.fn<ComposerV2OnError>()
    expect(() =>
      createThreadStore({
        resolvers,
        onError,
        initialState: {
          posts: [{attachments: {media: {kind: 'images', items: [image]}}}],
        },
        __uploadWorkers: {
          startImageUpload: options => {
            options.setUploadStatus(options.postId, options.mediaId, failed)
            throw cause
          },
        },
      }),
    ).toThrow(cause)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].code).toBe('test-failure')
  })

  test('eager URI initialization uses the construction callback for synchronous resolver failures', () => {
    const cause = new Error('private resolver startup')
    const onError = jest.fn<ComposerV2OnError>()
    const store = createThreadStore({
      resolvers,
      onError,
      initialState: {
        posts: [{attachments: {record: {kind: 'uri', uri: recordUri}}}],
      },
      __resolveLink: () => {
        throw cause
      },
    })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'uri-resolution',
        slot: 'record',
        kind: 'unexpected',
      }),
      cause,
    )
    expect(JSON.stringify(store.getState())).not.toContain(
      'private resolver startup',
    )
    store.destroy()
  })

  test('real worker cancellation reports nothing; unexpected causes stay outside status', async () => {
    for (const cancelled of [true, false]) {
      const cause = Object.assign(new Error('private path diagnostic'), {
        name: cancelled ? 'AbortError' : 'Error',
      })
      const onError = jest.fn<ComposerV2OnError>()
      const uploadBlob =
        jest.fn<NonNullable<UploadDependencies['uploadBlob']>>()
      const store = createThreadStore({
        resolvers,
        onError,
        media: {
          pdsClient: {},
          i18n: {_: () => 'Safe localized failure'},
          compressImage: () => Promise.reject(cause),
          uploadBlob,
        } as unknown as UploadDependencies,
      })
      store.actions.addMedia(Object.keys(store.getState().posts)[0], [image])
      await Promise.resolve()
      await Promise.resolve()
      expect(uploadBlob).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledTimes(cancelled ? 0 : 1)
      if (!cancelled) expect(onError.mock.calls[0][1]).toBe(cause)
      expect(JSON.stringify(store.getState())).not.toContain(
        'private path diagnostic',
      )
      store.destroy()
    }
  })

  test('URI lanes report independently with identity, safe state and bound retries', async () => {
    const attempts: ReturnType<typeof deferred<ResolvedLink>>[] = []
    const onError = jest.fn<ComposerV2OnError>(() => {
      throw new Error('listener')
    })
    const store = createThreadStore({
      resolvers,
      onError,
      __resolveLink: () => {
        const attempt = deferred<ResolvedLink>()
        attempts.push(attempt)
        return attempt.promise
      },
    })
    const postId = Object.keys(store.getState().posts)[0]
    store.actions.addUri(postId, recordUri)
    store.actions.addUri(postId, 'https://example.com')
    const cause = new Error('private resolver diagnostic')
    attempts[0].reject(cause)
    attempts[1].reject(new EmbeddingDisabledError())
    await Promise.resolve()
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError.mock.calls[0]).toEqual([
      {
        source: 'uri-resolution',
        slot: 'record',
        postId,
        code: 'unknown',
        kind: 'operational',
        recovery: 'retry',
      },
      cause,
    ])
    expect(onError.mock.calls[1][0]).toMatchObject({
      slot: 'media',
      code: 'embedding-disabled',
      kind: 'validation',
      recovery: 'edit',
    })
    expect(JSON.stringify(store.getState())).not.toContain(
      'private resolver diagnostic',
    )
    const record = store.getState().posts[postId].attachments.record
    if (record?.state !== 'failed') throw new Error('expected failed URI')
    record.retry?.()
    record.retry?.()
    expect(attempts).toHaveLength(3)
    attempts[2].reject(cause)
    await Promise.resolve()
    expect(onError).toHaveBeenCalledTimes(3)
    store.destroy()
  })

  test.each(['replace', 'remove', 'destroy', 'cancel'] as const)(
    '%s ignores URI failures',
    async action => {
      const attempt = deferred<ResolvedLink>()
      const onError = jest.fn<ComposerV2OnError>()
      const store = createThreadStore({
        resolvers,
        onError,
        __resolveLink: () => attempt.promise,
      })
      const postId = Object.keys(store.getState().posts)[0]
      store.actions.addUri(postId, recordUri)
      if (action === 'replace')
        store.actions.setRecordAttachment(postId, {
          kind: 'post',
          record: {
            uri: 'at://did:plc:example/app.bsky.feed.post/test',
            cid: 'test',
          },
        })
      if (action === 'remove') store.actions.removeRecordAttachment(postId)
      if (action === 'destroy') store.destroy()
      attempt.reject(
        Object.assign(new Error('ignored'), {
          name: action === 'cancel' ? 'AbortError' : 'Error',
        }),
      )
      await Promise.resolve()
      expect(onError).not.toHaveBeenCalled()
      store.destroy()
    },
  )

  test('omitted callback preserves eager failure state', () => {
    const initialState: ThreadStoreInitialState = {
      posts: [{attachments: {media: {kind: 'images', items: [image]}}}],
    }
    const store = createThreadStore({resolvers, initialState})
    expect(Object.values(store.getState().posts)[0]).toMatchObject({
      attachments: {media: {items: [{upload: {state: 'failed'}}]}},
    })
    store.destroy()
  })
})
