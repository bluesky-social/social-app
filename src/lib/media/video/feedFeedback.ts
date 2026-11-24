import {type SourceLoadEventPayload} from 'expo-video'
import {type AtUriString} from '@atproto/syntax'

import {type app} from '#/lexicons'
import {
  createPlaybackDurationTracker,
  type PlaybackDurationEndReason,
  type PlaybackDurationSegment,
} from './analytics'

export type VideoWatchContext = 'embed' | 'immersiveFeed'

/**
 * Feed attribution for video watch feedback: the recommended feed item the
 * video was shown in. For a quoted video that's the outer post, not the quoted
 * one.
 */
export type VideoFeedFeedbackAttribution = {
  /** URI of the recommended feed item, not necessarily the post owning the media. */
  item: AtUriString
  feedContext?: string
  reqId?: string
}

/**
 * How the video was playing. A change to `muted` or `fullscreen` ends the
 * current segment, so each segment has one value for each. `autoplay` only
 * changes when playback (re)starts, which already starts a new segment.
 */
export type VideoWatchMode = {
  muted: boolean
  /**
   * The player's own fullscreen mode. The immersive video feed has none, so
   * it's always false there; `context` already says it was immersive.
   */
  fullscreen: boolean
  /** Playback started without the user pressing play. */
  autoplay: boolean
}

/**
 * The `payload` of an `interactionUnspecced` video watch event. See
 * `feedFeedback.md` for what each field means downstream.
 */
export type VideoWatchPayload = VideoWatchMode & {
  type: 'videoWatch'
  /** Watch time in this segment only (a delta, not a running total). */
  durationMs: number
  /** Authoritative video length. Absent when unknown, never zero or estimated. */
  videoDurationMs?: number
  playbackSessionId: string
  segmentIndex: number
  /** 0 for the first time through the video, 1 for the second, and so on. */
  loop: number
  context: VideoWatchContext
  endReason: PlaybackDurationEndReason
}

export type VideoWatchInteraction = app.bsky.feed.defs.Interaction & {
  item: AtUriString
  event: 'app.bsky.feed.defs#interactionUnspecced'
  payload: VideoWatchPayload
}

export function isVideoWatchInteraction(
  interaction: app.bsky.feed.defs.Interaction,
): interaction is VideoWatchInteraction {
  return (
    interaction.event === 'app.bsky.feed.defs#interactionUnspecced' &&
    typeof interaction.payload === 'object' &&
    interaction.payload !== null &&
    (interaction.payload as {type?: unknown}).type === 'videoWatch'
  )
}

/**
 * Converts a player duration in seconds to whole milliseconds, or undefined
 * when the player doesn't know the length yet (NaN, Infinity, zero).
 */
export function toVideoDurationMs(seconds: number | undefined) {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return undefined
  }
  const ms = Math.round(seconds * 1000)
  return ms > 0 ? ms : undefined
}

export function buildVideoWatchInteraction({
  attribution,
  segment,
  mode,
  context,
  videoDurationSeconds,
}: {
  attribution: VideoFeedFeedbackAttribution
  segment: PlaybackDurationSegment
  mode: VideoWatchMode
  context: VideoWatchContext
  videoDurationSeconds?: number
}): VideoWatchInteraction {
  const payload: VideoWatchPayload = {
    type: 'videoWatch',
    durationMs: segment.durationMs,
    playbackSessionId: segment.playbackSessionId,
    segmentIndex: segment.segmentIndex,
    loop: segment.loop,
    muted: mode.muted,
    fullscreen: mode.fullscreen,
    autoplay: mode.autoplay,
    context,
    endReason: segment.endReason,
  }
  const videoDurationMs = toVideoDurationMs(videoDurationSeconds)
  // Leave the key off entirely when unknown so it's absent in the JSON body.
  if (videoDurationMs !== undefined) {
    payload.videoDurationMs = videoDurationMs
  }
  return {
    item: attribution.item,
    event: 'app.bsky.feed.defs#interactionUnspecced',
    feedContext: attribution.feedContext,
    reqId: attribution.reqId,
    payload,
  }
}

/**
 * Length from an expo-video `sourceLoad` event, only if the loaded source is
 * `playlist`. Pooled players load other items' sources, whose lengths must not
 * be attributed to this item.
 */
export function getSourceLoadDurationSeconds(
  {
    videoSource,
    duration,
  }: Pick<SourceLoadEventPayload, 'videoSource' | 'duration'>,
  playlist: string,
) {
  const uri =
    typeof videoSource === 'string'
      ? videoSource
      : typeof videoSource === 'object'
        ? videoSource?.uri
        : undefined
  return uri === playlist ? duration : undefined
}

/**
 * Segments emitted when the app backgrounds or the player unmounts may arrive
 * after the feed's own lifecycle flush, so they are sent immediately.
 */
export function isFinalVideoWatchSegment(interaction: VideoWatchInteraction) {
  const {endReason} = interaction.payload
  return endReason === 'backgrounded' || endReason === 'unmounted'
}

/**
 * React key for the media a player is bound to. Post or source changes remount
 * the player anyway, so they get a fresh tracker via this key; attribution-only
 * or feed changes rebind in place (see `createBoundPlaybackDurationTracker`).
 */
export function getVideoMediaKey({
  postUri,
  playlist,
}: {
  postUri?: string
  playlist: string
}) {
  return JSON.stringify([postUri, playlist])
}

/**
 * Where a watch session reports: the feed item it is attributed to and the
 * sender of the feed feedback queue (one per feed/client binding) that was
 * current when the session started.
 */
export type VideoWatchBinding = {
  attribution?: VideoFeedFeedbackAttribution
  sendVideoWatch?: (interaction: VideoWatchInteraction) => void
}

function isSameBinding(a: VideoWatchBinding, b: VideoWatchBinding) {
  return (
    a.sendVideoWatch === b.sendVideoWatch &&
    a.attribution?.item === b.attribution?.item &&
    a.attribution?.feedContext === b.attribution?.feedContext &&
    a.attribution?.reqId === b.attribution?.reqId
  )
}

/**
 * Sends a segment as watch feedback through the binding it was recorded
 * under. Without a feed item to attribute it to, nothing is sent.
 */
export function sendVideoWatchSegment({
  binding,
  segment,
  mode,
  context,
  videoDurationSeconds,
}: {
  binding: VideoWatchBinding
  segment: PlaybackDurationSegment
  mode: VideoWatchMode
  context: VideoWatchContext
  videoDurationSeconds?: number
}) {
  if (!binding.attribution || !binding.sendVideoWatch) return
  binding.sendVideoWatch(
    buildVideoWatchInteraction({
      attribution: binding.attribution,
      segment,
      mode,
      context,
      videoDurationSeconds,
    }),
  )
}

/**
 * Wraps the playback duration tracker so each session is bound to one
 * attribution and feed sender, and each segment to one playback mode.
 *
 * When the binding changes (e.g. a refetch hands the same post a new reqId,
 * or the feed's client changes) the player keeps playing, but the old session
 * is flushed through the OLD binding and a new session starts with the last
 * known eligibility state, so segments never mix requests or feeds.
 */
export function createBoundPlaybackDurationTracker({
  binding,
  mode: initialMode,
  onSegment,
  enabled,
  now,
}: {
  binding: VideoWatchBinding
  mode: VideoWatchMode
  onSegment: (
    segment: PlaybackDurationSegment,
    binding: VideoWatchBinding,
    mode: VideoWatchMode,
  ) => void
  enabled: boolean
  now?: () => number
}) {
  // Mirrors the tracker's own initial state.
  const inputs = {
    active: false,
    playing: false,
    foreground: true,
    buffering: false,
  }
  const mode = {...initialMode}
  let currentBinding = binding
  let tracker = create()

  function create() {
    const sessionBinding = currentBinding
    return createPlaybackDurationTracker({
      enabled,
      now,
      // Segments are emitted before the mode changes, so this is its mode.
      onSegment: segment => onSegment(segment, sessionBinding, {...mode}),
    })
  }

  return {
    observeProgress(positionSeconds: number) {
      tracker.observeProgress(positionSeconds)
    },
    setActive(value: boolean) {
      inputs.active = value
      tracker.setActive(value)
    },
    setPlaying(value: boolean) {
      inputs.playing = value
      tracker.setPlaying(value)
    },
    setForeground(value: boolean) {
      inputs.foreground = value
      tracker.setForeground(value)
    },
    setBuffering(value: boolean) {
      inputs.buffering = value
      tracker.setBuffering(value)
    },
    setMode({muted, fullscreen, autoplay}: Partial<VideoWatchMode>) {
      if (muted !== undefined && muted !== mode.muted) {
        tracker.split('muteChanged')
        mode.muted = muted
      }
      if (fullscreen !== undefined && fullscreen !== mode.fullscreen) {
        tracker.split('fullscreenChanged')
        mode.fullscreen = fullscreen
      }
      if (autoplay !== undefined) {
        mode.autoplay = autoplay
      }
    },
    flush(endReason: PlaybackDurationEndReason) {
      tracker.flush(endReason)
    },
    rebind(next: VideoWatchBinding) {
      if (isSameBinding(next, currentBinding)) return
      tracker.flush('deactivated')
      currentBinding = next
      tracker = create()
      tracker.setForeground(inputs.foreground)
      tracker.setBuffering(inputs.buffering)
      tracker.setPlaying(inputs.playing)
      tracker.setActive(inputs.active)
    },
  }
}
