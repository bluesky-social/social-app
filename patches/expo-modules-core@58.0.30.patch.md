## expo-modules-core Patch

### Android: bitdrift interceptor

Fixes an issue where bitdrift's API stream gets blocked by the Expo interceptor used to power the devtools.

The bitdrift `ApiService/Mux` endpoint is a long-lived gRPC stream, which `shouldParseBody` does not recognise
as a streaming content type (it only skips SSE, RSC, audio and video), so the interceptor tries to peek the body.
Unchanged upstream in 58.0.30 and on expo/expo `main`.

expo-modules-core ships no prebuilt Android AAR (its only prebuilt is the C++ `.so` bundle, which the Kotlin
sources do not affect), so this Kotlin patch always takes effect without a `buildFromSource` entry.

### iOS: don't enumerate every installed font at launch

`ConstantsProvider.constants()` (the source of `expo-constants`) builds a
`systemFonts` list by calling `UIFont.familyNames` and
`UIFont.fontNames(forFamilyName:)` for every family. That makes CoreText load
every installed font, synchronously on the main thread, while the JS thread
waits for the constants during startup.

Nothing in the app reads `Constants.systemFonts`, so the patch returns an empty
list instead.

With Inter registered as TTF on iOS this costs ~15 ms of main thread at launch
on an iPhone 14 Pro. With the WOFF2 fonts it was ~230 ms, because the
enumeration also decompressed them; skipping it then only moved that cost to
the JS thread's first text measurement.

**TODO: Remove when Expo computes `systemFonts` lazily.**

### iOS: find each view's event dispatchers without a full search

`installEventDispatcher` runs for each event of each new Expo view. It walks
`Mirror(reflecting: view).children` to find the `EventDispatcher` property for
the event, which reads every stored property before the match. For
expo-image's `ImageView` that is about 130 reads per view. Fabric never
recycles Expo views, so a scrolling feed pays this for every image it mounts.

The patch remembers, per view class and event, the position of the matching
child, and later views of that class read only that child. The child must
still pass the same check as the search, so a wrong position falls back to
the search and can't connect the wrong dispatcher.

On an iPhone 14, in a constant-speed feed scroll (APP-3837),
`installEventDispatchers` went from 110 to 9 ms per 6 s scroll, and the main
thread total from 1,125 to 1,085 ms.

Upstream: https://github.com/expo/expo/pull/53174

**TODO: Remove when the upstream PR ships.**
