import {
  advanceVideoProgress,
  didSkipVideoCompression,
  videoProgressForPhase,
  videoProgressWithinPhase,
} from './videoProgress'

describe('didSkipVideoCompression', () => {
  it('distinguishes a real skip from a failed compression attempt', () => {
    expect(didSkipVideoCompression(undefined)).toBe(false)
    expect(didSkipVideoCompression('below-byte-threshold')).toBe(true)
    expect(didSkipVideoCompression('no-webcodecs')).toBe(true)
    expect(didSkipVideoCompression('gif')).toBe(true)
    expect(didSkipVideoCompression('compress-error-fallback')).toBe(false)
  })
})

describe('videoProgressForPhase', () => {
  it('maps each phase onto one continuous timeline', () => {
    expect(videoProgressForPhase('compressing', 0)).toBe(0)
    expect(videoProgressForPhase('compressing', 1)).toBe(0.3)
    expect(videoProgressForPhase('uploading', 0)).toBe(0.3)
    expect(videoProgressForPhase('uploading', 1)).toBe(0.5)
    expect(videoProgressForPhase('uploadingWithoutCompression', 0)).toBe(0)
    expect(videoProgressForPhase('uploadingWithoutCompression', 1)).toBe(0.5)
    expect(videoProgressForPhase('processing', 0)).toBe(0.5)
    expect(videoProgressForPhase('processing', 0.5)).toBe(0.75)
    expect(videoProgressForPhase('processing', 1)).toBe(1)
  })

  it('clamps invalid phase progress', () => {
    expect(videoProgressForPhase('uploading', -1)).toBe(0.3)
    expect(videoProgressForPhase('uploading', 2)).toBe(0.5)
  })
})

describe('videoProgressWithinPhase', () => {
  it('maps global progress back to phase-local progress', () => {
    expect(videoProgressWithinPhase('compressing', 0)).toBe(0)
    expect(videoProgressWithinPhase('compressing', 0.15)).toBe(0.5)
    expect(videoProgressWithinPhase('compressing', 0.3)).toBe(1)
  })

  it('clamps progress outside the phase', () => {
    expect(videoProgressWithinPhase('compressing', -1)).toBe(0)
    expect(videoProgressWithinPhase('compressing', 1)).toBe(1)
  })
})

describe('advanceVideoProgress', () => {
  it('does not move backwards when a transport retries or falls back', () => {
    const progressed = advanceVideoProgress(0.5, 'uploading', 0.8)
    expect(advanceVideoProgress(progressed, 'uploading', 0)).toBe(progressed)
  })
})
