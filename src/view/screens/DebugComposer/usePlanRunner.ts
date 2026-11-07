import {useEffect, useRef, useState, useSyncExternalStore} from 'react'

import {
  type PlanSummary,
  summarizeThreadPlan,
} from '#/view/screens/DebugComposer/summarizeThreadPlan'
import {type TesterSession} from '#/view/screens/DebugComposer/useTesterSession'
import {
  type PlannerDependencies,
  planThread,
  type ThreadPlan,
} from '#/components/ComposerV2/planner'
import {type ThreadState} from '#/components/ComposerV2/store/types'

/** One completed planning attempt, bound to the session that produced it. */
export type PlanRunnerResult = {
  sessionKey: string
  /** The immutable snapshot the plan was computed from. */
  snapshot: ThreadState
  summary: PlanSummary
  /** The exact successful plan, retained for a separate explicit write action. */
  plan: ThreadPlan | undefined
  /** Full planned writes for inspection in the tester, never logged. */
  writes: ThreadPlan['writes'] | undefined
  skipEmptyPostsConfirmed: boolean
}

/**
 * Runs the no-write planner against the current session and keeps its result
 * honest: a result is cleared when the session changes, an in-flight plan for
 * an older session is discarded instead of populating a newer one, and edits
 * after capture mark the shown result as stale by snapshot identity.
 */
export function usePlanRunner({
  session,
  dependencies,
  requireAltText,
  __plan = planThread,
}: {
  session: TesterSession
  dependencies: PlannerDependencies
  requireAltText: boolean
  /** Test seam; production always uses the real planner. */
  __plan?: typeof planThread
}) {
  const [isPlanning, setIsPlanning] = useState(false)
  const [result, setResult] = useState<PlanRunnerResult | undefined>()
  const requestRef = useRef(0)

  const sessionKeyRef = useRef(session.key)
  sessionKeyRef.current = session.key
  const dependenciesRef = useRef(dependencies)
  dependenciesRef.current = dependencies
  const requireAltTextRef = useRef(requireAltText)
  requireAltTextRef.current = requireAltText

  /* Reset/scenario/account changes replace the session: drop stale output. */
  useEffect(() => {
    requestRef.current += 1
    setResult(undefined)
    setIsPlanning(false)
    return () => {
      requestRef.current += 1
    }
  }, [session.key])

  const currentState = useSyncExternalStore(
    session.store.subscribe,
    session.store.getState,
  )

  async function runPlan({
    skipEmptyPostsConfirmed = false,
  }: {skipEmptyPostsConfirmed?: boolean} = {}) {
    const token = ++requestRef.current
    const sessionKey = session.key
    const snapshot = session.store.getState()
    setIsPlanning(true)
    try {
      const planned = await __plan({
        snapshot,
        dependencies: dependenciesRef.current,
        onError: (event, cause) => {
          if (
            token !== requestRef.current ||
            sessionKey !== sessionKeyRef.current
          )
            return
          session.store.reportError(event, cause)
        },
        preflight: {
          requireAltText: requireAltTextRef.current,
          skipEmptyPostsConfirmed,
        },
      })
      if (token !== requestRef.current) return
      if (sessionKey !== sessionKeyRef.current) return
      setResult({
        sessionKey,
        snapshot,
        summary: summarizeThreadPlan({result: planned}),
        plan: planned.ok ? planned : undefined,
        writes: planned.ok ? planned.writes : undefined,
        skipEmptyPostsConfirmed,
      })
    } finally {
      if (token === requestRef.current) setIsPlanning(false)
    }
  }

  function clearPlan() {
    requestRef.current += 1
    setResult(undefined)
    setIsPlanning(false)
  }

  const visibleResult = result?.sessionKey === session.key ? result : undefined
  const isStale =
    visibleResult !== undefined && visibleResult.snapshot !== currentState

  return {
    isPlanning,
    result: visibleResult,
    isStale,
    runPlan,
    clearPlan,
  }
}
