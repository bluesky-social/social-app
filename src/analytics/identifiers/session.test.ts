jest.mock('#/storage', () => ({
  device: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

jest.mock('#/analytics/identifiers/util', () => ({
  isSessionIdExpired: jest.fn(),
}))

jest.mock('#/lib/appState', () => ({
  onAppStateChange: jest.fn(() => ({remove: jest.fn()})),
}))

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

function getMocks() {
  const {device} = require('#/storage')
  const {isSessionIdExpired} = require('#/analytics/identifiers/util')
  return {
    device: jest.mocked(device),
    isSessionIdExpired: jest.mocked(isSessionIdExpired),
  }
}

describe('session initialization', () => {
  it('creates new session and sets timestamp when none exists', () => {
    const {device, isSessionIdExpired} = getMocks()
    device.get.mockReturnValue(undefined)
    isSessionIdExpired.mockReturnValue(false)

    const {getInitialSessionId} = require('./session')
    const id = getInitialSessionId()

    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
    expect(device.set).toHaveBeenCalledWith(['nativeSessionId'], id)
    expect(device.set).toHaveBeenCalledWith(
      ['nativeSessionIdLastEventAt'],
      expect.any(Number),
    )
  })

  it('reuses existing session when not expired', () => {
    const {device, isSessionIdExpired} = getMocks()
    const existingId = 'existing-session-id'
    device.get.mockImplementation((key: string[]) => {
      if (key[0] === 'nativeSessionId') return existingId
      if (key[0] === 'nativeSessionIdLastEventAt') return Date.now()
      return undefined
    })
    isSessionIdExpired.mockReturnValue(false)

    const {getInitialSessionId} = require('./session')

    expect(getInitialSessionId()).toBe(existingId)
  })

  it('creates new session when existing is expired', () => {
    const {device, isSessionIdExpired} = getMocks()
    const existingId = 'existing-session-id'
    device.get.mockImplementation((key: string[]) => {
      if (key[0] === 'nativeSessionId') return existingId
      if (key[0] === 'nativeSessionIdLastEventAt') return Date.now() - 999999
      return undefined
    })
    isSessionIdExpired.mockReturnValue(true)

    const {getInitialSessionId} = require('./session')
    const id = getInitialSessionId()

    expect(id).not.toBe(existingId)
    expect(device.set).toHaveBeenCalledWith(['nativeSessionId'], id)
  })
})
