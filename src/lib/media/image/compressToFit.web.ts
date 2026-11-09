import {compressWithManipulator} from '#/lib/media/image/compressWithManipulator'
import {QualitySearch} from '#/lib/media/image/qualitySearch'
import {type PickerImage} from '#/lib/media/picker.shared'
import {type ImageMeta} from '#/state/gallery'
import {Features, features} from '#/analytics/features'

/** Same as expo-bluesky-image-compressor on native. */
const MAX_DIMENSION_ATTEMPTS = 4
const SHRINK_FACTOR = 0.8

/**
 * Re-encodes the image as a JPEG that fits `maxDimension` and `maxSize`. Works
 * like expo-bluesky-image-compressor on native: it decodes the image once,
 * draws it at the target size, and tries qualities in memory, making a blob URL
 * only for the winner.
 */
export async function compressToFit(
  source: ImageMeta,
  {maxDimension, maxSize}: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  if (!features.isOn(Features.ImageUploadsWebCompressionEnable)) {
    return compressWithManipulator(source, {maxDimension, maxSize})
  }

  const image = await decode(source)
  try {
    let longSide = Math.min(Math.max(image.width, image.height), maxDimension)

    for (let attempt = 0; attempt < MAX_DIMENSION_ATTEMPTS; attempt++) {
      const canvas = draw(image, longSide)
      try {
        const fit = await findEncoding(canvas, maxSize)
        if (fit) {
          return {
            path: URL.createObjectURL(fit.payload),
            width: canvas.width,
            height: canvas.height,
            mime: 'image/jpeg',
            size: fit.size,
          }
        }
        longSide = Math.floor(
          Math.max(canvas.width, canvas.height) * SHRINK_FACTOR,
        )
      } finally {
        releaseCanvas(canvas)
      }
    }
  } finally {
    image.close()
  }

  throw new Error('Unable to compress image')
}

/**
 * Decodes at full size, upright. Not an `<img>`: iOS Safari draws large ones
 * from a lower resolution copy, so the output comes out blurry.
 */
async function decode(source: ImageMeta) {
  const blob = await (await fetch(source.path)).blob()
  if (blob.type === 'image/svg+xml') {
    return decodeSvg(blob, source)
  }
  return createImageBitmap(blob, {imageOrientation: 'from-image'})
}

/**
 * `createImageBitmap` can't decode vector images, so SVGs are drawn with an
 * `<img>` first, at the size it gives them (or the size the picker measured,
 * if the SVG has none).
 */
async function decodeSvg(blob: Blob, source: ImageMeta) {
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const {canvas, context} = createCanvas(
      image.naturalWidth || source.width,
      image.naturalHeight || source.height,
    )
    try {
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      return await createImageBitmap(canvas)
    } finally {
      releaseCanvas(canvas)
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Draws the image with its long side at `longSide` (never upscaling), onto
 * white since JPEG has no transparency.
 */
function draw(image: ImageBitmap, longSide: number) {
  const scale = Math.min(longSide / Math.max(image.width, image.height), 1)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  /*
   * Halve it first while it's more than twice the target size. Firefox
   * samples too few pixels when a single draw shrinks an image by more than
   * half, which turns fine detail like leaves into speckles.
   */
  let source: ImageBitmap | HTMLCanvasElement = image
  let sourceWidth = image.width
  let sourceHeight = image.height
  while (sourceWidth / 2 >= width && sourceHeight / 2 >= height) {
    sourceWidth = Math.round(sourceWidth / 2)
    sourceHeight = Math.round(sourceHeight / 2)
    const half = createCanvas(sourceWidth, sourceHeight)
    half.context.drawImage(source, 0, 0, sourceWidth, sourceHeight)
    if (source instanceof HTMLCanvasElement) {
      releaseCanvas(source)
    }
    source = half.canvas
  }

  const {canvas, context} = createCanvas(width, height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(source, 0, 0, width, height)
  if (source instanceof HTMLCanvasElement) {
    releaseCanvas(source)
  }
  return canvas
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not create a canvas')
  }
  context.imageSmoothingQuality = 'high'
  return {canvas, context}
}

async function findEncoding(canvas: HTMLCanvasElement, maxBytes: number) {
  const search = new QualitySearch<Blob>(maxBytes)
  for (
    let quality = search.nextQuality();
    quality !== null;
    quality = search.nextQuality()
  ) {
    const blob = await encode(canvas, quality)
    search.record(quality, blob.size, blob)
  }
  return search.best
}

function encode(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Could not encode the image'))
        }
      },
      'image/jpeg',
      quality / 100,
    )
  })
}

/**
 * Safari keeps a canvas's pixels until it's garbage collected unless it's
 * shrunk to nothing.
 */
function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0
  canvas.height = 0
}
