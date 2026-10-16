# expo-image: cache downsampled bitmaps on disk (Android)

Glide's default disk strategy for remote images (AUTOMATIC) only caches the
original bytes. Every disk hit therefore re-decodes and re-scales the image on
Glide's pool threads - visible in profiles as Skia bitmap scaling
(`S32_alpha_D32_filter_DX`) running while the feed scrolls, and janky frames
spending 11-13ms uploading freshly decoded textures.

This patch switches feed images (`cachePolicy="disk"` / `"memory-disk"`) to
`DiskCacheStrategy.RESOURCE`, which also caches the downsampled bitmap, so a
repeat hit is a cheap bitmap read instead of a decode.

Measured on a Xiaomi Mi 9T (Snapdragon 730, Android 10) with a scripted
scroll pattern (identical gestures, back-to-back runs): janky frames during
scroll roughly halved (drag-down ~40% -> ~10%, fling-down ~44% -> ~10%).
