# react-native-webview@13.17.0.patch

Two Android fullscreen changes:

1. Hides the whole React root while fullscreen, so the app does not relayout
   for an orientation it never otherwise renders.
2. Adds an `onFullscreenChange` event, reporting when web content enters or
   leaves native fullscreen.

Not yet proposed upstream. Delete the "Why" section along with the patch once
upstreamed.

## Why

Fullscreening a video and rotating the device stopped playback, snapped the app
back to portrait, and left the feed scrolling erratically over blank space.

Fullscreen unlocks the app's portrait lock (`src/App.tsx`), which allows the
rotation. The React tree then lays out for landscape, a layout nobody sees
because the video covers it. `PostFeed` sets a large `windowSize`, so in the
shorter landscape viewport the list rewindows and unmounts the row holding the
`WebView`. Destroying the `WebView` calls `onHideCustomView()`, which restores
the portrait lock, and the video is gone.

The fix is to stop that layout happening at all. The event alone is not enough:
the list unmounts the row regardless of what JS does. It is kept because
`ExternalPlayer`'s scroll-away check is meaningless during fullscreen (the
wrapper left in the feed is an empty placeholder), so it needs a signal to
suspend it. Injecting a `fullscreenchange` listener into the page is not
equivalent: the document does not reliably fire it on the way out, and
injection is unavailable for cross-origin player frames.

## The patch

- `RNCWebViewManagerImpl.kt`
  - `onShowCustomView` hides the React root instead of just the `WebView`.
    `onHideCustomView` restores it.
  - The root is the direct child of `android.R.id.content` containing the
    `WebView`, found by walking up the parents. Not `mWebView.rootView` (the
    decor view): the video is a *sibling* of the React root there, so hiding the
    decor view would hide the video. If the walk fails, a warning is logged and
    only the `WebView` is hidden (the old behaviour, which does not prevent the
    relayout).
  - A `GONE` view is skipped by measure and layout, so the root keeps its
    portrait size for the duration.
  - The hidden view is recorded on entry, never re-derived: `onHideCustomView`
    is also reached from `RNCWebView.destroy()` after unmount, when the
    hierarchy can no longer be walked.
  - Exit runs in a `finally`: restore the view, remove the lifecycle listener,
    dispatch `isFullscreen=false`. An exception cannot strand a hidden root or
    leave JS stuck in `fullscreen`.
  - `requestedOrientation` is restored *before* revealing the root, so the root
    is not measured against the still-landscape window. It is asynchronous, so
    this narrows the window rather than closing it.
  - Dispatches the event from both callbacks. Not via `RNCWebView.dispatchEvent`,
    which assumes a live dispatcher: after `destroy()` there may be none, so the
    event is dropped (logged at warn for `true`). Consumers must not rely on
    receiving `false`.
- `events/TopFullscreenChangeEvent.kt` (new) - `topFullscreenChange`, payload
  `{isFullscreen: boolean}`.
- `newarch/` + `oldarch/RNCWebViewManager.java` - registers the event.
- `src/RNCWebViewNativeComponent.ts` - declares the handler for codegen. The
  iOS emitter is regenerated too and never fires it.
- `lib/RNCWebViewNativeComponent.{js,d.ts}` - same, in the prebuilt files. The
  static view config in `.js` is easy to miss and fails silently: the package
  `main` resolves to `lib/`, and without it React discards the event as
  unrecognised.
- `src/WebViewTypes.ts` + `lib/WebViewTypes.d.ts` - the public prop on
  `AndroidWebViewProps`.

iOS is unchanged: it uses `AVPlayerViewController` and does not have this bug.
The prop never fires there.

## Before proposing upstream

Not handled, because this app's WebView props are static:

- `setupWebChromeClient` re-running mid-fullscreen swaps the client without
  calling the old `onHideCustomView()`, orphaning `hiddenView` as `GONE`. Call
  the old client's `onHideCustomView()` first, or hold the state on the manager.
- No automated native coverage of root restoration on exit and on destroy.
