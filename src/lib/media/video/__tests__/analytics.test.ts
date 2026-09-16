import {
  createPlaybackDurationTracker,
  hasPlaybackStarted,
  type PlaybackDurationSegment,
} from '../analytics'

describe('hasPlaybackStarted', () => {
  it.each([
    [0, false],
    [0.049, false],
    [0.05, true],
    [1, true],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
  ])('returns %s for %s seconds', (seconds, expected) => {
    expect(hasPlaybackStarted(seconds)).toBe(expected)
  })
})

describe('createPlaybackDurationTracker', () => {
  let time = 0
  let segments: PlaybackDurationSegment[]

  const createTracker = () =>
    createPlaybackDurationTracker({
      now: () => time,
      playbackSessionId: 'session',
      onSegment: segment => segments.push(segment),
    })

  beforeEach(() => {
    time = 0
    segments = []
  })

  it('emits non-overlapping segments across pause and resume', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(0)
    time = 1_000
    tracker.observeProgress(1)
    tracker.setPlaying(false)
    tracker.setPlaying(true)
    time = 1_500
    tracker.observeProgress(1)
    time = 2_000
    tracker.observeProgress(1.5)
    tracker.setActive(false)

    expect(segments).toEqual([
      {
        playbackSessionId: 'session',
        segmentIndex: 0,
        durationMs: 1_000,
        endReason: 'paused',
      },
      {
        playbackSessionId: 'session',
        segmentIndex: 1,
        durationMs: 500,
        endReason: 'deactivated',
      },
    ])
  })

  it('counts wall time rather than a seek or loop position delta', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(1)
    time = 500
    tracker.observeProgress(50)
    time = 1_000
    tracker.observeProgress(0)
    tracker.setPlaying(false)

    expect(segments[0]?.durationMs).toBe(1_000)
  })

  it('does not count stalled playback or a suspended timer gap', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(0)
    time = 1_000
    tracker.observeProgress(0)
    time = 10_000
    tracker.observeProgress(1)
    tracker.setPlaying(false)

    expect(segments).toEqual([])
  })

  it('flushes only once for repeated lifecycle callbacks', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(0)
    time = 500
    tracker.observeProgress(0.5)
    tracker.setActive(false)
    tracker.setActive(false)
    tracker.setPlaying(false)

    expect(segments).toHaveLength(1)
  })

  it('checkpoints long playback without overlapping the final segment', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(0)
    for (let second = 1; second <= 31; second++) {
      time = second * 1_000
      tracker.observeProgress(second)
    }
    time = 32_000
    tracker.observeProgress(32)
    tracker.setPlaying(false)

    expect(segments).toEqual([
      {
        playbackSessionId: 'session',
        segmentIndex: 0,
        durationMs: 30_000,
        endReason: 'checkpoint',
      },
      {
        playbackSessionId: 'session',
        segmentIndex: 1,
        durationMs: 2_000,
        endReason: 'paused',
      },
    ])
  })
})
