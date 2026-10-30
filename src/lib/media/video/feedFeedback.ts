import {type SourceLoadEventPayload} from 'expo-video'
import {type AtUriString} from '@atproto/syntax'

import {type app} from '#/lexicons'
import {
  createPlaybackDurationTracker,
  type PlaybackDurationEndReason,
  type PlaybackDurationSegment,
} from './analytics'

/**
 * PROVISIONAL: not yet part of the published `app.bsky.feed.defs` lexicon.
 * See `feedFeedback.md` before changing the shape or enabling the flag.
 */
export const VIDEO_WATCH_EVENT = 'app.bsky.feed.defs#interactionVideoWatch'

export type VideoWatchContext = 'embed' | 'immersiveFeed'

/**
 * Feed attribution for video watch feedback. Only feed surfaces that render a
 * recommended item set this, and it is passed through quote embeds unchanged
 * so watch time is attributed to the recommended (outer) item.
 */
export type VideoFeedFeedbackAttribution = {
  /** URI of the recommended feed item, not necessarily the post owning the media. */
  item: AtUriString
  feedContext?: string
  reqId?: string
}

export type VideoWatchPayload = {
  /** Watch time in this segment only (a delta, not a running total). */
  durationMs: number
  /** Authoritative video length. Absent when unknown, never zero or estimated. */
  videoDurationMs?: number
  playbackSessionId: string
  segmentIndex: number
  context: VideoWatchContext
  endReason: PlaybackDurationEndReason
}

/**
 * Local additive extension of `app.bsky.feed.defs#interaction`. The lex
 * client serializes JSON bodies as-is, so `videoWatch` reaches the feed
 * generator without a schema change.
 */
export type VideoWatchInteraction = app.bsky.feed.defs.Interaction & {
  item: AtUriString
  event: typeof VIDEO_WATCH_EVENT
  videoWatch: VideoWatchPayload
}

/** Anything the feed feedback queue can send. */
export type FeedFeedbackInteraction =
  app.bsky.feed.defs.Interaction | VideoWatchInteraction

export function isVideoWatchInteraction(
  interaction: FeedFeedbackInteraction,
): interaction is VideoWatchInteraction {
  return interaction.event === VIDEO_WATCH_EVENT && 'videoWatch' in interaction
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
  context,
  videoDurationSeconds,
}: {
  attribution: VideoFeedFeedbackAttribution
  segment: PlaybackDurationSegment
  context: VideoWatchContext
  videoDurationSeconds?: number
}): VideoWatchInteraction {
  const videoWatch: VideoWatchPayload = {
    durationMs: segment.durationMs,
    playbackSessionId: segment.playbackSessionId,
    segmentIndex: segment.segmentIndex,
    context,
    endReason: segment.endReason,
  }
  const videoDurationMs = toVideoDurationMs(videoDurationSeconds)
  // Leave the key off entirely when unknown so it's absent in the JSON body.
  if (videoDurationMs !== undefined) {
    videoWatch.videoDurationMs = videoDurationMs
  }
  return {
    item: attribution.item,
    event: VIDEO_WATCH_EVENT,
    feedContext: attribution.feedContext,
    reqId: attribution.reqId,
    videoWatch,
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
  const {endReason} = interaction.videoWatch
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
 * under. Without explicit attribution nothing is sent: attribution is never
 * inferred from the ambient feed.
 */
export function sendVideoWatchSegment({
  binding,
  segment,
  context,
  videoDurationSeconds,
}: {
  binding: VideoWatchBinding
  segment: PlaybackDurationSegment
  context: VideoWatchContext
  videoDurationSeconds?: number
}) {
  if (!binding.attribution || !binding.sendVideoWatch) return
  binding.sendVideoWatch(
    buildVideoWatchInteraction({
      attribution: binding.attribution,
      segment,
      context,
      videoDurationSeconds,
    }),
  )
}

/**
 * Wraps the playback duration tracker so each session is bound to one
 * attribution and feed sender. When either changes (e.g. a refetch hands the
 * same post a new reqId, or the feed's client changes) the player keeps
 * playing, but the old session is flushed through the OLD binding and a new
 * session starts with the last known eligibility state, so segments never mix
 * requests or feeds.
 */
export function createBoundPlaybackDurationTracker({
  binding,
  onSegment,
  enabled,
  now,
}: {
  binding: VideoWatchBinding
  onSegment: (
    segment: PlaybackDurationSegment,
    binding: VideoWatchBinding,
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
  let currentBinding = binding
  let tracker = create()

  function create() {
    const sessionBinding = currentBinding
    return createPlaybackDurationTracker({
      enabled,
      now,
      onSegment: segment => onSegment(segment, sessionBinding),
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
