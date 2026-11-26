/*
 * Reads a description written into an image file from its bytes, for the
 * platforms where the picker doesn't hand back the metadata (web).
 */

export type FileDescriptions = {
  /** XMP Iptc4xmpCore:AltTextAccessibility, the IPTC field meant for alt text */
  altText?: string
  /** XMP dc:description, where Lightroom and Photoshop keep the caption */
  description?: string
  /** EXIF ImageDescription (JPEG) */
  imageDescription?: string
}

export function readFileDescriptions(buffer: ArrayBuffer): FileDescriptions {
  const bytes = new Uint8Array(buffer)
  const xmp = findXmp(bytes)
  return {
    altText: xmp
      ? readXmpText(xmp, 'Iptc4xmpCore:AltTextAccessibility')
      : undefined,
    description: xmp ? readXmpText(xmp, 'dc:description') : undefined,
    imageDescription: readExifImageDescription(bytes),
  }
}

const XMP_START = '<x:xmpmeta'
const XMP_END = '</x:xmpmeta>'

function findXmp(bytes: Uint8Array): string | undefined {
  // latin1 keeps one character per byte, so indexes map back to the bytes.
  const raw = new TextDecoder('latin1').decode(bytes)
  const start = raw.indexOf(XMP_START)
  if (start < 0) return undefined
  const end = raw.indexOf(XMP_END, start)
  if (end < 0) return undefined
  return new TextDecoder('utf-8').decode(
    bytes.subarray(start, end + XMP_END.length),
  )
}

/**
 * The XMP language alternatives of `property`: the x-default entry, or the
 * first one. Also accepts the property written as a plain element or attribute.
 */
function readXmpText(xmp: string, property: string): string | undefined {
  const name = escapeRegExp(property)
  const element = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`).exec(
    xmp,
  )
  if (element) {
    const items = [
      ...element[1].matchAll(/<rdf:li\b([^>]*)>([\s\S]*?)<\/rdf:li>/g),
    ]
    const preferred =
      items.find(item => /xml:lang=["']x-default["']/.test(item[1])) ?? items[0]
    const text = preferred ? preferred[2] : element[1]
    return decodeXml(text) || undefined
  }
  const attribute = new RegExp(`\\s${name}=(["'])([\\s\\S]*?)\\1`).exec(xmp)
  return attribute ? decodeXml(attribute[2]) || undefined : undefined
}

function decodeXml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const IMAGE_DESCRIPTION_TAG = 0x010e
const ASCII_TYPE = 2

/** EXIF ImageDescription from IFD0 of a JPEG's APP1 segment. */
function readExifImageDescription(bytes: Uint8Array): string | undefined {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  let offset = 2
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1]
    const length = view.getUint16(offset + 2)
    // Start of scan: the metadata segments all come before the image data.
    if (marker === 0xda) return undefined
    const segment = offset + 4
    if (marker === 0xe1 && isExifHeader(bytes, segment)) {
      // A truncated file can declare a segment longer than what is there.
      const end = Math.min(segment + length - 2, bytes.length)
      return readIfd0Description(view, segment + 6, end)
    }
    offset = segment + length - 2
  }
  return undefined
}

function isExifHeader(bytes: Uint8Array, at: number): boolean {
  // "Exif\0\0"
  return (
    bytes[at] === 0x45 &&
    bytes[at + 1] === 0x78 &&
    bytes[at + 2] === 0x69 &&
    bytes[at + 3] === 0x66 &&
    bytes[at + 4] === 0 &&
    bytes[at + 5] === 0
  )
}

function readIfd0Description(
  view: DataView,
  tiff: number,
  end: number,
): string | undefined {
  if (tiff + 8 > end) return undefined
  const order = view.getUint16(tiff)
  if (order !== 0x4949 && order !== 0x4d4d) return undefined
  const little = order === 0x4949
  const ifd = tiff + view.getUint32(tiff + 4, little)
  if (ifd + 2 > end) return undefined

  const count = view.getUint16(ifd, little)
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12
    if (entry + 12 > end) return undefined
    if (view.getUint16(entry, little) !== IMAGE_DESCRIPTION_TAG) continue
    if (view.getUint16(entry + 2, little) !== ASCII_TYPE) return undefined
    const length = view.getUint32(entry + 4, little)
    // Values up to 4 bytes sit in the entry itself; longer ones are elsewhere.
    const start =
      length <= 4 ? entry + 8 : tiff + view.getUint32(entry + 8, little)
    if (start + length > end) return undefined
    const text = new TextDecoder('utf-8').decode(
      new Uint8Array(view.buffer, view.byteOffset + start, length),
    )
    return text.replace(/\0+$/, '') || undefined
  }
  return undefined
}
