import {type ImagePickerAsset} from 'expo-image-picker'
import {describe, expect, jest, test} from '@jest/globals'

import {createVideoTelemetry} from '#/lib/media/video/telemetry'
import {type Metrics} from '#/analytics/metrics'

const asset = {
  uri: 'file:///a.mp4',
  width: 1,
  height: 1,
  mimeType: 'video/mp4',
} as ImagePickerAsset

function abandon(reason?: unknown) {
  const metric = jest.fn<(event: keyof Metrics, payload: unknown) => void>()
  const controller = new AbortController()
  const telemetry = createVideoTelemetry({
    asset,
    signal: controller.signal,
    metric,
  })
  telemetry.compressStarted()
  controller.abort(reason)
  return metric.mock.calls.find(([event]) => event === 'video:upload:abandoned')
}

describe('createVideoTelemetry abandonment', () => {
  test('an abort without a reason reads as removal, as the legacy composer aborts', () => {
    expect(abandon()?.[1]).toMatchObject({phase: 'compress', reason: 'removed'})
  })

  test('an abort with the closed reason reads as closing', () => {
    expect(abandon('closed')?.[1]).toMatchObject({reason: 'closed'})
  })

  test('a failure ends the funnel, so a later abort is not abandonment', () => {
    const metric = jest.fn()
    const controller = new AbortController()
    const telemetry = createVideoTelemetry({
      asset,
      signal: controller.signal,
      metric,
    })
    telemetry.picked()
    telemetry.validationFailed('video-too-long')
    controller.abort('closed')

    expect(metric.mock.calls.map(([event]) => event)).toEqual([
      'video:upload:picked',
      'video:upload:validationFailed',
    ])
  })
})
