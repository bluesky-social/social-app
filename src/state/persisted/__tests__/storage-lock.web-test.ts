import {afterEach, describe, expect, it, jest} from '@jest/globals'

import {runWithPersistedStorageLock} from '../storage-lock.web'

const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  'navigator',
)

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value,
  })
}

afterEach(() => {
  if (originalNavigatorDescriptor) {
    Object.defineProperty(globalThis, 'navigator', originalNavigatorDescriptor)
  } else {
    Reflect.deleteProperty(globalThis, 'navigator')
  }
})

describe('persisted storage lock on unsupported browsers', () => {
  it.each([
    ['navigator is unavailable', undefined],
    ['navigator.locks is unavailable', {}],
    ['navigator.locks.request is unavailable', {locks: {}}],
  ])('runs without a lock when %s', async (_, navigatorValue) => {
    setNavigator(navigatorValue)
    const operation = jest.fn(() => 'result')

    await expect(runWithPersistedStorageLock({operation})).resolves.toBe(
      'result',
    )
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('uses one root lock when Web Locks are available', async () => {
    const request = jest.fn(
      (_name: string, operation: () => string | Promise<string>) =>
        Promise.resolve(operation()),
    )
    setNavigator({locks: {request}})

    await expect(
      runWithPersistedStorageLock({operation: () => 'result'}),
    ).resolves.toBe('result')
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0]?.[0]).toBe('bsky-persisted-storage')
  })
})
