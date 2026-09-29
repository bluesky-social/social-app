import {describe, expect, jest, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {type LinkResolvers} from '#/lib/api/resolve'
import {usePlanRunner} from '#/view/screens/DebugComposer/usePlanRunner'
import {type TesterSession} from '#/view/screens/DebugComposer/useTesterSession'
import {type ComposerV2OnError} from '#/components/ComposerV2/errors'
import {
  type ComposerV2Plan,
  type ComposerV2PlannerDependencies,
  type ComposerV2PlanResult,
  planComposerV2,
} from '#/components/ComposerV2/planner'
import {createThreadStore} from '#/components/ComposerV2/store'
import {testUploadRuntime} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'

const resolvers = {} as LinkResolvers
const dependencies: ComposerV2PlannerDependencies = {did: 'did:plc:tester'}

function makeSession(
  key: string,
  text = '',
  onError?: ComposerV2OnError,
): TesterSession {
  return {
    key,
    scenarioId: 'empty',
    store: createThreadStore({
      ...testUploadRuntime,
      resolvers,
      onError,
      initialState: {posts: [{text}]},
    }),
  }
}

const failedResult: ComposerV2PlanResult = {
  ok: false,
  errors: [{code: 'empty-composition', message: 'nothing to post'}],
}

function setup(planImpl?: typeof planComposerV2) {
  const plan = jest.fn<typeof planComposerV2>(
    planImpl ?? (() => Promise.resolve(failedResult)),
  )
  const onError = jest.fn<ComposerV2OnError>()
  const initialSession = makeSession('session-1', 'hello world', onError)
  const hook = renderHook(
    ({session}: {session: TesterSession}) =>
      usePlanRunner({
        session,
        dependencies,
        requireAltText: true,
        __plan: plan,
      }),
    {initialProps: {session: initialSession}},
  )
  return {...hook, plan, initialSession, onError}
}

describe('usePlanRunner', () => {
  test('captures a snapshot, passes preflight, and summarizes the result', async () => {
    const {result, plan, initialSession} = setup()
    await act(async () => {
      await result.current.runPlan()
    })
    expect(plan).toHaveBeenCalledTimes(1)
    const args = plan.mock.calls[0][0]
    expect(args.snapshot).toBe(initialSession.store.getState())
    expect(args.dependencies.did).toBe('did:plc:tester')
    expect(args.preflight).toEqual({
      requireAltText: true,
      skipEmptyPostsConfirmed: false,
    })
    expect(result.current.result?.summary).toEqual({
      ok: false,
      errors: [
        {
          code: 'empty-composition',
          postIndex: undefined,
          collection: undefined,
        },
      ],
    })
    expect(result.current.isStale).toBe(false)
    initialSession.store.destroy()
  })

  test('retains the exact successful plan for a separate writer action', async () => {
    const successfulPlan = {
      ok: true,
      input: {repo: 'did:plc:tester', writes: [], validate: true},
      posts: [],
      writes: [],
    } as unknown as ComposerV2Plan
    const {result, initialSession} = setup(() =>
      Promise.resolve(successfulPlan),
    )

    await act(async () => {
      await result.current.runPlan()
    })

    expect(result.current.result?.plan).toBe(successfulPlan)
    initialSession.store.destroy()
  })

  test('re-planning after the empty-post confirmation passes the flag', async () => {
    const {result, plan, initialSession} = setup()
    await act(async () => {
      await result.current.runPlan({skipEmptyPostsConfirmed: true})
    })
    expect(plan.mock.calls[0][0].preflight).toEqual({
      requireAltText: true,
      skipEmptyPostsConfirmed: true,
    })
    expect(result.current.result?.skipEmptyPostsConfirmed).toBe(true)
    initialSession.store.destroy()
  })

  test('edits after capture mark the result stale by snapshot identity', async () => {
    const {result, initialSession} = setup()
    await act(async () => {
      await result.current.runPlan()
    })
    expect(result.current.isStale).toBe(false)
    act(() => {
      const postId = Object.keys(initialSession.store.getState().posts)[0]
      initialSession.store.actions.setPostText(postId, 'edited after plan')
    })
    expect(result.current.isStale).toBe(true)
    initialSession.store.destroy()
  })

  test('a session change clears the previous result', async () => {
    const {result, rerender, initialSession} = setup()
    await act(async () => {
      await result.current.runPlan()
    })
    expect(result.current.result).toBeDefined()

    const nextSession = makeSession('session-2')
    rerender({session: nextSession})
    expect(result.current.result).toBeUndefined()
    expect(result.current.isStale).toBe(false)
    initialSession.store.destroy()
    nextSession.store.destroy()
  })

  test('an old async plan never populates a different session', async () => {
    let resolvePlan!: (value: ComposerV2PlanResult) => void
    const pending = new Promise<ComposerV2PlanResult>(resolve => {
      resolvePlan = resolve
    })
    const {result, rerender, initialSession} = setup(() => pending)

    let inFlight: Promise<void>
    act(() => {
      inFlight = result.current.runPlan()
    })
    expect(result.current.isPlanning).toBe(true)

    const nextSession = makeSession('session-2')
    rerender({session: nextSession})

    await act(async () => {
      resolvePlan(failedResult)
      await inFlight
    })
    expect(result.current.result).toBeUndefined()
    initialSession.store.destroy()
    nextSession.store.destroy()
  })

  test('clearPlan drops the result and discards in-flight work', async () => {
    let resolvePlan!: (value: ComposerV2PlanResult) => void
    const pending = new Promise<ComposerV2PlanResult>(resolve => {
      resolvePlan = resolve
    })
    const {result, initialSession} = setup(() => pending)

    let inFlight: Promise<void>
    act(() => {
      inFlight = result.current.runPlan()
    })
    act(() => {
      result.current.clearPlan()
    })
    await act(async () => {
      resolvePlan(failedResult)
      await inFlight
    })
    expect(result.current.result).toBeUndefined()
    expect(result.current.isPlanning).toBe(false)
    initialSession.store.destroy()
  })

  test.each(['replace', 'clear', 'unmount', 'destroy'] as const)(
    '%s suppresses an old planner failure at the session boundary',
    async action => {
      let finish!: () => void
      const pending = new Promise<void>(resolve => {
        finish = resolve
      })
      const cause = new Error('private planner diagnostic')
      const {result, rerender, unmount, initialSession, onError} = setup(
        async args => {
          await pending
          return planComposerV2({
            ...args,
            dependencies: {
              ...args.dependencies,
              now: () => {
                throw cause
              },
            },
          })
        },
      )
      let run!: Promise<void>
      act(() => {
        run = result.current.runPlan()
      })
      const nextSession = makeSession('next')
      if (action === 'replace') rerender({session: nextSession})
      if (action === 'clear') act(() => result.current.clearPlan())
      if (action === 'unmount') unmount()
      if (action === 'destroy') initialSession.store.destroy()
      await act(async () => {
        finish()
        await run
      })
      expect(onError).not.toHaveBeenCalled()
      initialSession.store.destroy()
      nextSession.store.destroy()
    },
  )

  test('only the current planning attempt reports, without storing its diagnostic in the UI result', async () => {
    const finish: Array<() => void> = []
    const cause = new Error('private planner diagnostic')
    const {result, initialSession, onError} = setup(async args => {
      await new Promise<void>(resolve => finish.push(resolve))
      return planComposerV2({
        ...args,
        dependencies: {
          ...args.dependencies,
          now: () => {
            throw cause
          },
        },
      })
    })
    let first!: Promise<void>
    let second!: Promise<void>
    act(() => {
      first = result.current.runPlan()
      second = result.current.runPlan()
    })
    await act(async () => {
      finish[0]()
      await first
    })
    expect(onError).not.toHaveBeenCalled()
    await act(async () => {
      finish[1]()
      await second
    })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][1]).toBe(cause)
    expect(JSON.stringify(result.current.result)).not.toContain(
      'private planner diagnostic',
    )
    initialSession.store.destroy()
  })

  test('the plan seam receives no write-capable client, only planner deps', async () => {
    const {result, plan, initialSession} = setup()
    await act(async () => {
      await result.current.runPlan()
    })
    const args = plan.mock.calls[0][0]
    /* The runner forwards exactly the declared planner dependencies; the
     * tester never passes an agent or repo-write function through here. */
    expect(Object.keys(args.dependencies).sort()).toEqual(['did'])
    initialSession.store.destroy()
  })
})
