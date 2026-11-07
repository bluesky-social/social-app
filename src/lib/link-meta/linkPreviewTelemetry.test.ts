import {beforeEach, describe, expect, jest, test} from '@jest/globals'

import {createLinkPreviewTelemetry} from '#/lib/link-meta/linkPreviewTelemetry'

const mockPreviewSpan = {setAttribute: jest.fn(), end: jest.fn()}
const mockPhaseSpan = {setAttribute: jest.fn(), end: jest.fn()}
jest.mock('#/logger/sentry/lib', () => ({
  Sentry: {
    startInactiveSpan: jest.fn(({name}: {name: string}) =>
      name === 'link.preview' ? mockPreviewSpan : mockPhaseSpan,
    ),
    withActiveSpan: jest.fn((_span: unknown, callback: () => unknown) =>
      callback(),
    ),
  },
}))

const {Sentry}: {Sentry: typeof import('#/logger/sentry/lib').Sentry} =
  jest.requireMock('#/logger/sentry/lib')

describe('createLinkPreviewTelemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('measures metadata and thumbnail preparation in separate phases', () => {
    const telemetry = createLinkPreviewTelemetry()
    telemetry.startMetadata()
    telemetry.finishMetadata(true)
    telemetry.startThumbnail()
    telemetry.finish('success')

    expect(Sentry.startInactiveSpan).toHaveBeenCalledWith({
      name: 'link.preview',
      op: 'link.preview',
      attributes: {surface: 'composer'},
    })
    expect(Sentry.startInactiveSpan).toHaveBeenCalledWith({
      name: 'link.preview.metadata',
      op: 'link.preview.metadata',
    })
    expect(Sentry.startInactiveSpan).toHaveBeenCalledWith({
      name: 'link.preview.thumbnail',
      op: 'link.preview.thumbnail',
    })
    expect(mockPreviewSpan.setAttribute).toHaveBeenCalledWith(
      'metadata.has_image',
      true,
    )
    expect(mockPreviewSpan.setAttribute).toHaveBeenCalledWith(
      'outcome',
      'success',
    )
    expect(mockPhaseSpan.end).toHaveBeenCalledTimes(2)
    expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
  })

  test('finishes error cleanup at most once without adding content', () => {
    const telemetry = createLinkPreviewTelemetry()
    telemetry.startMetadata()
    telemetry.finish('metadata_error')
    telemetry.finish('error')

    expect(mockPreviewSpan.setAttribute).toHaveBeenCalledWith(
      'outcome',
      'metadata_error',
    )
    expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
    expect(Sentry.startInactiveSpan).toHaveBeenCalledTimes(2)
    expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
      ['outcome', 'metadata_error'],
    ])
  })
})
