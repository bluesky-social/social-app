import {advanceVideoProgress, videoProgressForPhase} from './videoProgress'

describe('videoProgressForPhase', () => {
  it('maps each phase onto one continuous timeline', () => {
    expect(videoProgressForPhase('compressing', 0)).toBe(0)
    expect(videoProgressForPhase('compressing', 1)).toBe(0.3)
    expect(videoProgressForPhase('uploading', 0)).toBe(0.3)
    expect(videoProgressForPhase('uploading', 1)).toBe(0.5)
    expect(videoProgressForPhase('processing', 0)).toBe(0.5)
    expect(videoProgressForPhase('processing', 0.5)).toBe(0.75)
    expect(videoProgressForPhase('processing', 1)).toBe(1)
  })

  it('clamps invalid phase progress', () => {
    expect(videoProgressForPhase('uploading', -1)).toBe(0.3)
    expect(videoProgressForPhase('uploading', 2)).toBe(0.5)
  })
})

describe('advanceVideoProgress', () => {
  it('does not move backwards when a transport retries or falls back', () => {
    const progressed = advanceVideoProgress(0.5, 'uploading', 0.8)
    expect(advanceVideoProgress(progressed, 'uploading', 0)).toBe(progressed)
  })
})
