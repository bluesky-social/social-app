# expo-bluesky-image-compressor

Re-encodes an image as a JPEG that fits a pixel and byte budget, for uploading.
iOS and Android only. Web does the same with a canvas, in
`src/lib/media/image/compressToFit.web.ts`. The app uses them while the
`image_uploads:native_compression:enable` and
`image_uploads:web_compression:enable` gates are on, and otherwise falls back to
an `expo-image-manipulator` loop (`src/lib/media/image/compressWithManipulator.ts`).

```ts
import {compressImage} from '@bsky.app/expo-bluesky-image-compressor'

const {uri, width, height, size, quality} = await compressImage(path, {
  maxDimension: 4000,
  maxBytes: 2_000_000,
})
```

## How it works

No platform encoder can target a byte size (ImageIO and `Bitmap.compress` only
take a quality), and how big a JPEG comes out at a given quality depends on the
image. So some trial and error is unavoidable, but it can be cheap:

1. **Decode once**, downsampled straight to the target size
   (`CGImageSourceCreateThumbnailAtIndex` on iOS, `inSampleSize` on Android),
   with the EXIF orientation applied. A 12 MP photo is still a ~48 MB bitmap,
   which is why callers should limit how many run at once.
2. **Encode in memory** at a few qualities and only write the winner to disk.
   Each quality is chosen by `QualitySearch`:
   - Start at 90.
   - If that's too big, try the floor (25). If even the floor is too big, give
     up on this size.
   - If it fits but is well under budget, try 100.
   - Otherwise interpolate between the best fit and the smallest miss,
     assuming size grows exponentially with quality, aiming at 95% of the
     budget.
   - Stop once a result fits and uses at least 90% of the budget, the two
     bounds are 1 apart, or after 6 encodes.
3. **Shrink and retry.** If nothing fits, the long side shrinks by 20% and it
   starts again, up to 4 sizes in total.

`QualitySearch` is duplicated in Swift, Kotlin and TypeScript
(`src/lib/media/image/qualitySearch.ts`, which has the tests). Keep them in
sync.

Output has no metadata (so no location) but keeps the color profile, and
transparency is flattened onto white.

## Supported sources

`file://` URIs, absolute paths, and base64 `data:` URIs. Android also accepts
`content://` URIs.
