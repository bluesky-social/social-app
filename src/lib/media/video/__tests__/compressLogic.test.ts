import {SUPPORTED_MIME_TYPES} from '#/lib/constants'
import {COMPRESSION_MIN_SIZE_BYTES} from '../constants'

/*
 * Tests for the native compress.ts skip logic.
 *
 * The skip guard in compress.ts is:
 *
 *   if (isAcceptableFormat && file.fileSize != null && file.fileSize < COMPRESSION_MIN_SIZE_BYTES) {
 *     return passthrough
 *   }
 *
 * All three conditions must be true. These tests verify the two failure modes
 * that cause even small files to be compressed on native.
 */

function wouldSkipCompression({
  mimeType,
  fileSize,
}: {
  mimeType: string | null | undefined
  fileSize: number | null | undefined
}): boolean {
  const isAcceptableFormat = SUPPORTED_MIME_TYPES.includes(
    mimeType as (typeof SUPPORTED_MIME_TYPES)[number],
  )
  return (
    isAcceptableFormat &&
    fileSize != null &&
    fileSize < COMPRESSION_MIN_SIZE_BYTES
  )
}

describe('native compress skip conditions', () => {
  describe('10 MB file - happy path', () => {
    it('skips for video/mp4 with known fileSize', () => {
      expect(
        wouldSkipCompression({
          mimeType: 'video/mp4',
          fileSize: 10 * 1024 * 1024,
        }),
      ).toBe(true)
    })

    it('skips for video/quicktime with known fileSize', () => {
      expect(
        wouldSkipCompression({
          mimeType: 'video/quicktime',
          fileSize: 10 * 1024 * 1024,
        }),
      ).toBe(true)
    })
  })

  describe('BUG: fileSize is null — compression runs even on tiny files', () => {
    it('does NOT skip when fileSize is null, even for a 10 MB file', () => {
      // expo-image-picker sometimes returns null fileSize on Android.
      // The guard requires fileSize != null, so null forces compression
      // regardless of actual size.
      expect(
        wouldSkipCompression({mimeType: 'video/mp4', fileSize: null}),
      ).toBe(false) // false = compression runs — this is the bug
    })

    it('does NOT skip when fileSize is undefined', () => {
      expect(
        wouldSkipCompression({mimeType: 'video/mp4', fileSize: undefined}),
      ).toBe(false)
    })
  })

  describe('BUG: non-standard MIME type — compression runs even on tiny files', () => {
    it('does NOT skip for video/hevc (HEVC on some Android devices)', () => {
      // Some Android devices report HEVC as "video/hevc" instead of "video/mp4".
      // isAcceptableFormat is false, so the skip never triggers.
      expect(
        wouldSkipCompression({
          mimeType: 'video/hevc',
          fileSize: 10 * 1024 * 1024,
        }),
      ).toBe(false)
    })

    it('does NOT skip for video/x-m4v', () => {
      expect(
        wouldSkipCompression({
          mimeType: 'video/x-m4v',
          fileSize: 10 * 1024 * 1024,
        }),
      ).toBe(false)
    })

    it('video/hevc is not in SUPPORTED_MIME_TYPES', () => {
      expect(SUPPORTED_MIME_TYPES).not.toContain('video/hevc')
    })
  })

  describe('files above threshold - should compress', () => {
    it('compresses a 30 MiB file even with acceptable format', () => {
      expect(
        wouldSkipCompression({
          mimeType: 'video/mp4',
          fileSize: 30 * 1024 * 1024,
        }),
      ).toBe(false)
    })
  })
})
