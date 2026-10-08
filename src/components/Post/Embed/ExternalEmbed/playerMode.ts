/**
 * - `inactive`: no WebView; the placeholder is showing.
 * - `inline`: mounted in the feed (loading or playing), so scrolling away
 *   should stop it.
 * - `fullscreen`: the content is in native fullscreen.
 *
 * One state rather than separate active and fullscreen flags, so that
 * "fullscreen but inactive" cannot be represented.
 */
export type PlayerMode = 'inactive' | 'inline' | 'fullscreen'

/**
 * Apply a native fullscreen event. Ignored while `inactive`: there is no
 * WebView to be fullscreen, and a late event must not reactivate the player.
 */
export function playerModeAfterFullscreenChange(
  mode: PlayerMode,
  isFullscreen: boolean,
): PlayerMode {
  if (mode === 'inactive') return mode
  return isFullscreen ? 'fullscreen' : 'inline'
}

/**
 * Apply a press on the placeholder. Only promotes from `inactive`: pressing
 * while the content is loading or already fullscreen must not demote it.
 */
export function playerModeAfterActivate(mode: PlayerMode): PlayerMode {
  return mode === 'inactive' ? 'inline' : mode
}

/**
 * Whether to check if the player has scrolled out of the viewport. In
 * fullscreen on Android the content is reparented to the activity root, so the
 * wrapper we would measure is an empty placeholder and the user cannot scroll
 * anyway.
 */
export function shouldWatchVisibility(mode: PlayerMode): boolean {
  return mode === 'inline'
}
