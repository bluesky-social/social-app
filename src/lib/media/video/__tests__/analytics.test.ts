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
        loop: 0,
      },
      {
        playbackSessionId: 'session',
        segmentIndex: 1,
        durationMs: 500,
        endReason: 'deactivated',
        loop: 0,
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

  it('splits segments at each loop and numbers the loops', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(0)
    // A 3 second video looping twice, observed once a second.
    for (let second = 1; second <= 8; second++) {
      time = second * 1_000
      tracker.observeProgress(second % 3)
    }
    tracker.setPlaying(false)

    expect(
      segments.map(({loop, durationMs, endReason}) => [
        loop,
        durationMs,
        endReason,
      ]),
    ).toEqual([
      [0, 3_000, 'looped'],
      [1, 3_000, 'looped'],
      [2, 2_000, 'paused'],
    ])
    expect(segments.map(segment => segment.segmentIndex)).toEqual([0, 1, 2])
  })

  it('counts a replay after the video ends as a new loop', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(0)
    time = 1_000
    tracker.observeProgress(1)
    tracker.flush('ended')
    // The user presses play again from the start.
    tracker.observeProgress(0.2)
    time = 2_000
    tracker.observeProgress(1)
    tracker.setPlaying(false)

    expect(segments.map(({loop, endReason}) => [loop, endReason])).toEqual([
      [0, 'ended'],
      [1, 'paused'],
    ])
  })

  it('does not count a seek within the video as a loop', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(10)
    time = 1_000
    tracker.observeProgress(5)
    time = 2_000
    tracker.observeProgress(6)
    tracker.setPlaying(false)

    expect(segments).toEqual([
      expect.objectContaining({durationMs: 2_000, loop: 0}),
    ])
  })

  it('splits without losing time between observations', () => {
    const tracker = createTracker()
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(0)
    time = 1_000
    tracker.observeProgress(1)
    tracker.split('muteChanged')
    time = 2_000
    tracker.observeProgress(2)
    tracker.setPlaying(false)

    expect(
      segments.map(({durationMs, endReason}) => [durationMs, endReason]),
    ).toEqual([
      [1_000, 'muteChanged'],
      [1_000, 'paused'],
    ])
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
        loop: 0,
      },
      {
        playbackSessionId: 'session',
        segmentIndex: 1,
        durationMs: 2_000,
        endReason: 'paused',
        loop: 0,
      },
    ])
  })

  it('emits no segments when disabled', () => {
    const tracker = createPlaybackDurationTracker({
      enabled: false,
      now: () => time,
      playbackSessionId: 'session',
      onSegment: segment => segments.push(segment),
    })
    tracker.setActive(true)
    tracker.setPlaying(true)
    tracker.observeProgress(0)
    // Looping position resets, spanning more than two checkpoint intervals.
    for (let second = 1; second <= 75; second++) {
      time = second * 1_000
      tracker.observeProgress(second % 5)
    }

    tracker.setPlaying(false)
    tracker.setPlaying(true)
    tracker.setActive(false)
    tracker.setActive(true)
    tracker.setForeground(false)
    tracker.setForeground(true)
    tracker.setBuffering(true)
    tracker.setBuffering(false)
    time += 1_000
    tracker.observeProgress(1)
    time += 1_000
    tracker.observeProgress(2)
    tracker.flush('ended')
    tracker.flush('error')
    tracker.flush('unmounted')

    expect(segments).toEqual([])
  })
})
