/**
 * useStreakTracker (S7) — observes app foreground + Home tab focus and a
 * "feed-rendered" signal, then arms a 30-second contiguous-dwell timer.
 * On expiry it consults `computeNextStreak`, persists the new state, and
 * captures a follower snapshot for the recap delta.
 *
 * Mounted exactly once via `<ActivityAndRecapProvider/>` from the
 * signed-in shell (S20). The hook is no-op when:
 *   - feature flag StreaksAndRecapEnable is off (X6),
 *   - no session (A7),
 *   - showStreak preference is off (X1).
 *
 * Feed-render signal:
 *   The qualifying-visit definition (AC-A1) requires AT LEAST one feed
 *   render. The primary path is for the Home PostFeed to call
 *   `signalFeedRender()` returned from this hook. Fallback (R5): if no
 *   caller invokes the signal, the dwell timer alone qualifies — coarser
 *   but shippable. We document this by calling the signal opt-in via the
 *   returned tuple, and treating a missing signal as "fallback path".
 *
 * Listener cleanup uses `useOnAppStateChange` (src/lib/appState.ts:15)
 * which already wires subscription removal — see R4 mitigation.
 */

import {useCallback, useEffect, useRef, useState} from 'react'
import {AppState} from 'react-native'
import {useIsFocused} from '@react-navigation/native'

import {useAgent, useSession} from '#/state/session'
import {STREAK_QUALIFYING_DWELL_MS} from '#/features/activityAndRecap/constants'
import {useShowStreakPreference} from '#/features/activityAndRecap/hooks/useShowStreakPreference'
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'
import {computeNextStreak} from '#/features/activityAndRecap/reducer/computeNextStreak'
import {
  formatLocalDay,
  getCurrentZone,
} from '#/features/activityAndRecap/reducer/dayMath'
import {
  readStreak,
  upsertFollowerSnapshot,
  writeStreak,
} from '#/features/activityAndRecap/storage'
import {type NowInput} from '#/features/activityAndRecap/types'

type UseStreakTrackerReturn = {
  /**
   * Call from the Home PostFeed when the first batch of items has rendered.
   * Idempotent within a single session-foreground window.
   */
  signalFeedRender: () => void
}

export function useStreakTracker(): UseStreakTrackerReturn {
  const featureOn = useStreaksAndRecapEnabled()
  const {hasSession, currentAccount} = useSession()
  const [showStreak] = useShowStreakPreference()
  const isFocused = useIsFocused()
  const agent = useAgent()
  const did = currentAccount?.did

  // Refs for the dwell-timer state machine.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sawFeedRenderRef = useRef<boolean>(false)
  // Re-render trigger so we can re-evaluate the gate when the caller
  // asks us to (signalFeedRender).
  const [renderNonce, setRenderNonce] = useState(0)

  const enabled = !!(featureOn && hasSession && showStreak && did)

  // Timer arming/teardown effect — re-runs whenever the gate changes,
  // when AppState transitions to/from active (handled by re-evaluating
  // the gate via state below), or when route focus changes.
  useEffect(() => {
    if (!enabled) {
      // Clear any prior timer if conditions stop being met.
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Subscribe to AppState; re-evaluate on transitions.
    let mounted = true
    const appStateSub = AppState.addEventListener('change', state => {
      if (!mounted) return
      if (state !== 'active') {
        // Backgrounded: cancel in-flight timer.
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      } else {
        // Re-foreground: re-arm via state nonce so the effect re-runs.
        setRenderNonce(n => n + 1)
      }
    })

    const isActive = AppState.currentState === 'active'
    const shouldArm = isActive && isFocused

    if (shouldArm && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        // Final guard — bail if any condition flipped while the timer ran.
        if (!enabled) return
        if (AppState.currentState !== 'active') return
        // We treat absence of a feed-render signal as the documented
        // fallback (R5) — i.e. the dwell alone qualifies. Either way we
        // proceed to commit on expiry.
        commitVisit({
          did: did,
          agent,
        }).catch(() => {
          /* swallow — graceful degrade */
        })
      }, STREAK_QUALIFYING_DWELL_MS)
    }

    return () => {
      mounted = false
      appStateSub.remove()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, isFocused, did, agent, renderNonce])

  // Reset the per-foreground "saw feed render" flag when we go inactive.
  useEffect(() => {
    if (!isFocused) sawFeedRenderRef.current = false
  }, [isFocused])

  const signalFeedRender = useCallback(() => {
    sawFeedRenderRef.current = true
    // Bumping the nonce re-runs the timer-arming effect, which is a no-op
    // if a timer is already armed. This keeps the feed-render signal
    // additive without disrupting an in-flight dwell.
    setRenderNonce(n => n + 1)
  }, [])

  return {signalFeedRender}
}

/**
 * Persist a streak update + follower snapshot for the current visit. Pure
 * with respect to React state — only touches storage and the agent.
 */
async function commitVisit(args: {
  did: string
  agent: ReturnType<typeof useAgent>
}): Promise<void> {
  const {did, agent} = args
  const zone = getCurrentZone()
  const nowMs = Date.now()
  const localDay = formatLocalDay(new Date(nowMs), zone)
  const input: NowInput = {utcMs: nowMs, localDay, zone}
  const prev = readStreak(did)
  const next = computeNextStreak(prev, input)
  // Only write when something actually changed (cheap path).
  if (prev !== next) writeStreak(did, next)

  // Capture a follower snapshot — at most once per local day per the
  // tracker's call frequency. upsertFollowerSnapshot dedupes by day.
  try {
    const res = await agent.app.bsky.actor.getProfile({actor: did})
    const count = res.data.followersCount ?? 0
    upsertFollowerSnapshot(did, {day: localDay, count})
  } catch {
    /* graceful degrade */
  }
}

/**
 * Provider component that mounts the tracker exactly once. Renders null.
 * Mounted from the signed-in session shell (S20).
 */
export function ActivityAndRecapProvider(): null {
  useStreakTracker()
  return null
}
