# react-native-webview@13.17.0.patch

Two related Android fullscreen changes:

1. Hides the whole React root while fullscreen, so the app does not relayout
   for an orientation it never otherwise renders.
2. Adds an `onFullscreenChange` event, reporting when web content enters or
   leaves native fullscreen.

Not yet proposed upstream - the intent is to verify it in this app first, then
open a PR against `react-native-webview`. Until that lands this has to be a
patch, because there is no way to observe the transition from JS.

## Why

Fullscreening a video and rotating the device stopped playback, snapped the app
back to portrait, and left the feed scrolling erratically over blank space.

Fullscreen drops the activity from the app's portrait lock (applied at runtime
by `expo-screen-orientation`, see `app.config.js`) to
`SCREEN_ORIENTATION_UNSPECIFIED`. That is what allows the rotation. The React
tree then lays out for landscape - a layout a portrait-only app never otherwise
produces, and which nobody ever sees, because the fullscreen video covers it.

That layout is what does the damage. `PostFeed` renders `windowSize={9}`
viewports of cells. In landscape the viewport is roughly 2.2x shorter while
embeds get taller (their aspect derives from window width), so the list
rewindows and unmounts the row holding the `WebView`. Destroying the `WebView`
calls `onHideCustomView()`, which restores `initialRequestedOrientation` - hence
the portrait snap - and the video is gone. Device logs put the row's unmount
27ms before the orientation restore, in that order.

So the fix is to stop that layout happening at all, rather than to defend
against its consequences one at a time.

### On the event

The event alone was tried first and is not sufficient: with the frame callback
correctly suspended for the whole of fullscreen, the row was still unmounted by
the list, which no JS-side visibility check has any say over.

It is kept because `ExternalPlayer`'s scroll-away check is genuinely
meaningless during fullscreen - the video is reparented out of the `WebView` and
the wrapper left in the feed is an empty placeholder whose position describes
nothing. Suspending it is correct on its own terms.

Injecting a `fullscreenchange` listener into the page was tried before that and
is not equivalent. Instrumenting the real failure showed the document fires
`fullscreenchange` on the way *in* but never on the way *out*, because
fullscreen is torn down from the native side after the WebView is already being
destroyed. The `WebChromeClient` callbacks are the only authoritative signal.
Injection is also unavailable in practice for cross-origin player frames.

## The patch

- `RNCWebViewManagerImpl.kt` - `onShowCustomView` hides the React root instead
  of just the `WebView`, and `onHideCustomView` restores it.

  The view hidden is the direct child of `android.R.id.content` containing the
  `WebView`, found by walking up the parent chain. Deliberately not
  `mWebView.rootView`, which in the Android API means the decor view: the
  fullscreen video is added to the content view as a *sibling* of the React
  root, so hiding the decor view would hide the video too. (The existing Modal
  branch can hide `mWebView.rootView` precisely because there the `WebView`
  lives in a separate dialog window.) If the hierarchy is not what we expect,
  the walk returns null and the original behaviour is used.

  A `GONE` view is skipped by its parent's measure and layout pass, so the
  React root keeps its portrait size for the duration. `Dimensions` still
  reports landscape to JS - that comes from `DeviceInfoModule` on the config
  change, independent of view visibility - but nothing relayouts against it.

  On exit, `requestedOrientation` is restored *before* the React root is
  revealed. Revealing first would measure it against the still-landscape
  window: the same relayout, on the way out. `requestedOrientation` is
  asynchronous so this narrows the window rather than closing it, but it tested
  clean, including exiting fullscreen while in landscape.

- `events/TopFullscreenChangeEvent.kt` (new) - follows the existing `Top*Event`
  classes; event name `topFullscreenChange`, payload `{isFullscreen: boolean}`.
- `RNCWebViewManagerImpl.kt` - also dispatches the event from
  `onShowCustomView` (`true`) and `onHideCustomView` (`false`).

  Deliberately not routed through `RNCWebView.dispatchEvent`, which assumes a
  live event dispatcher. `onHideCustomView` is also reached from
  `RNCWebView.destroy()`, where the view may already be unmounted and
  `UIManagerHelper.getEventDispatcherForReactTag` returns null - so the
  dispatcher is resolved defensively and the event dropped if there is nothing
  left to deliver it to.
- `newarch/` + `oldarch/RNCWebViewManager.java` - registers the event in
  `getExportedCustomDirectEventTypeConstants`.
- `src/RNCWebViewNativeComponent.ts` - declares the `DirectEventHandler`. Read
  by codegen (`codegenConfig.jsSrcsDir` is `./src`) to generate the native
  interfaces at build time.
- `lib/RNCWebViewNativeComponent.js` - adds the event to the prebuilt static
  view config: both `directEventTypes` and the
  `ConditionallyIgnoredEventHandlers` allow-list.

  This half is easy to miss and fails silently. The package's `main` resolves
  to `lib/`, not `src/`, and React reads this static config at runtime to map
  `topFullscreenChange` onto the `onFullscreenChange` prop. Patching only the
  codegen spec leaves native dispatching an event that React discards as
  unrecognised, with no warning.
- `src/WebViewTypes.ts` + `lib/WebViewTypes.d.ts` - the public prop on
  `AndroidWebViewProps`.

`WebView.android.tsx` needs no change: it forwards unrecognised props to the
native component via `...otherProps`.

iOS is untouched. It has no `WebChromeClient` equivalent, uses
`AVPlayerViewController` for video fullscreen, and does not have this bug. The
prop simply never fires there, so `ExternalPlayer` keeps its existing
behaviour.
