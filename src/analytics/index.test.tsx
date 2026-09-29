import {act, render} from '@testing-library/react-native'

import {onAppStateChange} from '#/lib/appState'
import {getEntries} from '#/logger/logDump'
import {
  AnalyticsContext,
  type AnalyticsContextType,
  AnalyticsFeaturesContext,
  Features,
  useAnalytics,
  useAnalyticsBase,
} from '#/analytics'
import {features} from '#/analytics/features'
import {getSessionId} from '#/analytics/identifiers'
import {type MergeableMetadata, type Metadata} from '#/analytics/metadata'
import {metrics} from '#/analytics/metrics'
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
  getDeviceId: () => 'device-a',
  getAndMigrateDeviceId: () => Promise.resolve('device-a'),
}))
jest.mock('#/geolocation/service', () => ({
  useGeolocationServiceResponse: jest.fn(() => ({
    countryCode: 'US',
    regionCode: 'WI',
    city: 'Madison',
  })),
}))

const FIVE_MINUTES = 5 * 60 * 1e3
let contexts: Metadata[]
let ax: AnalyticsContextType
let childLogger: AnalyticsContextType['logger']

function CaptureBase({index}: {index: number}) {
  contexts[index] = useAnalyticsBase().metadata
  return null
}

function CaptureAnalytics() {
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
  jest.mocked(metrics.track).mockClear()
  contexts = []
  device.set(['analyticsSession'], {id: 'session-a', lastEventAt: Date.now()})
  account.set(['did:plc:a', 'isBetaUser'], true)
  account.set(['did:plc:b', 'isBetaUser'], false)
  jest.mocked(useGeolocationServiceResponse).mockReturnValue({
    countryCode: 'US',
    regionCode: 'WI',
    city: 'Madison',
  })
  features.setFeatures(
    Object.fromEntries(
      [Features.AATest, Features.IsBskyTeam, Features.DebugFeedContext].map(
        feature => [
          feature,
          {
            defaultValue: false,
            rules: [
              {
                key: feature,
                hashAttribute: 'sessionId',
                variations: [true, true],
              },
            ],
          },
        ],
      ),
    ),
  )
})
afterEach(() => jest.useRealTimers())

function rotateSession() {
  const onChange = jest.mocked(onAppStateChange).mock.calls[0][0]
  onChange('background')
  jest.advanceTimersByTime(FIVE_MINUTES)
  onChange('active')
}

function lastMetricMetadata() {
  return jest.mocked(metrics.track).mock.calls.at(-1)![2] as Metadata
}

it('keeps nested metadata, metrics, loggers, and feature attributes aligned after rotation', () => {
  render(
    <Tree
      session={{did: 'did:plc:a', isBskyPds: true}}
      preferences={{appLanguage: 'en', contentLanguages: ['en']}}
    />,
  )
  expect(jest.mocked(onAppStateChange)).toHaveBeenCalledTimes(1)

  act(() => rotateSession())
  const sessionId = getSessionId()
  expect(sessionId).not.toBe('session-a')
  expect(contexts.map(meta => meta.base.sessionId)).toEqual([
    sessionId,
    sessionId,
    sessionId,
  ])
  expect(ax.metadata.base.sessionId).toBe(sessionId)
  expect(ax.metadata.session?.did).toBe('did:plc:a')
  expect(ax.metadata.preferences?.appLanguage).toBe('en')

  ax.metric('state:foreground', {})
  expect(lastMetricMetadata()).toMatchObject({
    base: {sessionId},
    session: {did: 'did:plc:a'},
    preferences: {appLanguage: 'en'},
  })
  ax.logger.info('parent logger')
  childLogger.info('child logger')
  expect(
    getEntries()
      .slice(0, 2)
      .map(entry => entry.metadata.__metadata__),
  ).toEqual([
    expect.objectContaining({sessionId}),
    expect.objectContaining({sessionId}),
  ])
  expect(ax.features.enabled(Features.AATest)).toBe(true)
  expect(features.getAttributes()).toMatchObject({
    sessionId,
    did: 'did:plc:a',
    isBetaUser: true,
    appLanguage: 'en',
  })
  expect(lastMetricMetadata().base.sessionId).toBe(sessionId)
})

it('updates inherited account, preferences, and geolocation without keeping the previous context metadata', () => {
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
    base: ax.metadata.base,
    session: ax.metadata.session,
    preferences: ax.metadata.preferences,
    geolocation: ax.metadata.geolocation,
  })
  childLogger.info('updated logger')
  expect(getEntries()[0].metadata.__metadata__).toMatchObject({
    countryCode: 'CA',
    sessionId: getSessionId(),
  })
  expect(features.getAttributes()).toMatchObject({
    did: 'did:plc:b',
    isBetaUser: false,
    appLanguage: 'fr',
    countryCode: 'CA',
  })
})

it.each(['enabled', 'getValue'] as const)(
  'uses the current session in foreground callbacks and %s before React rerenders',
  method => {
    render(<Tree session={{did: 'did:plc:a', isBskyPds: true}} />)
    const metric = ax.metric
    const log = childLogger.info
    const evaluate = ax.features[method]
    const feature =
      method === 'enabled' ? Features.IsBskyTeam : Features.DebugFeedContext
    metric('state:foreground', {})
    const previousMetric = lastMetricMetadata()
    log('previous session')
    const previousLog = getEntries()[0]

    act(() => {
      rotateSession()
      metric('state:foreground', {})
      expect(lastMetricMetadata().base.sessionId).toBe(getSessionId())
      log('foreground logger')
      expect(getEntries()[0].metadata.__metadata__).toMatchObject({
        sessionId: getSessionId(),
      })
      jest.mocked(metrics.track).mockClear()
      expect(evaluate(feature, false)).toBe(true)
      expect(features.getAttributes().sessionId).toBe(getSessionId())
      expect(
        jest.mocked(metrics.track).mock.calls.map(([event]) => event),
      ).toEqual(['experiment:viewed', 'feature:viewed'])
      for (const [, , metadata] of jest.mocked(metrics.track).mock.calls) {
        expect(metadata).toMatchObject({
          base: {sessionId: getSessionId()},
          session: {did: 'did:plc:a'},
        })
      }
      expect(previousMetric.base.sessionId).toBe('session-a')
      expect(previousLog.metadata.__metadata__).toMatchObject({
        sessionId: 'session-a',
      })
    })
  },
)
