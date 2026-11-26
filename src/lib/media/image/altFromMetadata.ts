import {MAX_ALT_TEXT} from '#/lib/constants'
import {readFileDescriptions} from '#/lib/media/image/fileDescription'
import {getAssetExif} from '#/lib/media/media-library'
import {IS_NATIVE} from '#/env'

type Exif = Record<string, unknown>

/*
 * Cameras and editing tools write these into ImageDescription on their own.
 * They describe the device, not the picture, so they would make bad alt text.
 */
const PLACEHOLDER_DESCRIPTIONS = new Set([
  'default',
  'image',
  'picture',
  'photo',
  'camera',
  'digital camera',
  'olympus digital camera',
  'sony dsc',
  'exif_jpeg_picture',
  'exif jpeg picture',
  'samsung',
  'sams',
  'lg',
  'cimg',
  'dcim',
  'dsc',
  'hdr',
  'screenshot',
])

function asRecord(value: unknown): Exif | undefined {
  return value && typeof value === 'object' ? (value as Exif) : undefined
}

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.replace(/\0/g, '').trim()
  if (!text) return undefined
  if (PLACEHOLDER_DESCRIPTIONS.has(text.toLowerCase())) return undefined
  return text.slice(0, MAX_ALT_TEXT)
}

/**
 * Picks a description the author already wrote into the image file, to use as
 * the initial alt text. Checked in order:
 *
 * 1. IPTC Caption/Abstract (iOS `{IPTC}`), where Photos and most photo tools
 *    store captions
 * 2. TIFF ImageDescription (iOS `{TIFF}`)
 * 3. ImageDescription at the top level (Android)
 */
export function getAltFromExif(exif: unknown): string | undefined {
  const root = asRecord(exif)
  if (!root) return undefined

  return (
    clean(asRecord(root['{IPTC}'])?.['Caption/Abstract']) ??
    clean(asRecord(root['{TIFF}'])?.ImageDescription) ??
    clean(root.ImageDescription)
  )
}

/**
 * The same, read from the file's own bytes, for web, where the picker returns
 * no metadata. XMP comes first: it has the IPTC field meant for alt text.
 */
export function getAltFromFile(buffer: ArrayBuffer): string | undefined {
  const {altText, description, imageDescription} = readFileDescriptions(buffer)
  return clean(altText) ?? clean(description) ?? clean(imageDescription)
}

/**
 * Like `getAltFromExif`, plus two fallbacks. On native it reads the asset from
 * the photo library when the picker's copy has no description: on iOS the copy
 * that `expo-image-picker` hands back can lose the IPTC caption. On web, where
 * there is no metadata at all, it reads the picked file.
 */
export async function resolveAltFromMetadata({
  exif,
  assetId,
  file,
}: {
  exif?: unknown
  assetId?: string | null
  file?: Blob | null
}): Promise<string | undefined> {
  const alt = getAltFromExif(exif)
  if (alt) return alt

  try {
    if (IS_NATIVE && assetId) {
      return getAltFromExif(await getAssetExif(assetId))
    }
    if (!IS_NATIVE && file) {
      return getAltFromFile(await file.arrayBuffer())
    }
  } catch {
    // No photo library access, the asset is gone, or the file can't be read:
    // start with empty alt text.
  }
  return undefined
}
