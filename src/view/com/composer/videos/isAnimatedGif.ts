/**
 * Checks if a GIF is animated. Cooked up by Claude, validated with some examples.
 * @param bytes - The GIF bytes, as a Uint8Array.
 * @returns An object with properties isGif, isAnimated, and frames.
 */
export function isAnimatedGif(buffer: ArrayBuffer): {
  isGif: boolean
  isAnimated: boolean
  frames: number
} {
  const bytes = new Uint8Array(buffer)
  // Verify GIF signature
  const sig = String.fromCharCode(...bytes.slice(0, 6))
  if (!sig.startsWith('GIF'))
    return {isGif: false, isAnimated: false, frames: 0}

  let i = 13 // Skip header + logical screen descriptor

  // Skip global color table if present
  if (bytes[10] & 0x80) {
    const gctSize = 3 * (1 << ((bytes[10] & 0x07) + 1))
    i += gctSize
  }

  let frames = 0

  while (i < bytes.length) {
    const block = bytes[i++]

    if (block === 0x2c) {
      // Image descriptor
      frames++

      // Skip image descriptor fields
      i += 8
      // Skip local color table if present
      if (bytes[i] & 0x80) {
        const lctSize = 3 * (1 << ((bytes[i] & 0x07) + 1))
        i += lctSize + 1
      } else {
        i++
      }
      // Skip image data blocks
      i++ // LZW minimum code size
      while (bytes[i]) i += bytes[i] + 1
      i++
    } else if (block === 0x21) {
      // Extension
      i++ // Extension type
      while (bytes[i]) i += bytes[i] + 1
      i++
    } else if (block === 0x3b) {
      // Trailer
      break
    }
  }

  return {isGif: true, isAnimated: frames > 1, frames}
}
