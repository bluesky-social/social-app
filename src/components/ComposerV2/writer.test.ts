import {describe, expect, jest, test} from '@jest/globals'

jest.unmock('multiformats/cid')
jest.unmock('multiformats/hashes/hasher')
/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {TID} from '@atproto/common-web'
import {type Client, getMain, XrpcResponseError} from '@atproto/lex'

import {type LinkResolvers} from '#/lib/api/resolve'
import {type ComposerOnError} from '#/components/ComposerV2/errors'
import {planThread, type ThreadPlan} from '#/components/ComposerV2/planner'
import {createThreadStore} from '#/components/ComposerV2/store'
import {testUploadRuntime} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {buildThreadState} from '#/components/ComposerV2/store/utils/buildThreadState'
import {
  WritePreconditionError,
  WriteRejectedError,
  writeThreadPlan,
} from '#/components/ComposerV2/writer'
import {com} from '#/lexicons'

/** A genuine server response error, as the lex client throws for non-2xx. */
function xrpcResponseError(status: number) {
  const body = {error: 'InvalidRequest', message: 'private server detail'}
  return new XrpcResponseError(
    getMain(com.atproto.repo.applyWrites),
    new Response(JSON.stringify(body), {
      status,
      headers: {'content-type': 'application/json'},
    }),
    {encoding: 'application/json', body},
  )
}

const DID = 'did:plc:composer-writer'
const BLOB_CID = 'bafkreieq5jui4j25lacwomsqgjeswwl3y5zcdrresptwgmfylxo2depppq'

async function makeFixture() {
  const snapshot = buildThreadState({
    input: {
      threadgateAllowRules: [],
      postgateEmbeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
      posts: [
        {
          text: 'first post',
          langs: ['en'],
          tags: ['explicit-first'],
          attachments: {
            record: {
              kind: 'post',
              record: {
                uri: 'at://did:plc:quoted/app.bsky.feed.post/quote',
                cid: BLOB_CID,
              },
            },
          },
        },
        {text: 'second post', langs: ['fr'], tags: ['explicit-second']},
      ],
    },
    defaultLanguages: [],
    createId: (() => {
      let id = 0
      return () => `post-${++id}`
    })(),
  })
  const appviewClient = {
    call: jest.fn(),
  } as unknown as Client
  const result = await planThread({
    snapshot,
    dependencies: {
      did: DID,
      appviewClient,
      now: () => new Date('2024-01-01T00:00:00.000Z'),
      __createRkey: (index, createdAt) =>
        TID.fromTime(createdAt.getTime() * 1000, index).toString(),
    },
  })
  if (!result.ok) {
    throw new Error(`Expected successful fixture plan: ${result.error.code}`)
  }
  return {plan: result, snapshot}
}

function mockPdsClient(
  did: string | undefined,
  implementation: (...args: unknown[]) => Promise<unknown> = () =>
    Promise.resolve({}),
) {
  const call = jest.fn(implementation)
  const pdsClient = {assertDid: did, call} as unknown as Client
  return {pdsClient, call}
}

describe('thin writer', () => {
  test('submits plan unchanged once and returns ordered URIs', async () => {
    const {plan} = await makeFixture()
    const {pdsClient, call} = mockPdsClient(DID)
    const before = JSON.stringify(plan)

    const result = await writeThreadPlan({plan, pdsClient})

    expect(call).toHaveBeenCalledTimes(1)
    expect(call.mock.calls[0][0]).toBe(com.atproto.repo.applyWrites)
    expect(call.mock.calls[0][1]).toBe(plan.input)
    expect(plan.input.validate).toBe(true)
    expect(result).toEqual({uris: plan.posts.map(post => post.uri)})
    expect(plan.posts.map(post => post.record.tags)).toEqual([
      ['explicit-first'],
      ['explicit-second'],
    ])
    expect(plan.posts.map(post => post.record.langs)).toEqual([['en'], ['fr']])
    expect(plan.posts[0].record.embed?.$type).toBe('app.bsky.embed.record')
    expect(
      plan.input.writes.map(write =>
        write.$type === 'com.atproto.repo.applyWrites#create'
          ? write.collection
          : 'unexpected',
      ),
    ).toEqual([
      'app.bsky.feed.post',
      'app.bsky.feed.threadgate',
      'app.bsky.feed.postgate',
      'app.bsky.feed.post',
      'app.bsky.feed.postgate',
    ])
    expect(JSON.stringify(plan)).toBe(before)
  })

  test('waits for the PDS write before resolving', async () => {
    const {plan} = await makeFixture()
    let resolveWrite!: (value: unknown) => void
    const pendingWrite = new Promise<unknown>(resolve => {
      resolveWrite = resolve
    })
    const {pdsClient, call} = mockPdsClient(DID, () => pendingWrite)
    let settled = false
    const result = writeThreadPlan({plan, pdsClient}).then(value => {
      settled = true
      return value
    })

    expect(call).toHaveBeenCalledTimes(1)
    await Promise.resolve()
    expect(settled).toBe(false)

    resolveWrite({})
    expect(await result).toEqual({uris: plan.posts.map(post => post.uri)})
    expect(settled).toBe(true)
    expect(call).toHaveBeenCalledTimes(1)
  })

  test('rejects unsafe inputs before writing', async () => {
    const {plan} = await makeFixture()

    const unsuccessful = {
      ok: false,
      error: {code: 'empty-composition', message: 'nothing to post'},
    } as unknown as ThreadPlan
    const unsuccessfulClient = mockPdsClient(DID)
    await expect(
      writeThreadPlan({
        plan: unsuccessful,
        pdsClient: unsuccessfulClient.pdsClient,
      }),
    ).rejects.toThrow('unsuccessful thread plan')
    expect(unsuccessfulClient.call).not.toHaveBeenCalled()

    const missingClient = mockPdsClient(undefined)
    await expect(
      writeThreadPlan({plan, pdsClient: missingClient.pdsClient}),
    ).rejects.toThrow('authenticated PDS account is required')
    expect(missingClient.call).not.toHaveBeenCalled()

    const mismatchedClient = mockPdsClient('did:plc:other-account')
    await expect(
      writeThreadPlan({plan, pdsClient: mismatchedClient.pdsClient}),
    ).rejects.toThrow('does not match the authenticated PDS')
    expect(mismatchedClient.call).not.toHaveBeenCalled()

    const invalidPlan = {
      ...plan,
      input: {...plan.input, validate: false},
    } as ThreadPlan
    const validationClient = mockPdsClient(DID)
    await expect(
      writeThreadPlan({
        plan: invalidPlan,
        pdsClient: validationClient.pdsClient,
      }),
    ).rejects.toThrow('must enable server-side validation')
    expect(validationClient.call).not.toHaveBeenCalled()

    /* Callers rely on the class to know nothing was sent. */
    await expect(
      writeThreadPlan({plan, pdsClient: missingClient.pdsClient}),
    ).rejects.toBeInstanceOf(WritePreconditionError)
  })

  test.each([
    ['network', new Error('connection lost')],
    ['XRPC 5xx', xrpcResponseError(502)],
  ])('propagates %s errors once without mutation', async (_kind, error) => {
    const {plan, snapshot} = await makeFixture()
    const {pdsClient, call} = mockPdsClient(DID, () => Promise.reject(error))
    const planBefore = JSON.stringify(plan)
    const snapshotBefore = JSON.stringify(snapshot)

    await expect(writeThreadPlan({plan, pdsClient})).rejects.toBe(error)

    expect(call).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(plan)).toBe(planBefore)
    expect(JSON.stringify(snapshot)).toBe(snapshotBefore)
  })

  test('ambiguous write failure reports once, preserves the SDK error and never retries', async () => {
    const {plan} = await makeFixture()
    const error = Object.assign(new Error('private SDK diagnostic'), {
      status: 503,
    })
    const {pdsClient, call} = mockPdsClient(DID, () => Promise.reject(error))
    const onError = jest.fn<ComposerOnError>(() => {
      throw new Error('listener')
    })
    const before = JSON.stringify(plan)
    await expect(writeThreadPlan({plan, pdsClient, onError})).rejects.toBe(
      error,
    )
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      {
        source: 'writer',
        code: 'apply-writes-failed',
        postIds: plan.posts.map(post => post.postId),
        kind: 'operational',
        recovery: 'reconcile',
      },
      error,
    )
    expect(call).toHaveBeenCalledTimes(1)
    expect(call.mock.calls[0][1]).toBe(plan.input)
    expect(plan.input.validate).toBe(true)
    expect(JSON.stringify(plan)).toBe(before)
  })

  test.each([400, 401, 429])(
    'a %s server refusal is a definite, retryable failure',
    async status => {
      const {plan} = await makeFixture()
      const error = xrpcResponseError(status)
      const {pdsClient, call} = mockPdsClient(DID, () => Promise.reject(error))
      const onError = jest.fn<ComposerOnError>()

      const thrown = await writeThreadPlan({plan, pdsClient, onError}).then(
        () => undefined,
        (cause: unknown) => cause,
      )

      expect(thrown).toBeInstanceOf(WriteRejectedError)
      expect(thrown).toMatchObject({
        name: 'WriteRejectedError',
        status,
        cause: error,
      })
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        {
          source: 'writer',
          code: 'apply-writes-rejected',
          postIds: plan.posts.map(post => post.postId),
          kind: 'operational',
          recovery: 'retry',
        },
        error,
      )
      expect(call).toHaveBeenCalledTimes(1)
    },
  )

  test('a 5xx server response stays uncertain and rethrows the raw error', async () => {
    const {plan} = await makeFixture()
    const error = xrpcResponseError(500)
    const {pdsClient} = mockPdsClient(DID, () => Promise.reject(error))
    const onError = jest.fn<ComposerOnError>()

    await expect(writeThreadPlan({plan, pdsClient, onError})).rejects.toBe(
      error,
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toMatchObject({
      code: 'apply-writes-failed',
      recovery: 'reconcile',
    })
  })

  test.each([false, true])(
    'transport abort still needs reconciliation unless the session was retired (%s)',
    async retired => {
      const {plan} = await makeFixture()
      const error = Object.assign(
        new Error('transport aborted after dispatch'),
        {name: 'AbortError'},
      )
      let reject!: (cause: unknown) => void
      const {pdsClient, call} = mockPdsClient(
        DID,
        () =>
          new Promise((_, rej) => {
            reject = rej
          }),
      )
      const onError = jest.fn<ComposerOnError>()
      const store = createThreadStore({
        defaultLanguages: [],
        ...testUploadRuntime,
        resolvers: {} as LinkResolvers,
        onError,
      })
      const result = writeThreadPlan({
        plan,
        pdsClient,
        onError: store.reportError,
      })
      if (retired) store.destroy()
      reject(error)
      await expect(result).rejects.toBe(error)
      expect(call).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledTimes(retired ? 0 : 1)
      if (!retired) expect(onError.mock.calls[0][0].recovery).toBe('reconcile')
      store.destroy()
    },
  )

  test('precondition reporting does not imply a dispatched write or replace the rejection', async () => {
    const {plan} = await makeFixture()
    const error = new Error('SDK assertDid failed')
    const call = jest.fn()
    const pdsClient = {
      get assertDid() {
        throw error
      },
      call,
    } as unknown as Client
    const onError = jest.fn<ComposerOnError>(() => {
      throw new Error('listener')
    })
    await expect(writeThreadPlan({plan, pdsClient, onError})).rejects.toBe(
      error,
    )
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      {
        source: 'writer',
        code: 'write-precondition-failed',
        kind: 'unexpected',
        recovery: 'none',
      },
      error,
    )
    expect(call).not.toHaveBeenCalled()
  })

  test('does not mutate plan or snapshot on success', async () => {
    const {plan, snapshot} = await makeFixture()
    const {pdsClient, call} = mockPdsClient(DID)
    const planBefore = JSON.stringify(plan)
    const snapshotBefore = JSON.stringify(snapshot)

    await writeThreadPlan({plan, pdsClient})

    expect(call).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(plan)).toBe(planBefore)
    expect(JSON.stringify(snapshot)).toBe(snapshotBefore)
  })
})
