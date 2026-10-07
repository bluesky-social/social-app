/**
 * - `inactive`: no WebView; the placeholder is showing.
 * - `inline`: playing in the feed, so scrolling away should stop it.
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
 * Whether to check if the player has scrolled out of the viewport. In
 * fullscreen the content is reparented out of the WebView, so the wrapper we
 * would measure is an empty placeholder and the user cannot scroll anyway.
 */
export function shouldWatchVisibility(mode: PlayerMode): boolean {
  return mode === 'inline'
}
