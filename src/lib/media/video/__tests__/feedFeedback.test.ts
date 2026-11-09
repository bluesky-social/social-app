import {type PlaybackDurationSegment} from '../analytics'
import {
  buildVideoWatchInteraction,
  createBoundPlaybackDurationTracker,
  getSourceLoadDurationSeconds,
  type VideoWatchBinding,
} from '../feedFeedback'

const segment: PlaybackDurationSegment = {
  playbackSessionId: 'session',
  segmentIndex: 0,
  durationMs: 1200,
  endReason: 'paused',
}
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
      context: 'embed',
      videoDurationSeconds,
    })
    expect('videoDurationMs' in interaction.videoWatch).toBe(false)
    expect(JSON.stringify(interaction)).not.toContain('videoDurationMs')
  })

  it('includes rounded length and the segment identity', () => {
    expect(
      buildVideoWatchInteraction({
        attribution,
        segment,
        context: 'immersiveFeed',
        videoDurationSeconds: 12.3456,
      }),
    ).toEqual({
      item: attribution.item,
      event: 'app.bsky.feed.defs#interactionVideoWatch',
      feedContext: 'ctx|with|pipes',
      reqId: 'req-1',
      videoWatch: {
        durationMs: 1200,
        videoDurationMs: 12346,
        playbackSessionId: 'session',
        segmentIndex: 0,
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
  let calls: [PlaybackDurationSegment, VideoWatchBinding][]

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
      onSegment: (s, binding) => calls.push([s, binding]),
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
      onSegment: (s, binding) => calls.push([s, binding]),
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
      onSegment: (s, binding) => calls.push([s, binding]),
    })
    tracker.setActive(true)
    tracker.setPlaying(false)
    tracker.rebind({attribution: {...attribution, reqId: 'req-2'}})
    playFor(tracker, 1000)
    tracker.flush('unmounted')
    expect(calls).toHaveLength(0)
  })
})
