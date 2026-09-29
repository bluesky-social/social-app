import {useEffect, useRef, useState} from 'react'
import {nanoid} from 'nanoid/non-secure'

import {type LinkResolvers} from '#/lib/api/resolve'
import {type TesterScenarioId} from '#/view/screens/DebugComposer/scenarios'
import {reportInitializationError} from '#/components/ComposerV2/adapters'
import {type ComposerV2OnError} from '#/components/ComposerV2/errors'
import {type ThreadStore} from '#/components/ComposerV2/hooks'
import {createThreadStore} from '#/components/ComposerV2/store'
import {type ThreadStoreInitialState} from '#/components/ComposerV2/store/types'
import {type UploadDependencies} from '#/components/ComposerV2/store/uploads'

/** One isolated tester session wrapping one store instance. */
export type TesterSession = {
  /**
   * Unique per store instance. Keying the editor subtree with this value
   * remounts every uncontrolled input on reset, so text never sticks from a
   * previous session.
   */
  key: string
  scenarioId: TesterScenarioId
  store: ThreadStore
}

/**
 * Typed scenario-build failure. The tester renders a static localized
 * message from this shape; raw resolver/adapter exception text never reaches
 * the UI. Diagnostics are available only to the optional session policy.
 */
export type TesterScenarioError = {
  code: 'scenario-build-failed'
  scenarioId: TesterScenarioId
}

export type TesterSessionDeps = {
  /** Sessions are scoped to one account; a change destroys the session. */
  accountDid: string | undefined
  resolvers: LinkResolvers
  media: UploadDependencies
  /** Captured per session, including eager construction failures. No default sink. */
  onError?: ComposerV2OnError
  /** Test seam; production always uses the real store constructor. */
  __createStore?: typeof createThreadStore
}

/**
 * Owns the tester's isolated store lifecycle. Sessions are only ever created
 * from normalized initial input through the store constructor - never by
 * dispatching live actions - and the previous store is destroyed whenever a
 * session is replaced, the account changes, or the tester unmounts. Async
 * scenario builders are guarded by a request token so a stale build can never
 * populate a newer session.
 */
export function useTesterSession(deps: TesterSessionDeps) {
  /*
   * Dependencies are read at store-construction time. Client identity is
   * account-scoped, and account changes rebuild the session below.
   */
  const depsRef = useRef(deps)
  depsRef.current = deps

  const requestRef = useRef(0)
  const [isApplyingScenario, setIsApplyingScenario] = useState(false)
  const [scenarioError, setScenarioError] = useState<
    TesterScenarioError | undefined
  >()
  const lastInitialStateRef = useRef<ThreadStoreInitialState>({})
  const activeStoreRef = useRef<ThreadStore | undefined>(undefined)

  function createSession(
    scenarioId: TesterScenarioId,
    initialState: ThreadStoreInitialState,
  ): TesterSession {
    const current = depsRef.current
    const create = current.__createStore ?? createThreadStore
    const store = create({
      resolvers: current.resolvers,
      media: current.media,
      initialState,
      onError: current.onError,
    })
    /* Retire ownership immediately, not after React's next effect cleanup. */
    activeStoreRef.current?.destroy()
    activeStoreRef.current = store
    lastInitialStateRef.current = initialState
    return {key: nanoid(), scenarioId, store}
  }

  const [session, setSession] = useState<TesterSession>(() =>
    createSession('empty', {}),
  )

  /* Destroy replaced stores and the final store on unmount. */
  const store = session.store
  useEffect(() => () => store.destroy(), [store])

  /*
   * Invalidate any in-flight scenario build on unmount. Without this, a
   * deferred builder could resolve after navigation away, construct a fresh
   * store, and start eager workers with no owner left to destroy them.
   */
  useEffect(
    () => () => {
      requestRef.current += 1
    },
    [],
  )

  function replaceSession(
    scenarioId: TesterScenarioId,
    initialState: ThreadStoreInitialState,
  ) {
    /* Invalidate any in-flight async scenario build. */
    requestRef.current += 1
    setIsApplyingScenario(false)
    setScenarioError(undefined)
    setSession(createSession(scenarioId, initialState))
  }

  async function applyScenario(
    scenarioId: TesterScenarioId,
    build: () => Promise<ThreadStoreInitialState> | ThreadStoreInitialState,
  ) {
    const token = ++requestRef.current
    setScenarioError(undefined)
    setIsApplyingScenario(true)
    const accountDid = depsRef.current.accountDid
    let constructing = false
    try {
      /* Builders omit adapter callbacks: this guarded caller owns reporting. */
      const initialState = await build()
      if (
        token !== requestRef.current ||
        accountDid !== depsRef.current.accountDid
      )
        return
      constructing = true
      setSession(createSession(scenarioId, initialState))
    } catch (error) {
      if (
        token !== requestRef.current ||
        accountDid !== depsRef.current.accountDid
      )
        return
      setScenarioError({code: 'scenario-build-failed', scenarioId})
      /* Construction reports at its own boundary; do not report it twice. */
      if (!constructing) {
        reportInitializationError(
          session.store.reportError,
          error,
          'scenario-build-failed',
        )
      }
    } finally {
      if (token === requestRef.current) setIsApplyingScenario(false)
    }
  }

  /** Rebuild the current scenario from its original normalized input. */
  function resetSession() {
    replaceSession(session.scenarioId, lastInitialStateRef.current)
  }

  /* Account changes destroy the session and start over with an empty one. */
  const accountDid = deps.accountDid
  const previousDidRef = useRef(accountDid)
  useEffect(() => {
    if (previousDidRef.current === accountDid) return
    previousDidRef.current = accountDid
    replaceSession('empty', {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountDid])

  return {
    session,
    isApplyingScenario,
    scenarioError,
    applyScenario,
    resetSession,
  }
}
