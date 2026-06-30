import {vi} from 'vitest'

vi.mock('#/storage', () => ({
  device: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock('#/analytics/identifiers/util', () => ({
  isSessionIdExpired: vi.fn(),
}))

vi.mock('#/lib/appState', () => ({
  onAppStateChange: vi.fn(() => ({remove: vi.fn()})),
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

async function getMocks() {
  const {device} = await import('#/storage')
  const {isSessionIdExpired} = await import('#/analytics/identifiers/util')
  return {
    device: vi.mocked(device),
    isSessionIdExpired: vi.mocked(isSessionIdExpired),
  }
}

describe('session initialization', () => {
  it('creates new session and sets timestamp when none exists', async () => {
    const {device, isSessionIdExpired} = await getMocks()
    device.get.mockReturnValue(undefined)
    isSessionIdExpired.mockReturnValue(false)

    const {getInitialSessionId} = await import('./session')
    const id = getInitialSessionId()

    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
    expect(device.set).toHaveBeenCalledWith(['nativeSessionId'], id)
    expect(device.set).toHaveBeenCalledWith(
      ['nativeSessionIdLastEventAt'],
      expect.any(Number),
    )
  })

  it('reuses existing session when not expired', async () => {
    const {device, isSessionIdExpired} = await getMocks()
    const existingId = 'existing-session-id'
    device.get.mockImplementation((key: string[]) => {
      if (key[0] === 'nativeSessionId') return existingId
      if (key[0] === 'nativeSessionIdLastEventAt') return Date.now()
      return undefined
    })
    isSessionIdExpired.mockReturnValue(false)

    const {getInitialSessionId} = await import('./session')

    expect(getInitialSessionId()).toBe(existingId)
  })

  it('creates new session when existing is expired', async () => {
    const {device, isSessionIdExpired} = await getMocks()
    const existingId = 'existing-session-id'
    device.get.mockImplementation((key: string[]) => {
      if (key[0] === 'nativeSessionId') return existingId
      if (key[0] === 'nativeSessionIdLastEventAt') return Date.now() - 999999
      return undefined
    })
    isSessionIdExpired.mockReturnValue(true)

    const {getInitialSessionId} = await import('./session')
    const id = getInitialSessionId()

    expect(id).not.toBe(existingId)
    expect(device.set).toHaveBeenCalledWith(['nativeSessionId'], id)
  })
})
