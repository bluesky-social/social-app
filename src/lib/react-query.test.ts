import {onlineManager} from '@tanstack/react-query'

import {emitNetworkConfirmed, emitNetworkLost} from '#/state/events'

jest.mock('react-native/Libraries/AppState/AppState', () => ({
  __esModule: true,
  default: {
    currentState: 'active',
    addEventListener: () => ({remove: () => {}}),
  },
}))

const fetchMock = jest.fn()
global.fetch = fetchMock

/*
 * react-query.tsx starts its health poll at import time, so it has to be loaded
 * after fake timers are installed.
 */
beforeAll(() => {
  jest.useFakeTimers()
  require('#/lib/react-query')
})

afterAll(() => {
  jest.useRealTimers()
})

beforeEach(() => {
  fetchMock.mockReset()
  emitNetworkConfirmed()
})

/**
 * Lets the poll tick and start a health check, and returns a function that
 * settles that check with the given verdict.
 */
async function beginHealthCheck() {
  let respond!: (online: boolean) => void
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        respond = online =>
          resolve({json: () => Promise.resolve(online ? {version: '1'} : {})})
      }),
  )
  await jest.advanceTimersByTimeAsync(2000)
  return async (online: boolean) => {
    respond(online)
    await jest.advanceTimersByTimeAsync(0)
  }
}

describe('online status', () => {
  it('goes offline on a lost event and recovers when the health check passes', async () => {
    emitNetworkLost()
    expect(onlineManager.isOnline()).toBe(false)

    const settle = await beginHealthCheck()
    await settle(true)

    expect(onlineManager.isOnline()).toBe(true)
  })

  it('does not poll while online', async () => {
    await jest.advanceTimersByTimeAsync(10_000)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps polling after a verdict was contradicted by a request', async () => {
    emitNetworkLost()

    const settleFirst = await beginHealthCheck()
    // A request failed while the check was in flight, which is fresher.
    emitNetworkLost()
    await settleFirst(true)
    expect(onlineManager.isOnline()).toBe(false)

    /*
     * Offline pauses queries, so no request can confirm the network again.
     * Only the next check can bring us back.
     */
    const settleSecond = await beginHealthCheck()
    await settleSecond(true)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(onlineManager.isOnline()).toBe(true)
  })

  it('keeps polling after repeated contradictions', async () => {
    emitNetworkLost()

    for (let i = 0; i < 3; i++) {
      const settle = await beginHealthCheck()
      emitNetworkLost()
      await settle(true)
      expect(onlineManager.isOnline()).toBe(false)
    }

    const settle = await beginHealthCheck()
    await settle(true)

    expect(onlineManager.isOnline()).toBe(true)
  })

  it('does not let a stale offline verdict override a request that succeeded', async () => {
    emitNetworkLost()

    const settle = await beginHealthCheck()
    emitNetworkConfirmed()
    expect(onlineManager.isOnline()).toBe(true)
    await settle(false)

    expect(onlineManager.isOnline()).toBe(true)
  })
})
