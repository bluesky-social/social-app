import {beforeEach, describe, expect, jest, test} from '@jest/globals'

import {createLinkPreviewTelemetry} from '#/lib/link-meta/linkPreviewTelemetry'

const mockPreviewSpan = {setAttribute: jest.fn(), end: jest.fn()}
const mockMetadataSpan = {setAttribute: jest.fn(), end: jest.fn()}
const mockThumbnailSpan = {setAttribute: jest.fn(), end: jest.fn()}
jest.mock('#/logger/sentry/lib', () => ({
  Sentry: {
    startInactiveSpan: jest.fn(({name}: {name: string}) => {
      switch (name) {
        case 'link.preview':
          return mockPreviewSpan
        case 'link.preview.metadata':
          return mockMetadataSpan
        case 'link.preview.thumbnail':
          return mockThumbnailSpan
        default:
          throw new Error(`Unexpected span: ${name}`)
      }
    }),
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

  test('ends each phase once and cannot restart after finishing', () => {
    const telemetry = createLinkPreviewTelemetry()
    telemetry.startMetadata()
    telemetry.finishMetadata(true)

    expect(mockMetadataSpan.end).toHaveBeenCalledTimes(1)
    expect(mockThumbnailSpan.end).not.toHaveBeenCalled()
    expect(mockPreviewSpan.end).not.toHaveBeenCalled()

    telemetry.startThumbnail()
    telemetry.finish('success')
    telemetry.finish('error')
    telemetry.startMetadata()
    telemetry.startThumbnail()

    expect(Sentry.startInactiveSpan).toHaveBeenCalledTimes(3)
    expect(Sentry.withActiveSpan).toHaveBeenCalledTimes(2)
    for (const [parent] of jest.mocked(Sentry.withActiveSpan).mock.calls) {
      expect(parent).toBe(mockPreviewSpan)
    }
    expect(mockMetadataSpan.end).toHaveBeenCalledTimes(1)
    expect(mockThumbnailSpan.end).toHaveBeenCalledTimes(1)
    expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
    expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
      ['metadata.has_image', true],
      ['outcome', 'success'],
    ])
  })

  test('error cleanup ends the open phase and preserves the first outcome', () => {
    const telemetry = createLinkPreviewTelemetry()
    telemetry.startMetadata()
    telemetry.finish('metadata_error')
    telemetry.finish('error')

    expect(mockMetadataSpan.end).toHaveBeenCalledTimes(1)
    expect(mockThumbnailSpan.end).not.toHaveBeenCalled()
    expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
    expect(Sentry.startInactiveSpan).toHaveBeenCalledTimes(2)
    expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
      ['outcome', 'metadata_error'],
    ])
  })
})
