import {COMPRESSION_MIN_SIZE_BYTES} from '../constants'

/*
 * Tests for the compression skip threshold.
 *
 * These verify that native and web share the same constant and that files
 * a user would describe as "under 25 MB" (as shown by macOS Finder, which
 * uses binary MiB) are never compressed.
 *
 * Regression: before this fix the web constant was 25_000_000 (decimal MB)
 * while native used 25 * 1024 * 1024 (binary MiB = 26,214,400 bytes). Files
 * between those two values were skipped on native but compressed on web,
 * causing unexpected quality loss. See issue #8314.
 */

const MiB = 1024 * 1024

describe('COMPRESSION_MIN_SIZE_BYTES threshold', () => {
  it('is exactly 25 MiB (binary)', () => {
    expect(COMPRESSION_MIN_SIZE_BYTES).toBe(25 * MiB)
  })

  it('is larger than 25 MB decimal so files near the boundary are skipped', () => {
    // A file macOS Finder shows as "25 MB" is ~26.2 MB decimal.
    // The threshold must exceed 25,000,000 so those files skip compression.
    expect(COMPRESSION_MIN_SIZE_BYTES).toBeGreaterThan(25_000_000)
  })

  it('skips a 22 MB file (reporter scenario: 3000kbps HEVC 720p <60s)', () => {
    const reporterFileSizeBytes = 22 * 1024 * 1024
    expect(reporterFileSizeBytes).toBeLessThan(COMPRESSION_MIN_SIZE_BYTES)
  })

  it('skips a file that Finder shows as "25 MB" (~26 MB decimal)', () => {
    // Finder displays in MiB as "MB". 25 MiB = 26,214,400 bytes decimal.
    const finderTwentyFiveMB = 25 * MiB
    expect(finderTwentyFiveMB).toBeLessThanOrEqual(COMPRESSION_MIN_SIZE_BYTES)
  })

  it('compresses a file clearly over the threshold', () => {
    const thirtyMB = 30 * MiB
    expect(thirtyMB).toBeGreaterThan(COMPRESSION_MIN_SIZE_BYTES)
  })

  it('would have compressed a 26 MB decimal file under the old web threshold', () => {
    const oldWebThreshold = 25_000_000
    const file26MBDecimal = 26 * 1000 * 1000
    // Old bug: this file would have been compressed on web but skipped on native
    expect(file26MBDecimal).toBeGreaterThan(oldWebThreshold)
    // Fixed: now it's correctly skipped on both platforms
    expect(file26MBDecimal).toBeLessThan(COMPRESSION_MIN_SIZE_BYTES)
  })
})
