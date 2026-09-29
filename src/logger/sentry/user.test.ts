import {Sentry} from '#/logger/sentry/lib'
import {identifyWebDevice} from '#/logger/sentry/user'

jest.mock('#/logger/sentry/lib', () => ({
  Sentry: {
    setUser: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('identifyWebDevice', () => {
  it('sets the existing device ID after initialization', async () => {
    let resolveDeviceId!: (id: string) => void
    const deviceId = new Promise<string>(resolve => {
      resolveDeviceId = resolve
    })

    const identifying = identifyWebDevice(deviceId)
    expect(Sentry.setUser).not.toHaveBeenCalled()

    resolveDeviceId('stable-device-id')
    await identifying

    expect(Sentry.setUser).toHaveBeenCalledWith({id: 'stable-device-id'})
  })

  it('leaves Sentry anonymous if the device ID is unavailable', async () => {
    await identifyWebDevice(Promise.reject(new Error('Storage unavailable')))

    expect(Sentry.setUser).not.toHaveBeenCalled()
  })
})
