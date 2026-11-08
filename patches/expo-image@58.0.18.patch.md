## expo-image Patch

### iOS: downscale images off the main thread

When a loaded image is larger than the view it is displayed in, expo-image
redraws it at the display size (`resize(image:toSize:scale:)`, a
`UIGraphicsImageRenderer` draw) inside the load completion handler, which runs
on the main thread. For photos and banners this takes several milliseconds per
image, often in the middle of mounting a screen or scrolling a feed.

The patch runs that redraw on a background queue and renders the result back
on the main thread. A load generation counter, bumped whenever the pending load
is cancelled (new source, recycling, deallocation), drops results for a load
the view no longer shows. Animated images and the no-downscale path are
unchanged.

**TODO: Remove if upstream moves downscaling off the main thread.**

### Android: less work when an image mounts

`ExpoImageViewWrapper` creates two `ExpoImageView`s (`AppCompatImageView`s) for
every image. The second one only holds the next image while the current one is
still displayed, so the patch creates it the first time it is needed.

React Native sets props before the first layout. At that point the view is
0×0, so `rerenderIfNeeded` builds the request models, then `cleanIfNeeded`
discards them. The real load starts in `onSizeChanged`. The patch skips
`rerenderIfNeeded` until the view has had a size, and starts the image views
hidden, which is the state `cleanIfNeeded` used to leave them in. Images that
stay 0×0 behave as before: Android never loads them.

`ExpoImageView` also extends `ImageView` instead of `AppCompatImageView`. The
AppCompat constructor checks the theme and reads tint and `srcCompat`
attributes that expo-image never sets, and expo-image uses no AppCompat
behaviour.

expo-image ships a prebuilt Android AAR, so it is in
`expo.autolinking.android.buildFromSource` in `package.json`. Without that,
Gradle uses the AAR and ignores this part of the patch.

**TODO: Remove this part and the `buildFromSource` entry once the upstream PRs
ship.**
