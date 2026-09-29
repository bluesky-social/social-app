import {Sentry} from '#/logger/sentry/lib'
import {identifyDevice} from '#/logger/sentry/user'

jest.mock('#/logger/sentry/lib', () => ({
  Sentry: {
    setUser: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('identifyDevice', () => {
  it('sets a stored device ID synchronously', async () => {
    const identifying = identifyDevice(
      'stable-device-id',
      Promise.resolve('unused-device-id'),
    )

    expect(Sentry.setUser).toHaveBeenCalledWith({id: 'stable-device-id'})
    await identifying
    expect(Sentry.setUser).toHaveBeenCalledTimes(1)
  })

  it('waits for first-time device ID initialization', async () => {
    let resolveDeviceId!: (id: string) => void
    const deviceId = new Promise<string>(resolve => {
      resolveDeviceId = resolve
    })

    const identifying = identifyDevice(undefined, deviceId)
    expect(Sentry.setUser).not.toHaveBeenCalled()

    resolveDeviceId('stable-device-id')
    await identifying

    expect(Sentry.setUser).toHaveBeenCalledWith({id: 'stable-device-id'})
  })

  it('leaves Sentry anonymous if the device ID is unavailable', async () => {
    await identifyDevice(
      undefined,
      Promise.reject(new Error('Storage unavailable')),
    )

    expect(Sentry.setUser).not.toHaveBeenCalled()
  })
})
