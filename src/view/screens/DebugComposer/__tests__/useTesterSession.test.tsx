import {describe, expect, jest, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

/* Reporting must not send raw scenario failures to the existing logger. */
const mockLoggerError = jest.fn()
jest.mock('#/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {useTesterSession} from '#/view/screens/DebugComposer/useTesterSession'
import {composerOptsToInitialState} from '#/components/ComposerV2/adapters'
import {type ComposerV2OnError} from '#/components/ComposerV2/errors'
import {createThreadStore} from '#/components/ComposerV2/store'
import {type UploadDependencies} from '#/components/ComposerV2/store/uploads'

/** Wrap the real constructor so destruction is observable per store. */
function makeCreateStoreSpy() {
  const destroyed: boolean[] = []
  const create: typeof createThreadStore = options => {
    const store = createThreadStore(options)
    const index = destroyed.length
    destroyed.push(false)
    const realDestroy = store.destroy.bind(store)
    store.destroy = () => {
      destroyed[index] = true
      realDestroy()
    }
    return store
  }
  const spy = jest.fn(create)
  return {spy, destroyed}
}

const resolvers = {} as LinkResolvers
const media = {} as UploadDependencies

function setup(
  initialDid = 'did:plc:one',
  onError = jest.fn<ComposerV2OnError>(),
) {
  const {spy, destroyed} = makeCreateStoreSpy()
  const hook = renderHook(
    ({did}: {did: string}) =>
      useTesterSession({
        accountDid: did,
        resolvers,
        media,
        __createStore: spy,
        onError,
      }),
    {initialProps: {did: initialDid}},
  )
  return {...hook, spy, destroyed, onError}
}

describe('useTesterSession', () => {
  test('creates an initial empty session through the constructor', () => {
    const {result, spy} = setup()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(result.current.session.scenarioId).toBe('empty')
    const posts = Object.values(result.current.session.store.getState().posts)
    expect(posts).toHaveLength(1)
    expect(posts[0].text).toBe('')
  })

  test('applying a scenario replaces the session and destroys the old store', async () => {
    const {result, destroyed} = setup()
    const firstKey = result.current.session.key
    await act(async () => {
      await result.current.applyScenario('thread', () => ({
        posts: [{text: 'one'}, {text: 'two'}],
      }))
    })
    expect(result.current.session.key).not.toBe(firstKey)
    expect(result.current.session.scenarioId).toBe('thread')
    const posts = Object.values(result.current.session.store.getState().posts)
    expect(posts.map(post => post.text)).toEqual(['one', 'two'])
    expect(destroyed[0]).toBe(true)
    expect(destroyed[1]).toBe(false)
  })

  test('reset rebuilds the same scenario from its original input', async () => {
    const {result, destroyed} = setup()
    await act(async () => {
      await result.current.applyScenario('thread', () => ({
        posts: [{text: 'original'}],
      }))
    })
    const editedStore = result.current.session.store
    act(() => {
      const postId = Object.keys(editedStore.getState().posts)[0]
      editedStore.actions.setPostText(postId, 'edited beyond recognition')
    })
    const keyBeforeReset = result.current.session.key

    act(() => {
      result.current.resetSession()
    })
    expect(result.current.session.key).not.toBe(keyBeforeReset)
    expect(result.current.session.scenarioId).toBe('thread')
    const posts = Object.values(result.current.session.store.getState().posts)
    expect(posts[0].text).toBe('original')
    expect(destroyed[1]).toBe(true)
  })

  test('an account change destroys the session and starts empty', async () => {
    const {result, rerender, destroyed} = setup()
    await act(async () => {
      await result.current.applyScenario('thread', () => ({
        posts: [{text: 'account one content'}],
      }))
    })
    const keyBefore = result.current.session.key

    rerender({did: 'did:plc:two'})
    expect(result.current.session.key).not.toBe(keyBefore)
    expect(result.current.session.scenarioId).toBe('empty')
    const posts = Object.values(result.current.session.store.getState().posts)
    expect(posts).toHaveLength(1)
    expect(posts[0].text).toBe('')
    expect(destroyed[1]).toBe(true)
  })

  test('unmount destroys the final store', () => {
    const {result, unmount, destroyed} = setup()
    expect(result.current.session).toBeDefined()
    unmount()
    expect(destroyed[0]).toBe(true)
  })

  test('a stale async scenario build never populates a newer session', async () => {
    const {result, spy} = setup()
    let resolveBuild!: (value: {posts: Array<{text: string}>}) => void
    const pending = new Promise<{posts: Array<{text: string}>}>(resolve => {
      resolveBuild = resolve
    })

    let staleApply: Promise<void>
    act(() => {
      staleApply = result.current.applyScenario('reply', () => pending)
    })
    expect(result.current.isApplyingScenario).toBe(true)

    /* A newer session arrives while the old build is still in flight. */
    await act(async () => {
      await result.current.applyScenario('thread', () => ({
        posts: [{text: 'newer session'}],
      }))
    })
    const newerKey = result.current.session.key
    const storeCallsBefore = spy.mock.calls.length

    await act(async () => {
      resolveBuild({posts: [{text: 'stale build'}]})
      await staleApply
    })
    expect(result.current.session.key).toBe(newerKey)
    expect(result.current.session.scenarioId).toBe('thread')
    expect(spy.mock.calls.length).toBe(storeCallsBefore)
    const posts = Object.values(result.current.session.store.getState().posts)
    expect(posts[0].text).toBe('newer session')
  })

  test('scenario build failures surface as typed errors without raw exception text', async () => {
    const {result, onError} = setup()
    const keyBefore = result.current.session.key
    await act(async () => {
      await result.current.applyScenario('draft-fixture', () => {
        throw new Error('private adapter diagnostic detail')
      })
    })
    expect(result.current.session.key).toBe(keyBefore)
    /* Only the optional callback receives the diagnostic, never UI or logs. */
    expect(result.current.scenarioError).toEqual({
      code: 'scenario-build-failed',
      scenarioId: 'draft-fixture',
    })
    expect(JSON.stringify(result.current.scenarioError)).not.toContain(
      'private adapter diagnostic detail',
    )
    expect(mockLoggerError).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toEqual({
      source: 'initialization',
      code: 'scenario-build-failed',
      kind: 'unexpected',
      recovery: 'none',
    })
    expect(onError.mock.calls[0][1]).toBeInstanceOf(Error)
    expect(result.current.isApplyingScenario).toBe(false)
  })

  test('adapter and constructor rejections are each reported at only one boundary', async () => {
    const onError = jest.fn<ComposerV2OnError>(() => {
      throw new Error('listener')
    })
    const {result} = setup('did:plc:one', onError)
    const cause = new Error('private normalization diagnostic')
    await act(async () => {
      await result.current.applyScenario('text', () =>
        composerOptsToInitialState({
          composerOpts: {
            get text(): string {
              throw cause
            },
          },
        }),
      )
    })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][1]).toBe(cause)
    expect(result.current.isApplyingScenario).toBe(false)
    await act(async () => {
      await result.current.applyScenario('media', () => ({
        posts: [
          {
            attachments: {
              media: {
                kind: 'images',
                items: Array.from({length: 11}, () => ({
                  uri: 'file:///private',
                  width: 10,
                  height: 10,
                })),
              },
            },
          },
        ],
      }))
    })
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError.mock.calls[1][0]).toMatchObject({
      code: 'initial-state-failed',
    })
    expect(result.current.scenarioError?.code).toBe('scenario-build-failed')
    expect(result.current.isApplyingScenario).toBe(false)
  })

  test('replaced sessions suppress retained callbacks and stale scenario failures', async () => {
    const {result, onError} = setup()
    const first = result.current.session
    let reject!: (cause: unknown) => void
    let pending!: Promise<void>
    act(() => {
      pending = result.current.applyScenario(
        'text',
        () =>
          new Promise((_, rej) => {
            reject = rej
          }),
      )
    })
    act(() => result.current.resetSession())
    await act(async () => {
      reject(new Error('old scenario'))
      await pending
    })
    first.store.reportError(
      {
        source: 'writer',
        code: 'apply-writes-failed',
        kind: 'operational',
        recovery: 'reconcile',
      },
      new Error('old write'),
    )
    expect(onError).not.toHaveBeenCalled()
    expect(result.current.scenarioError).toBeUndefined()
  })

  test('a scenario build resolving after unmount never creates an ownerless store', async () => {
    const {result, unmount, spy, destroyed} = setup()
    let resolveBuild!: (value: {posts: Array<{text: string}>}) => void
    const pending = new Promise<{posts: Array<{text: string}>}>(resolve => {
      resolveBuild = resolve
    })

    let deferredApply: Promise<void>
    act(() => {
      deferredApply = result.current.applyScenario('reply', () => pending)
    })
    expect(result.current.isApplyingScenario).toBe(true)

    unmount()
    expect(destroyed[0]).toBe(true)

    const storeCallsBefore = spy.mock.calls.length
    await act(async () => {
      resolveBuild({posts: [{text: 'arrived after unmount'}]})
      await deferredApply
    })
    /* No new store may exist; there is no owner left to destroy it. */
    expect(spy.mock.calls.length).toBe(storeCallsBefore)
    expect(destroyed).toEqual([true])
  })

  test('a scenario build rejecting after unmount is swallowed without state updates', async () => {
    const {result, unmount, onError} = setup()
    let rejectBuild!: (error: Error) => void
    const pending = new Promise<{posts: Array<{text: string}>}>(
      (_resolve, reject) => {
        rejectBuild = reject
      },
    )

    let deferredApply: Promise<void>
    act(() => {
      deferredApply = result.current.applyScenario('quote', () => pending)
    })
    unmount()

    mockLoggerError.mockClear()
    await act(async () => {
      rejectBuild(new Error('late failure'))
      await deferredApply
    })
    /* Invalidated request: neither reported nor logged. */
    expect(mockLoggerError).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
