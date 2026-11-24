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
}: {
  onSegment: (segment: PlaybackDurationSegment) => void
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

  const flush = (endReason: PlaybackDurationEndReason) => {
    resetObservation()
    emit(endReason)
  }

  const transition = (
    update: () => void,
    endReason: PlaybackDurationEndReason,
  ) => {
    const wasEligible = eligible()
    update()
    if (wasEligible && !eligible()) flush(endReason)
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
        emit('looped')
        loop++
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
      emit(endReason)
    },
  }
}
