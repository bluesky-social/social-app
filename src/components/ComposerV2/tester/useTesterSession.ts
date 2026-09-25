import {useEffect, useRef, useState} from 'react'
import {nanoid} from 'nanoid/non-secure'

import {type LinkResolvers} from '#/lib/api/resolve'
import {logger} from '#/logger'
import {type ThreadStore} from '#/components/ComposerV2/hooks'
import {createThreadStore} from '#/components/ComposerV2/store'
import {type ThreadStoreInitialState} from '#/components/ComposerV2/store/types'
import {type UploadDependencies} from '#/components/ComposerV2/store/uploads'
import {type TesterScenarioId} from '#/components/ComposerV2/tester/scenarios'

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
 * the UI (it goes to the logger instead).
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

  function createSession(
    scenarioId: TesterScenarioId,
    initialState: ThreadStoreInitialState,
  ): TesterSession {
    const current = depsRef.current
    const create = current.__createStore ?? createThreadStore
    lastInitialStateRef.current = initialState
    return {
      key: nanoid(),
      scenarioId,
      store: create({
        resolvers: current.resolvers,
        media: current.media,
        initialState,
      }),
    }
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
    try {
      const initialState = await build()
      if (token !== requestRef.current) return
      setSession(createSession(scenarioId, initialState))
    } catch (error) {
      if (token !== requestRef.current) return
      /* Keep the raw exception out of the tester UI. */
      logger.error('ComposerV2 tester: scenario build failed', {
        safeMessage: error,
      })
      setScenarioError({code: 'scenario-build-failed', scenarioId})
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
