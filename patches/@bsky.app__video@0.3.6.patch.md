# @bsky.app/video+0.3.6.patch

Stops video players from blocking the Android main thread while the feed scrolls.

`ExoPlayer.release()` waits on the calling thread until the player's playback thread has
released it, up to `releaseTimeoutMs` (500 ms by default). The player's application thread
is the main thread, and the playback thread is often busy at that moment creating or
releasing codecs, so every video row that scrolled out of the feed's clip rect froze the
main thread for 40-130 ms (`removeClippedSubviews` detaches it, and `onDetachedFromWindow`
released the player). On a Galaxy A16 that was ~7 stalls per 20-fling run and 25-36% of
all frames missed while scrolling.

The patch:

- Builds the player with `setReleaseTimeoutMs(0)`, so `release()` posts the release to the
  playback thread and returns immediately. The playback thread still frees the codecs and
  quits; only the wait is gone.
- Releases the player before `super.onDetachedFromWindow()` detaches the `SurfaceView`.
  Otherwise `surfaceDestroyed` makes the still-live player block until the playback thread
  lets go of the surface.
- Keeps the surface handoff synchronous (`clearVideoSurface()`) when a player is released
  while the view stays attached (`setIsCurrentlyActive(false)`), so the next player can
  attach to the same surface.

Should be upstreamed to bluesky-social/bluesky-video.
