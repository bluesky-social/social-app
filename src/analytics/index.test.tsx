import {act, render} from '@testing-library/react-native'

import {onAppStateChange} from '#/lib/appState'
import {getEntries} from '#/logger/logDump'
import {
  type AnalyticsBaseContextType,
  AnalyticsContext,
  type AnalyticsContextType,
  AnalyticsFeaturesContext,
  type Features,
  useAnalytics,
  useAnalyticsBase,
} from '#/analytics'
import {
  evaluateFeature,
  features,
  isFeatureEnabled,
  setAttributes,
} from '#/analytics/features'
import {
  getDeviceId,
  getIdentifiers,
  getSessionId,
} from '#/analytics/identifiers'
import {
  type MergeableMetadata,
  type Metadata,
  type MetricMetadata,
} from '#/analytics/metadata'
import {type Metrics, metrics} from '#/analytics/metrics'
import {MetricsClient} from '#/analytics/metrics/client'
import {useMeta} from '#/analytics/utils'
import {useGeolocationServiceResponse} from '#/geolocation/service'
import {account, device} from '#/storage'

jest.mock('#/lib/appState', () => ({
  onAppStateChange: jest.fn(() => ({remove: jest.fn()})),
}))
jest.mock('#/env', () => ({ENV: 'test', IS_NATIVE: true}))
jest.mock('#/logger/transports/sentry', () => ({sentryTransport: jest.fn()}))
jest.mock('#/logger/transports/console', () => ({consoleTransport: jest.fn()}))
jest.mock('#/logger/sentry/featureFlags', () => ({
  recordFeatureFlagEvaluation: jest.fn(),
}))
jest.mock('#/analytics/features/bootstrap', () => ({
  readFeatureBootstrap: () => ({features: {}}),
}))
jest.mock('#/analytics/features/client', () => {
  const {GrowthBook} = jest.requireActual<
    typeof import('@growthbook/growthbook')
  >('@growthbook/growthbook')
  return {
    createGrowthBook: () => new GrowthBook(),
    refreshGrowthBook: () => Promise.resolve(),
  }
})
jest.mock('#/analytics/metrics', () => ({metrics: {track: jest.fn()}}))
jest.mock('#/analytics/identifiers/device', () => ({
  getDeviceId: jest.fn(),
  getAndMigrateDeviceId: () => Promise.resolve('device-a'),
}))
jest.mock('#/geolocation/service', () => ({
  useGeolocationServiceResponse: jest.fn(),
}))

const FIVE_MINUTES = 5 * 60 * 1e3
let contexts: Metadata[]
let baseAx: AnalyticsBaseContextType
let ax: AnalyticsContextType
let childLogger: AnalyticsContextType['logger']
let renderCount: number
let featureNumber = 0

function CaptureBase({index}: {index: number}) {
  baseAx = useAnalyticsBase()
  contexts[index] = baseAx.metadata
  return null
}

function CaptureAnalytics() {
  renderCount++
  ax = useAnalytics()
  childLogger = ax.logger.useChild(ax.logger.Context.Notifications)
  return null
}

function Tree({session, preferences}: MergeableMetadata) {
  return (
    <AnalyticsContext>
      <CaptureBase index={0} />
      <AnalyticsContext metadata={useMeta({session})}>
        <CaptureBase index={1} />
        <AnalyticsContext metadata={useMeta({preferences})}>
          <CaptureBase index={2} />
          <AnalyticsFeaturesContext>
            <CaptureAnalytics />
          </AnalyticsFeaturesContext>
        </AnalyticsContext>
      </AnalyticsContext>
    </AnalyticsContext>
  )
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-09-22T12:00:00Z'))
  jest.mocked(metrics.track).mockReset()
  jest.mocked(getDeviceId).mockReturnValue('device-a')
  contexts = []
  renderCount = 0
  device.set(['analyticsSession'], {id: 'session-a', lastEventAt: Date.now()})
  account.set(['did:plc:a', 'isBetaUser'], true)
  account.set(['did:plc:b', 'isBetaUser'], false)
  jest.mocked(useGeolocationServiceResponse).mockReturnValue({
    countryCode: 'US',
    regionCode: 'WI',
    city: 'Madison',
  })
  features.setDeferredTrackingCalls([])
  features.setFeatures({})
})
afterEach(() => {
  features.setRenderer(null)
  jest.restoreAllMocks()
  jest.clearAllTimers()
  jest.useRealTimers()
})

function rotateSession() {
  const onChange = jest.mocked(onAppStateChange).mock.calls[0][0]
  onChange('background')
  jest.setSystemTime(Date.now() + FIVE_MINUTES)
  onChange('active')
}

function lastMetricMetadata() {
  return jest.mocked(metrics.track).mock.calls.at(-1)![2] as MetricMetadata
}

/** Unique keys avoid the SDK's exposure deduplication between test cases. */
function installFeature(hashAttribute = 'sessionId') {
  const feature = `test-feature-${++featureNumber}` as Features
  features.setFeatures({
    [feature]: {
      defaultValue: false,
      rules: [
        {
          key: feature,
          hashAttribute,
          variations: [true, true],
        },
      ],
    },
  })
  return feature
}

function expectExposures(identifiers = getIdentifiers(), did = 'did:plc:a') {
  const calls = jest.mocked(metrics.track).mock.calls
  expect(calls.map(([event]) => event)).toEqual([
    'experiment:viewed',
    'feature:viewed',
  ])
  for (const [, , metadata] of calls) {
    expect(metadata).toMatchObject({
      base: identifiers,
      session: {did},
    })
  }
}

it('merges nested metadata without identifier state or rerenders on rotation', () => {
  render(
    <Tree
      session={{did: 'did:plc:a', isBskyPds: true}}
      preferences={{appLanguage: 'en', contentLanguages: ['en']}}
    />,
  )
  const previousContext = ax
  const previousMetadata = [...contexts]
  const previousRenderCount = renderCount

  act(() => rotateSession())
  expect(getSessionId()).not.toBe('session-a')
  expect(renderCount).toBe(previousRenderCount)
  expect(ax).toBe(previousContext)
  for (const [index, metadata] of contexts.entries()) {
    expect(metadata).toBe(previousMetadata[index])
    expect(metadata.base).not.toHaveProperty('sessionId')
    expect(metadata.base).not.toHaveProperty('deviceId')
    expect(metadata.geolocation).toEqual({
      countryCode: 'US',
      regionCode: 'WI',
      city: 'Madison',
    })
  }
  expect(contexts[0].session).toBeUndefined()
  expect(contexts[1].session?.did).toBe('did:plc:a')
  expect(contexts[1].preferences).toBeUndefined()
  expect(ax.metadata).toMatchObject({
    base: {isBetaUser: true},
    session: {did: 'did:plc:a'},
    preferences: {appLanguage: 'en', contentLanguages: ['en']},
  })
  // Rotation does not evaluate features or update the SDK until the next call.
  expect(features.getAttributes().sessionId).toBe('session-a')
  expect(metrics.track).not.toHaveBeenCalled()
})

it('tracks lifecycle before mount and between mounts without context subscriptions', () => {
  rotateSession()
  const beforeMount = getSessionId()
  expect(beforeMount).not.toBe('session-a')
  const view = render(<Tree />)
  ax.metric('state:foreground', {})
  expect(lastMetricMetadata().base.sessionId).toBe(beforeMount)
  view.unmount()

  rotateSession()
  expect(getSessionId()).not.toBe(beforeMount)
  render(<Tree />)
  ax.metric('state:foreground', {})
  expect(lastMetricMetadata().base.sessionId).toBe(getSessionId())
})

it('updates inherited account, preferences, and geolocation', () => {
  const view = render(
    <Tree
      session={{did: 'did:plc:a', isBskyPds: true}}
      preferences={{appLanguage: 'en', contentLanguages: ['en']}}
    />,
  )
  jest
    .mocked(useGeolocationServiceResponse)
    .mockReturnValue({countryCode: 'CA', regionCode: 'ON', city: 'Toronto'})
  view.rerender(
    <Tree
      session={{did: 'did:plc:b', isBskyPds: false}}
      preferences={{appLanguage: 'fr', contentLanguages: ['fr']}}
    />,
  )

  expect(ax.metadata).toMatchObject({
    base: {isBetaUser: false},
    session: {did: 'did:plc:b'},
    preferences: {appLanguage: 'fr'},
    geolocation: {countryCode: 'CA'},
  })
  ax.metric('state:foreground', {})
  expect(lastMetricMetadata()).toMatchObject({
    base: {...ax.metadata.base, ...getIdentifiers()},
    session: ax.metadata.session,
    preferences: ax.metadata.preferences,
    geolocation: ax.metadata.geolocation,
  })
  childLogger.info('updated logger')
  expect(getEntries()[0].metadata.__metadata__).toMatchObject({
    countryCode: 'CA',
    ...getIdentifiers(),
  })
  expect(features.getAttributes()).toMatchObject({
    did: 'did:plc:b',
    isBetaUser: false,
    appLanguage: 'fr',
    countryCode: 'CA',
  })
})

it.each(['default', 'nested'])(
  'snapshots identifiers for captured metrics in %s context without mutating caller metadata',
  context => {
    render(
      context === 'default' ? (
        <CaptureBase index={0} />
      ) : (
        <Tree session={{did: 'did:plc:a', isBskyPds: true}} />
      ),
    )
    const metric = baseAx.metric
    const metadata = Object.freeze({
      ...baseAx.metadata,
      __meta: true,
      base: Object.freeze({
        ...baseAx.metadata.base,
        deviceId: 'obsolete-device',
        sessionId: 'obsolete-session',
      }),
    })
    metric('state:foreground', {}, metadata)
    const previousMetric = lastMetricMetadata()
    expect(previousMetric.base).toMatchObject(getIdentifiers())
    expect(previousMetric).not.toHaveProperty('__meta')

    act(() => rotateSession())
    jest.mocked(getDeviceId).mockReturnValue('device-b')
    metric('state:foreground', {}, metadata)
    expect(lastMetricMetadata().base).toMatchObject(getIdentifiers())
    expect(previousMetric.base).toMatchObject({
      deviceId: 'device-a',
      sessionId: 'session-a',
    })
    expect(metadata.__meta).toBe(true)
    expect(metadata.base).toMatchObject({
      deviceId: 'obsolete-device',
      sessionId: 'obsolete-session',
    })
  },
)

it.each(['debug', 'info', 'log', 'warn', 'error'] as const)(
  'snapshots current identifiers in captured parent and child %s callbacks',
  level => {
    render(<Tree />)
    const parentLog = ax.logger[level]
    const childLog = childLogger[level]
    parentLog('previous parent')
    childLog('previous child')
    const previousLogs = getEntries().slice(0, 2)

    act(() => rotateSession())
    jest.mocked(getDeviceId).mockReturnValue('device-b')
    parentLog('current parent')
    childLog('current child')
    const currentLogs = getEntries().slice(0, 2)
    for (const entry of currentLogs) {
      expect(entry.metadata.__metadata__).toMatchObject(getIdentifiers())
    }
    expect(currentLogs[0].context).toBe(ax.logger.Context.Notifications)
    expect(currentLogs[1].context).toBe(ax.logger.Context.Default)
    for (const entry of previousLogs) {
      expect(entry.metadata.__metadata__).toMatchObject({
        sessionId: 'session-a',
        deviceId: 'device-a',
      })
    }
  },
)

it('does not freeze an import-time unknown device ID into the default context', () => {
  jest.mocked(getDeviceId).mockReturnValue(undefined)
  render(<CaptureBase index={0} />)
  const metric = baseAx.metric
  const log = baseAx.logger.info
  expect(baseAx.metadata.base).not.toHaveProperty('deviceId')
  metric('state:foreground', {})
  log('before device initialization')
  const previousMetric = lastMetricMetadata()
  const previousLog = getEntries()[0]
  expect(previousMetric.base.deviceId).toBe('unknown')
  expect(previousLog.metadata.__metadata__).toMatchObject({deviceId: 'unknown'})

  jest.mocked(getDeviceId).mockReturnValue('initialized-device')
  metric('state:foreground', {})
  log('after device initialization')
  expect(lastMetricMetadata().base.deviceId).toBe('initialized-device')
  expect(getEntries()[0].metadata.__metadata__).toMatchObject({
    deviceId: 'initialized-device',
  })
  expect(previousMetric.base.deviceId).toBe('unknown')
  expect(previousLog.metadata.__metadata__).toMatchObject({deviceId: 'unknown'})
})

it('flushes queued metrics with emission-time rather than flush-time identifiers', () => {
  const client = new MetricsClient<Metrics>()
  jest
    .mocked(metrics.track)
    .mockImplementation((...args) => client.track(...args))
  const fetchMock = jest
    .spyOn(global, 'fetch')
    .mockResolvedValue({ok: true} as Response)
  render(<Tree />)
  const metric = ax.metric
  metric('state:foreground', {})

  act(() => rotateSession())
  jest.mocked(getDeviceId).mockReturnValue('device-b')
  const secondIdentifiers = getIdentifiers()
  metric('state:foreground', {})
  act(() => rotateSession())
  jest.mocked(getDeviceId).mockReturnValue('device-c')
  expect(fetchMock).not.toHaveBeenCalled()
  client.flush()

  const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string) as {
    events: {metadata: MetricMetadata}[]
  }
  expect(body.events.map(event => event.metadata.base)).toEqual([
    expect.objectContaining({deviceId: 'device-a', sessionId: 'session-a'}),
    expect.objectContaining(secondIdentifiers),
  ])
})

describe.each(['sessionId', 'deviceId'] as const)(
  'features bucketed on %s',
  hashAttribute => {
    it.each([
      'enabled',
      'getValue',
      'directEnabled',
      'directEvaluation',
    ] as const)(
      'syncs both IDs for %s without rerendering and preserves other attributes',
      method => {
        render(<Tree session={{did: 'did:plc:a', isBskyPds: true}} />)
        const originalContext = ax
        const {enabled, getValue} = ax.features
        const capturedEvaluate = {
          enabled,
          getValue: (feature: Features) => getValue(feature, false),
          directEnabled: isFeatureEnabled,
          directEvaluation: (feature: Features) =>
            evaluateFeature(feature).value,
        }[method]
        const feature = installFeature(hashAttribute)
        act(() => rotateSession())
        jest.mocked(getDeviceId).mockReturnValue('device-b')
        const updateAttributes = jest.spyOn(features, 'updateAttributes')

        expect(capturedEvaluate(feature)).toBe(true)
        expect(ax).toBe(originalContext)
        expect(features.getAttributes()).toMatchObject({
          ...getIdentifiers(),
          did: 'did:plc:a',
          isBetaUser: true,
          countryCode: 'US',
        })
        expectExposures()
        expect(features.getAllResults().get(feature)?.result).toMatchObject({
          hashAttribute,
          hashValue: getIdentifiers()[hashAttribute],
        })
        expect(updateAttributes).toHaveBeenCalledTimes(1)
        expect(capturedEvaluate(feature)).toBe(true)
        expect(updateAttributes).toHaveBeenCalledTimes(1)
      },
    )
  },
)

it('syncs each identifier independently and avoids redundant attribute updates', () => {
  jest.mocked(getDeviceId).mockReturnValue(undefined)
  render(<Tree session={{did: 'did:plc:a', isBskyPds: true}} />)
  const feature = installFeature('deviceId')
  const updateAttributes = jest.spyOn(features, 'updateAttributes')
  jest.mocked(getDeviceId).mockReturnValue('initialized-device')
  expect(ax.features.enabled(feature)).toBe(true)
  expectExposures()
  expect(updateAttributes).toHaveBeenLastCalledWith({
    deviceId: 'initialized-device',
    sessionId: 'session-a',
  })
  act(() => rotateSession())
  ax.features.enabled(feature)
  expect(updateAttributes).toHaveBeenLastCalledWith(getIdentifiers())
  expect(updateAttributes).toHaveBeenCalledTimes(2)
  ax.features.getValue(feature, false)
  expect(updateAttributes).toHaveBeenCalledTimes(2)
})

it('uses current IDs when setting attributes triggers synchronous evaluations', () => {
  render(<Tree session={{did: 'did:plc:a', isBskyPds: true}} />)
  const metadata = ax.metadata
  const feature = installFeature('deviceId')
  act(() => rotateSession())
  jest.mocked(getDeviceId).mockReturnValue('device-b')
  features.setRenderer(() => {
    features.evalFeature(feature)
  })

  setAttributes(metadata)

  expect(features.getAttributes()).toMatchObject(getIdentifiers())
  expect(features.getAllResults().get(feature)?.result.hashValue).toBe(
    'device-b',
  )
  expectExposures()
})

it('registers current-account callbacks before provider attribute updates evaluate gates', () => {
  function AccountTree({did}: {did: string}) {
    return <Tree key={did} session={{did, isBskyPds: did === 'did:plc:a'}} />
  }
  const view = render(<AccountTree did="did:plc:a" />)
  const feature = installFeature('did')
  act(() => rotateSession())
  jest.mocked(getDeviceId).mockReturnValue('device-b')
  features.setRenderer(() => {
    features.evalFeature(feature)
  })

  view.rerender(<AccountTree did="did:plc:b" />)

  expectExposures(getIdentifiers(), 'did:plc:b')
  expect(lastMetricMetadata().session?.isBskyPds).toBe(false)
  expect(features.getAllResults().get(feature)?.result.hashValue).toBe(
    'did:plc:b',
  )
})

it('attributes both exposures to the bucketed did rather than the ambient account', () => {
  render(<Tree session={{did: 'did:plc:a', isBskyPds: true}} />)
  const feature = installFeature('did')
  setAttributes({
    ...ax.metadata,
    session: {did: 'did:plc:b', isBskyPds: false},
  })

  expect(ax.features.enabled(feature)).toBe(true)

  expectExposures(getIdentifiers(), 'did:plc:b')
  expect(ax.metadata.session?.did).toBe('did:plc:a')
})

it.each(['did', 'deviceId', 'sessionId'])(
  'preserves did attribution for deferred experiments bucketed on %s',
  hashAttribute => {
    render(<Tree session={{did: 'did:plc:a', isBskyPds: true}} />)
    const feature = installFeature(hashAttribute)
    // Replay an actual result after the ambient account has changed.
    const result = evaluateFeature(feature)
    features.setDeferredTrackingCalls([
      {experiment: result.experiment!, result: result.experimentResult!},
    ])
    jest.mocked(metrics.track).mockClear()

    render(<Tree session={{did: 'did:plc:b', isBskyPds: false}} />)

    expect(metrics.track).toHaveBeenCalledTimes(1)
    expect(lastMetricMetadata().session).toEqual({
      did: hashAttribute === 'did' ? 'did:plc:a' : 'did:plc:b',
      isBskyPds: false,
    })
  },
)
