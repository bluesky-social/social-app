import {readRawSessionRecord as readNative} from '#/analytics/identifiers/sessionStorage'
import {readRawSessionRecord as readWeb} from '#/analytics/identifiers/sessionStorage/index.web'
import {device} from '#/storage'

const record = {id: 'session-a', lastEventAt: 1_000}

beforeEach(() => {
  device.set(['analyticsSession'], record)
})
afterEach(() => {
  jest.restoreAllMocks()
})

describe('native session reads', () => {
  it('avoids storage reads after warming the cache', () => {
    const getRaw = jest.spyOn(device, 'getRaw')
    expect(readNative()).toBe(JSON.stringify({data: record}))

    for (let i = 0; i < 100; i++) readNative()

    expect(getRaw).toHaveBeenCalledTimes(1)
  })

  it.each(['remove', 'removeAll'] as const)(
    'invalidates lazily on %s and subsequent writes',
    operation => {
      readNative()
      const getRaw = jest.spyOn(device, 'getRaw')

      if (operation === 'remove') {
        device.remove(['analyticsSession'])
      } else {
        device.removeAll()
      }
      expect(getRaw).not.toHaveBeenCalled()
      expect(readNative()).toBeUndefined()
      expect(readNative()).toBeUndefined()
      expect(getRaw).toHaveBeenCalledTimes(1)

      const next = {...record, id: 'session-b'}
      device.set(['analyticsSession'], next)
      expect(getRaw).toHaveBeenCalledTimes(1)
      expect(readNative()).toBe(JSON.stringify({data: next}))
      expect(getRaw).toHaveBeenCalledTimes(2)
    },
  )

  it('ignores writes to unrelated keys', () => {
    readNative()
    const getRaw = jest.spyOn(device, 'getRaw')

    device.set(['deviceId'], 'device-a')

    expect(readNative()).toBe(JSON.stringify({data: record}))
    expect(getRaw).not.toHaveBeenCalled()
  })

  it('retries failed reads instead of caching a failure or returning stale data', () => {
    readNative()
    const next = {...record, id: 'session-b'}
    device.set(['analyticsSession'], next)
    const error = new Error('Storage unavailable')
    const getRaw = jest.spyOn(device, 'getRaw').mockImplementationOnce(() => {
      throw error
    })

    expect(() => readNative()).toThrow(error)
    expect(readNative()).toBe(JSON.stringify({data: next}))
    expect(getRaw).toHaveBeenCalledTimes(2)
  })
})

it('reads through on web, including changes without a local notification', () => {
  const getRaw = jest.spyOn(device, 'getRaw')
  expect(readWeb()).toBe(JSON.stringify({data: record}))

  // Simulate another tab's write without emitting a local MMKV notification.
  const next = JSON.stringify({data: {...record, id: 'other-tab-session'}})
  getRaw.mockReturnValueOnce(next)

  expect(readWeb()).toBe(next)
  expect(getRaw).toHaveBeenCalledTimes(2)
})
