import {type PlaybackDurationSegment} from '../analytics'
import {
  buildVideoWatchInteraction,
  createBoundPlaybackDurationTracker,
  getSourceLoadDurationSeconds,
  type VideoWatchBinding,
  type VideoWatchMode,
} from '../feedFeedback'

const segment: PlaybackDurationSegment = {
  playbackSessionId: 'session',
  segmentIndex: 0,
  durationMs: 1200,
  endReason: 'paused',
  loop: 1,
}
const mode = {muted: true, fullscreen: false, autoplay: true}
const attribution = {
  item: 'at://did:plc:a/app.bsky.feed.post/1',
  feedContext: 'ctx|with|pipes',
  reqId: 'req-1',
} as const

describe('buildVideoWatchInteraction', () => {
  it.each([
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    0,
    -3,
    0.0001, // rounds to 0ms
  ])('omits videoDurationMs for %s', videoDurationSeconds => {
    const interaction = buildVideoWatchInteraction({
      attribution,
      segment,
      mode,
      context: 'embed',
      videoDurationSeconds,
    })
    expect('videoDurationMs' in interaction.payload).toBe(false)
    expect(JSON.stringify(interaction)).not.toContain('videoDurationMs')
  })

  it('sends an unspecced event with the rounded length, loop and mode', () => {
    expect(
      buildVideoWatchInteraction({
        attribution,
        segment,
        mode,
        context: 'immersiveFeed',
        videoDurationSeconds: 12.3456,
      }),
    ).toEqual({
      item: attribution.item,
      event: 'app.bsky.feed.defs#interactionUnspecced',
      feedContext: 'ctx|with|pipes',
      reqId: 'req-1',
      payload: {
        type: 'videoWatch',
        durationMs: 1200,
        videoDurationMs: 12346,
        playbackSessionId: 'session',
        segmentIndex: 0,
        loop: 1,
        muted: true,
        fullscreen: false,
        autoplay: true,
        context: 'immersiveFeed',
        endReason: 'paused',
      },
    })
  })
})

describe('getSourceLoadDurationSeconds', () => {
  const playlist = 'https://video.example/new.m3u8'

  it('trusts only the matching source', () => {
    expect(
      getSourceLoadDurationSeconds(
        {videoSource: {uri: playlist}, duration: 30},
        playlist,
      ),
    ).toBe(30)
    expect(
      getSourceLoadDurationSeconds(
        {videoSource: playlist, duration: 30},
        playlist,
      ),
    ).toBe(30)
    // A pooled player loading the previous/next item's source.
    expect(
      getSourceLoadDurationSeconds(
        {videoSource: {uri: 'https://video.example/old.m3u8'}, duration: 99},
        playlist,
      ),
    ).toBeUndefined()
    expect(
      getSourceLoadDurationSeconds({videoSource: null, duration: 99}, playlist),
    ).toBeUndefined()
  })
})

describe('createBoundPlaybackDurationTracker', () => {
  let time = 0
  let calls: [PlaybackDurationSegment, VideoWatchBinding, VideoWatchMode][]

  beforeEach(() => {
    time = 0
    calls = []
  })

  const playFor = (
    tracker: ReturnType<typeof createBoundPlaybackDurationTracker>,
    ms: number,
  ) => {
    const start = time
    tracker.observeProgress(start / 1000)
    time += ms
    tracker.observeProgress(time / 1000)
  }

  it('flushes the old binding and resumes a new session on rebind', () => {
    const sendA = jest.fn()
    const sendB = jest.fn()
    const first = {attribution, sendVideoWatch: sendA}
    const tracker = createBoundPlaybackDurationTracker({
      enabled: true,
      now: () => time,
      binding: first,
      mode,
      onSegment: (s, binding, segmentMode) =>
        calls.push([s, binding, segmentMode]),
    })
    tracker.setActive(true)
    tracker.setPlaying(true)
    playFor(tracker, 1000)

    // Same values, new object: no rebind.
    tracker.rebind({attribution: {...attribution}, sendVideoWatch: sendA})
    expect(calls).toHaveLength(0)

    const second = {
      attribution: {...attribution, reqId: 'req-2'},
      sendVideoWatch: sendB,
    }
    tracker.rebind(second)
    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toMatchObject({
      durationMs: 1000,
      endReason: 'deactivated',
    })
    expect(calls[0][1]).toBe(first)

    // Still active and playing without new player events.
    playFor(tracker, 2000)
    tracker.flush('unmounted')
    expect(calls).toHaveLength(2)
    expect(calls[1][0]).toMatchObject({
      durationMs: 2000,
      segmentIndex: 0,
      endReason: 'unmounted',
    })
    expect(calls[1][0].playbackSessionId).not.toBe(
      calls[0][0].playbackSessionId,
    )
    expect(calls[1][1]).toBe(second)
  })

  it('rebinds on a feed sender change alone', () => {
    const tracker = createBoundPlaybackDurationTracker({
      enabled: true,
      now: () => time,
      binding: {attribution, sendVideoWatch: jest.fn()},
      mode,
      onSegment: (s, binding, segmentMode) =>
        calls.push([s, binding, segmentMode]),
    })
    tracker.setActive(true)
    tracker.setPlaying(true)
    playFor(tracker, 1000)
    tracker.rebind({attribution, sendVideoWatch: jest.fn()})
    expect(calls).toHaveLength(1)
  })

  it('restores paused state on rebind', () => {
    const tracker = createBoundPlaybackDurationTracker({
      enabled: true,
      now: () => time,
      binding: {attribution},
      mode,
      onSegment: (s, binding, segmentMode) =>
        calls.push([s, binding, segmentMode]),
    })
    tracker.setActive(true)
    tracker.setPlaying(false)
    tracker.rebind({attribution: {...attribution, reqId: 'req-2'}})
    playFor(tracker, 1000)
    tracker.flush('unmounted')
    expect(calls).toHaveLength(0)
  })

  it('splits on mute and fullscreen changes and tags each segment', () => {
    const tracker = createBoundPlaybackDurationTracker({
      enabled: true,
      now: () => time,
      binding: {attribution},
      mode,
      onSegment: (s, binding, segmentMode) =>
        calls.push([s, binding, segmentMode]),
    })
    tracker.setActive(true)
    tracker.setPlaying(true)
    playFor(tracker, 1000)
    // Unchanged values don't split.
    tracker.setMode({muted: true, fullscreen: false, autoplay: true})
    tracker.setMode({muted: false})
    playFor(tracker, 2000)
    tracker.setMode({fullscreen: true})
    playFor(tracker, 1500)
    tracker.setPlaying(false)
    // The next play was started by the user.
    tracker.setMode({autoplay: false})
    tracker.setPlaying(true)
    playFor(tracker, 500)
    tracker.flush('unmounted')

    expect(calls.map(([s, , m]) => [s.durationMs, s.endReason, m])).toEqual([
      [1000, 'muteChanged', {muted: true, fullscreen: false, autoplay: true}],
      [
        2000,
        'fullscreenChanged',
        {muted: false, fullscreen: false, autoplay: true},
      ],
      [1500, 'paused', {muted: false, fullscreen: true, autoplay: true}],
      [500, 'unmounted', {muted: false, fullscreen: true, autoplay: false}],
    ])
  })
})
