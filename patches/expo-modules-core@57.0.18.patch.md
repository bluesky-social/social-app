## expo-modules-core Patch

### Android: bitdrift interceptor

Fixes an issue where bitdrift's API stream gets blocked by the Expo interceptor used to power the devtools.

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
