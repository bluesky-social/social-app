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
