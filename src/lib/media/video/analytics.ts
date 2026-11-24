import {nanoid} from 'nanoid/non-secure'

export const PLAYBACK_START_THRESHOLD_SECONDS = 0.05
export const MIN_PLAYBACK_DURATION_SEGMENT_MS = 250
export const MAX_PLAYBACK_PROGRESS_GAP_MS = 2_500
export const PLAYBACK_DURATION_CHECKPOINT_MS = 30_000
/**
 * A jump back to within this many seconds of the start counts as a new loop.
 * Generous enough for the native embed, whose progress ticks once a second in
 * whole seconds.
 */
export const LOOP_RESTART_WINDOW_SECONDS = 1.5
/**
 * Players often stop briefly at the seam of a loop (a pause on native, a
 * buffering stall on web). A pause or stall is held this long before it ends
 * the segment, so that if playback resumes from the start it ends as `looped`.
 */
export const LOOP_SEAM_WINDOW_MS = 2_000

/**
 * A small positive threshold distinguishes rendered playback from metadata
 * loading and zero-valued player callbacks while still representing the first
 * frame across the frame rates we support.
 */
export function hasPlaybackStarted(progressSeconds: number): boolean {
  return (
    Number.isFinite(progressSeconds) &&
    progressSeconds >= PLAYBACK_START_THRESHOLD_SECONDS
  )
}

export type PlaybackDurationEndReason =
  | 'paused'
  | 'deactivated'
  | 'backgrounded'
  | 'buffering'
  | 'checkpoint'
  | 'ended'
  | 'error'
  | 'unmounted'
  /** Playback went back to the start, so the next segment is a new loop. */
  | 'looped'
  /** The surface split the segment because its playback state changed. */
  | 'muteChanged'
  | 'fullscreenChanged'

export type PlaybackDurationSegment = {
  playbackSessionId: string
  segmentIndex: number
  durationMs: number
  endReason: PlaybackDurationEndReason
  /**
   * Which time through the video this segment is: 0 for the first watch, 1
   * for the second, and so on. Loops, replays and seeking back to the start
   * all start a new loop.
   */
  loop: number
}

export type PlaybackDurationTracker = ReturnType<
  typeof createPlaybackDurationTracker
>

/**
 * Counts wall-clock time between advancing playback callbacks. Using wall time
 * means seeking cannot inflate the result; requiring progress callbacks means
 * buffering and suspended JS cannot create watch time either.
 */
export function createPlaybackDurationTracker({
  onSegment,
  now = () => performance.now(),
  playbackSessionId = nanoid(),
  enabled = true,
  onHoldResolved,
}: {
  onSegment: (segment: PlaybackDurationSegment) => void
  /**
   * Called once a held pause or stall is resolved (after its segment, if any,
   * is emitted): `looped` if playback resumed from the start.
   */
  onHoldResolved?: (looped: boolean) => void
  now?: () => number
  playbackSessionId?: string
  /** When false, no watch time is accumulated and no segments are emitted. */
  enabled?: boolean
}) {
  let active = false
  let playing = false
  let foreground = true
  let buffering = false
  let lastPosition: number | undefined
  let lastObservedAt: number | undefined
  let accumulatedMs = 0
  let segmentIndex = 0
  let loop = 0
  /**
   * Last position seen in this session. Unlike `lastPosition`, this survives
   * pauses, so a replay after the video ends still counts as a new loop.
   */
  let lastSessionPosition: number | undefined
  /** A pause or stall that may turn out to be the seam of a loop. */
  let held:
    | {
        endReason: 'paused' | 'buffering'
        timer: ReturnType<typeof setTimeout>
      }
    | undefined

  const eligible = () =>
    enabled && active && playing && foreground && !buffering

  const resetObservation = () => {
    lastPosition = undefined
    lastObservedAt = undefined
  }

  /** Emits the accumulated time, without touching the observation state. */
  const emit = (endReason: PlaybackDurationEndReason) => {
    const durationMs = Math.round(accumulatedMs)
    accumulatedMs = 0
    if (durationMs < MIN_PLAYBACK_DURATION_SEGMENT_MS) return
    onSegment({
      playbackSessionId,
      segmentIndex: segmentIndex++,
      durationMs,
      endReason,
      loop,
    })
  }

  /**
   * Resolves a held stop. Its segment keeps the held reason, except that a
   * final reason wins so the segment is still sent right away.
   */
  const release = (endReason?: PlaybackDurationEndReason) => {
    if (!held) return
    const heldReason = held.endReason
    clearTimeout(held.timer)
    held = undefined
    emit(
      endReason === 'backgrounded' || endReason === 'unmounted'
        ? endReason
        : heldReason,
    )
    onHoldResolved?.(false)
  }

  /** Ends the current segment, resolving a held stop first. */
  const end = (endReason: PlaybackDurationEndReason) => {
    release(endReason)
    emit(endReason)
  }

  const hold = (endReason: 'paused' | 'buffering') => {
    // Nothing accrues while held, so an earlier hold already covers this one.
    if (held) return
    held = {
      endReason,
      timer: setTimeout(() => release(), LOOP_SEAM_WINDOW_MS),
    }
  }

  const flush = (endReason: PlaybackDurationEndReason) => {
    resetObservation()
    end(endReason)
  }

  const transition = (
    update: () => void,
    endReason: PlaybackDurationEndReason,
  ) => {
    const wasEligible = eligible()
    update()
    if (wasEligible && !eligible()) {
      resetObservation()
      if (endReason === 'paused' || endReason === 'buffering') {
        hold(endReason)
      } else {
        end(endReason)
      }
    }
    if (!wasEligible && eligible()) resetObservation()
  }

  return {
    observeProgress(positionSeconds: number) {
      if (!eligible() || !Number.isFinite(positionSeconds)) {
        resetObservation()
        return
      }
      const observedAt = now()
      if (
        lastObservedAt !== undefined &&
        lastPosition !== undefined &&
        positionSeconds !== lastPosition
      ) {
        const elapsed = observedAt - lastObservedAt
        if (elapsed > 0 && elapsed <= MAX_PLAYBACK_PROGRESS_GAP_MS) {
          accumulatedMs += elapsed
        }
      }
      const looped =
        lastSessionPosition !== undefined &&
        positionSeconds < lastSessionPosition &&
        positionSeconds <= LOOP_RESTART_WINDOW_SECONDS
      if (looped) {
        // Time up to the wrap belongs to the loop that just finished.
        const wasHeld = !!held
        if (held) {
          clearTimeout(held.timer)
          held = undefined
        }
        emit('looped')
        loop++
        if (wasHeld) onHoldResolved?.(true)
      } else if (held) {
        // Resumed without wrapping, so the stop was a real pause or stall.
        release()
      } else if (accumulatedMs >= PLAYBACK_DURATION_CHECKPOINT_MS) {
        emit('checkpoint')
      }
      lastPosition = positionSeconds
      lastObservedAt = observedAt
      lastSessionPosition = positionSeconds
    },
    setActive(value: boolean) {
      transition(() => (active = value), 'deactivated')
    },
    setPlaying(value: boolean) {
      transition(() => (playing = value), 'paused')
    },
    setForeground(value: boolean) {
      transition(() => (foreground = value), 'backgrounded')
    },
    setBuffering(value: boolean) {
      transition(() => (buffering = value), 'buffering')
    },
    flush,
    /**
     * Ends the current segment without interrupting playback tracking, e.g.
     * because the surface's playback state changed.
     */
    split(endReason: PlaybackDurationEndReason) {
      end(endReason)
    },
    /** Whether a pause or stall is being held to see if it was a loop seam. */
    isHolding() {
      return !!held
    },
  }
}
