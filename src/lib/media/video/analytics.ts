export const PLAYBACK_START_THRESHOLD_SECONDS = 0.05

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
