import {createPlaybackTelemetry} from '../playbackTelemetry'

const mockSpan = {
  setAttribute: jest.fn(),
  end: jest.fn(),
}

jest.mock('#/logger/sentry/lib', () => ({
  Sentry: {
    startInactiveSpan: jest.fn(() => mockSpan),
  },
}))

const {Sentry}: {Sentry: {startInactiveSpan: jest.Mock}} = jest.requireMock(
  '#/logger/sentry/lib',
)

describe('createPlaybackTelemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts a root span on activation with surface and presentation', () => {
    const telemetry = createPlaybackTelemetry({
      surface: 'feed',
      presentation: 'video',
    })
    telemetry.activated()
    expect(Sentry.startInactiveSpan).toHaveBeenCalledWith({
      name: 'video.playback',
      op: 'video.playback',
      attributes: {surface: 'feed', presentation: 'video'},
    })
  })

  it('does nothing before activation', () => {
    const telemetry = createPlaybackTelemetry({
      surface: 'feed',
      presentation: 'video',
    })
    telemetry.ready()
    telemetry.playing()
    telemetry.deactivated()
    expect(Sentry.startInactiveSpan).not.toHaveBeenCalled()
    expect(mockSpan.end).not.toHaveBeenCalled()
  })

  it('ignores duplicate activations while a span is open', () => {
    const telemetry = createPlaybackTelemetry({
      surface: 'feed',
      presentation: 'video',
    })
    telemetry.activated()
    telemetry.activated()
    expect(Sentry.startInactiveSpan).toHaveBeenCalledTimes(1)
  })

  it('records ready and playing times once', () => {
    const telemetry = createPlaybackTelemetry({
      surface: 'feed',
      presentation: 'video',
    })
    telemetry.activated()
    telemetry.ready()
    telemetry.ready()
    telemetry.playing()
    telemetry.playing()
    const calls = mockSpan.setAttribute.mock.calls as [string, unknown][]
    const attrs = calls.map(c => c[0])
    expect(attrs.filter(a => a === 'timeToReadyMs')).toHaveLength(1)
    expect(attrs.filter(a => a === 'timeToFirstPlayMs')).toHaveLength(1)
  })

  it('ends the span with ok outcome on deactivation, idempotently', () => {
    const telemetry = createPlaybackTelemetry({
      surface: 'feed',
      presentation: 'video',
    })
    telemetry.activated()
    telemetry.deactivated()
    telemetry.deactivated()
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('outcome', 'ok')
    expect(mockSpan.end).toHaveBeenCalledTimes(1)
  })

  it('ends the span with error outcome and message', () => {
    const telemetry = createPlaybackTelemetry({
      surface: 'feed',
      presentation: 'video',
    })
    telemetry.activated()
    telemetry.error('AVFoundationErrorDomain -11850')
    expect(mockSpan.setAttribute).toHaveBeenCalledWith(
      'errorMessage',
      'AVFoundationErrorDomain -11850',
    )
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('outcome', 'error')
    expect(mockSpan.end).toHaveBeenCalledTimes(1)
  })

  it('starts a new span for a new activation window', () => {
    const telemetry = createPlaybackTelemetry({
      surface: 'immersiveFeed',
      presentation: 'video',
    })
    telemetry.activated({preloaded: true})
    telemetry.deactivated()
    telemetry.activated({preloaded: false})
    expect(Sentry.startInactiveSpan).toHaveBeenCalledTimes(2)
    expect(Sentry.startInactiveSpan).toHaveBeenLastCalledWith({
      name: 'video.playback',
      op: 'video.playback',
      attributes: {
        surface: 'immersiveFeed',
        presentation: 'video',
        preloaded: false,
      },
    })
  })
})
