import {Sentry} from '#/logger/sentry/lib'

/**
 * Where the video is being played.
 */
export type PlaybackSurface = 'feed' | 'immersiveFeed'

export type PlaybackTelemetry = {
  activated: (opts?: {preloaded?: boolean}) => void
  ready: () => void
  playing: () => void
  error: (e: unknown) => void
  deactivated: () => void
}

/**
 * Sentry-only observability for video playback in feeds. Opens a root span
 * per activation window (the video becomes the active, autoplaying one) and
 * ends it on deactivation. Because these are root spans, the SDK attaches JS
 * stall and slow/frozen frame measurements to them, capturing scroll
 * smoothness while a video is on screen.
 *
 * Does not report to the analytics pipeline, only Sentry.
 */
export function createPlaybackTelemetry({
  surface,
  presentation,
}: {
  surface: PlaybackSurface
  presentation: 'video' | 'gif'
}): PlaybackTelemetry {
  let span: ReturnType<typeof Sentry.startInactiveSpan> | undefined
  let activatedAt = 0
  let sawReady = false
  let sawPlaying = false

  function end(outcome: 'ok' | 'error') {
    if (!span) return
    span.setAttribute('outcome', outcome)
    span.end()
    span = undefined
  }

  return {
    activated(opts) {
      if (span) return
      activatedAt = Date.now()
      sawReady = false
      sawPlaying = false
      span = Sentry.startInactiveSpan({
        name: 'video.playback',
        op: 'video.playback',
        attributes: {
          surface,
          presentation,
          ...(opts?.preloaded !== undefined && {preloaded: opts.preloaded}),
        },
      })
    },

    ready() {
      if (!span || sawReady) return
      sawReady = true
      span.setAttribute('timeToReadyMs', Date.now() - activatedAt)
    },

    playing() {
      if (!span || sawPlaying) return
      sawPlaying = true
      span.setAttribute('timeToFirstPlayMs', Date.now() - activatedAt)
    },

    error(e) {
      if (!span) return
      span.setAttribute('errorMessage', String(e).slice(0, 256))
      end('error')
    },

    deactivated() {
      end('ok')
    },
  }
}
