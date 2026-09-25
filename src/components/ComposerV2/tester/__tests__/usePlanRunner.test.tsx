import {describe, expect, jest, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {type LinkResolvers} from '#/lib/api/resolve'
import {
  type ComposerV2Plan,
  type ComposerV2PlannerDependencies,
  type ComposerV2PlanResult,
  type planComposerV2,
} from '#/components/ComposerV2/planner'
import {createThreadStore} from '#/components/ComposerV2/store'
import {usePlanRunner} from '#/components/ComposerV2/tester/usePlanRunner'
import {type TesterSession} from '#/components/ComposerV2/tester/useTesterSession'

const resolvers = {} as LinkResolvers
const dependencies: ComposerV2PlannerDependencies = {did: 'did:plc:tester'}

function makeSession(key: string, text = ''): TesterSession {
  return {
    key,
    scenarioId: 'empty',
    store: createThreadStore({
      resolvers,
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
  const initialSession = makeSession('session-1', 'hello world')
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
  return {...hook, plan, initialSession}
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
