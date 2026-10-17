import {readLogEntriesAsync} from 'expo-updates'

import {logger} from '#/logger'
import {logOTAUpdateError} from './otaUpdateDiagnostics'

jest.mock('expo-updates', () => ({
  ...jest.requireActual('expo-updates/build/Updates.types'),
  readLogEntriesAsync: jest.fn(),
}))

jest.mock('#/logger', () => ({
  logger: {error: jest.fn()},
}))

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Date, 'now').mockReturnValue(100_000)
})

afterEach(() => {
  jest.restoreAllMocks()
})

it('attaches only structured native diagnostics from the failed attempt', async () => {
  const error = Object.assign(
    new Error('ERR_UPDATES_FETCH: undefined reason'),
    {
      code: 'ERR_UPDATES_FETCH',
    },
  )
  jest.mocked(readLogEntriesAsync).mockResolvedValue([
    {
      timestamp: 97_000,
      level: 'error',
      code: 'Unknown',
      message: 'An earlier failure',
    },
    {
      timestamp: 98_100,
      level: 'info',
      code: 'None',
      message: 'An informational update',
    },
    {
      timestamp: 99_000,
      level: 'error',
      code: 'Unknown',
      message: 'HTTP response error 503: private response body',
    },
    {
      timestamp: 99_500,
      level: 'error',
      code: 'AssetsFailedToLoad',
      message: 'Error Domain=NSURLErrorDomain Code=-1009; file:///private/path',
      updateId: '665ff9c4-f831-4b84-95a9-d75b6f1f30a8',
      stacktrace: ['private native stack'],
    },
    {
      timestamp: 100_500,
      level: 'error',
      code: 'UpdateFailedToLoad',
      message: 'A later, unrelated failure',
    },
  ] as Awaited<ReturnType<typeof readLogEntriesAsync>>)

  await logOTAUpdateError({
    error,
    stage: 'fetch',
    trigger: 'launch',
    startedAt: 98_000,
  })

  expect(readLogEntriesAsync).toHaveBeenCalledWith(3_000)
  expect(logger.error).toHaveBeenCalledWith('OTA Update Error', {
    safeMessage: error,
    tags: {
      ota_stage: 'fetch',
      ota_trigger: 'launch',
      ota_error_code: 'ERR_UPDATES_FETCH',
      ota_native_log_status: 'present',
      ota_native_code: 'AssetsFailedToLoad',
      ota_native_network_signal: 'seen',
      ota_http_status: 503,
      ota_url_error_code: -1009,
    },
    nativeUpdateLogs: [
      {
        code: 'Unknown',
        level: 'error',
        msSinceStart: 1_000,
        httpStatus: 503,
        networkSignal: false,
      },
      {
        code: 'AssetsFailedToLoad',
        level: 'error',
        msSinceStart: 1_500,
        updateId: '665ff9c4-f831-4b84-95a9-d75b6f1f30a8',
        urlErrorCode: -1009,
        networkSignal: true,
      },
    ],
  })
  expect(
    JSON.stringify(jest.mocked(logger.error).mock.calls[0][1]),
  ).not.toMatch(/private|file:\/\//)
})

it('reports the original error when native logs cannot be read', async () => {
  jest.mocked(readLogEntriesAsync).mockRejectedValue(new Error('read failed'))

  await logOTAUpdateError({
    error: new Error('ERR_UPDATES_CHECK: undefined reason'),
    stage: 'check',
    trigger: 'resume',
    startedAt: 99_000,
  })

  expect(logger.error).toHaveBeenCalledWith(
    'OTA Update Error',
    expect.objectContaining({
      tags: expect.objectContaining({
        ota_stage: 'check',
        ota_error_code: 'ERR_UPDATES_CHECK',
        ota_native_log_status: 'unavailable',
        ota_native_network_signal: 'unavailable',
      }),
      nativeUpdateLogs: [],
    }),
  )
})
