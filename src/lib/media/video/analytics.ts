import {nanoid} from 'nanoid/non-secure'

export const PLAYBACK_START_THRESHOLD_SECONDS = 0.05
export const MIN_PLAYBACK_DURATION_SEGMENT_MS = 250
export const MAX_PLAYBACK_PROGRESS_GAP_MS = 2_500
export const PLAYBACK_DURATION_CHECKPOINT_MS = 30_000

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

export type PlaybackDurationSegment = {
  playbackSessionId: string
  segmentIndex: number
  durationMs: number
  endReason: PlaybackDurationEndReason
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
}: {
  onSegment: (segment: PlaybackDurationSegment) => void
  now?: () => number
  playbackSessionId?: string
}) {
  let active = false
  let playing = false
  let foreground = true
  let buffering = false
  let lastPosition: number | undefined
  let lastObservedAt: number | undefined
  let accumulatedMs = 0
  let segmentIndex = 0

  const eligible = () => active && playing && foreground && !buffering

  const resetObservation = () => {
    lastPosition = undefined
    lastObservedAt = undefined
  }

  const flush = (endReason: PlaybackDurationEndReason) => {
    resetObservation()
    const durationMs = Math.round(accumulatedMs)
    accumulatedMs = 0
    if (durationMs < MIN_PLAYBACK_DURATION_SEGMENT_MS) return
    onSegment({
      playbackSessionId,
      segmentIndex: segmentIndex++,
      durationMs,
      endReason,
    })
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
          if (accumulatedMs >= PLAYBACK_DURATION_CHECKPOINT_MS) {
            flush('checkpoint')
          }
        }
      }
      lastPosition = positionSeconds
      lastObservedAt = observedAt
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
  }
}
