import {afterEach, describe, expect, it, jest} from '@jest/globals'

import {runWithSessionCredentialLock} from '../session-lock.web'

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

describe('session credential locks on unsupported browsers', () => {
  it.each([
    ['navigator is unavailable', undefined],
    ['navigator.locks is unavailable', {}],
    ['navigator.locks.request is unavailable', {locks: {}}],
  ])('runs without a lock when %s', async (_, navigatorValue) => {
    setNavigator(navigatorValue)
    const operation = jest.fn(() => 'result')

    await expect(
      runWithSessionCredentialLock({
        accountDids: ['did:plc:example'],
        operation,
      }),
    ).resolves.toBe('result')
    expect(operation).toHaveBeenCalledTimes(1)
  })
})
