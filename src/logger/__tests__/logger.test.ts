import {beforeAll, describe, expect, jest, test} from '@jest/globals'
import * as Sentry from '@sentry/react-native'
import {nanoid} from 'nanoid/non-secure'

import {Logger, LogLevel, sentryTransport} from '#/logger'

jest.mock('#/env', () => ({
  /*
   * Forces debug mode for tests using the default logger. Most tests create
   * their own logger instance.
   */
  LOG_LEVEL: 'debug',
  LOG_DEBUG: '',
}))

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

beforeAll(() => {
  jest.useFakeTimers()
})

describe('general functionality', () => {
  test('default params', () => {
    const logger = new Logger()
    expect(logger.enabled).toBeFalsy()
    expect(logger.level).toEqual(LogLevel.Debug) // mocked above
  })

  test('can override default params', () => {
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Info,
    })
    expect(logger.enabled).toBeTruthy()
    expect(logger.level).toEqual(LogLevel.Info)
  })

  test('disabled logger does not report', () => {
    const logger = new Logger({
      enabled: false,
      level: LogLevel.Debug,
    })

    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)
    logger.debug('message')

    expect(mockTransport).not.toHaveBeenCalled()
  })

  test('disablement', () => {
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Debug,
    })

    logger.disable()

    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)
    logger.debug('message')

    expect(mockTransport).not.toHaveBeenCalled()
  })

  test('passing debug contexts automatically enables debug mode', () => {
    const logger = new Logger({debug: 'specific'})
    expect(logger.level).toEqual(LogLevel.Debug)
  })

  test('supports extra metadata', () => {
    const timestamp = Date.now()
    const logger = new Logger({enabled: true})

    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)

    const extra = {foo: true}
    logger.warn('message', extra)

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      'message',
      extra,
      timestamp,
    )
  })

  test('supports nullish/falsy metadata', () => {
    const timestamp = Date.now()
    const logger = new Logger({enabled: true})

    const mockTransport = jest.fn()

    const remove = logger.addTransport(mockTransport)

    // @ts-expect-error testing the JS case
    logger.warn('a', null)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      'a',
      {},
      timestamp,
    )

    // @ts-expect-error testing the JS case
    logger.warn('b', false)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      'b',
      {},
      timestamp,
    )

    // @ts-expect-error testing the JS case
    logger.warn('c', 0)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      'c',
      {},
      timestamp,
    )

    remove()

    logger.addTransport((level, message, metadata) => {
      expect(typeof metadata).toEqual('object')
    })

    // @ts-expect-error testing the JS case
    logger.warn('message', null)
  })

  test('sentryTransport', () => {
    const message = 'message'
    const timestamp = Date.now()
    const sentryTimestamp = timestamp / 1000

    sentryTransport(LogLevel.Debug, message, {}, timestamp)
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {},
      type: 'default',
      level: LogLevel.Debug,
      timestamp: sentryTimestamp,
    })

    sentryTransport(
      LogLevel.Info,
      message,
      {type: 'info', prop: true},
      timestamp,
    )
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {prop: true},
      type: 'info',
      level: LogLevel.Info,
      timestamp: sentryTimestamp,
    })

    sentryTransport(LogLevel.Log, message, {}, timestamp)
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {},
      type: 'default',
      level: 'debug', // Sentry bug, log becomes debug
      timestamp: sentryTimestamp,
    })
    jest.runAllTimers()
    expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
      level: 'log',
      tags: undefined,
      extra: {},
    })

    sentryTransport(LogLevel.Warn, message, {}, timestamp)
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {},
      type: 'default',
      level: 'warning',
      timestamp: sentryTimestamp,
    })
    jest.runAllTimers()
    expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
      level: 'warning',
      tags: undefined,
      extra: {},
    })

    const e = new Error('error')
    const tags = {
      prop: 'prop',
    }

    sentryTransport(
      LogLevel.Error,
      e,
      {
        tags,
        prop: true,
      },
      timestamp,
    )

    expect(Sentry.captureException).toHaveBeenCalledWith(e, {
      tags,
      extra: {
        prop: true,
      },
    })
  })

  test('sentryTransport serializes errors', () => {
    const message = 'message'
    const timestamp = Date.now()
    const sentryTimestamp = timestamp / 1000

    sentryTransport(
      LogLevel.Debug,
      message,
      {error: new Error('foo')},
      timestamp,
    )
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {error: 'Error: foo'},
      type: 'default',
      level: LogLevel.Debug,
      timestamp: sentryTimestamp,
    })
  })

  test('add/remove transport', () => {
    const timestamp = Date.now()
    const logger = new Logger({enabled: true})
    const mockTransport = jest.fn()

    const remove = logger.addTransport(mockTransport)

    logger.warn('warn')

    remove()

    logger.warn('warn')

    // only called once bc it was removed
    expect(mockTransport).toHaveBeenNthCalledWith(
      1,
      LogLevel.Warn,
      'warn',
      {},
      timestamp,
    )
  })
})

describe('debug contexts', () => {
  const mockTransport = jest.fn()

  test('specific', () => {
    const timestamp = Date.now()
    const message = nanoid()
    const logger = new Logger({
      enabled: true,
      debug: 'specific',
    })

    logger.addTransport(mockTransport)
    logger.debug(message, {}, 'specific')

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Debug,
      message,
      {},
      timestamp,
    )
  })

  test('namespaced', () => {
    const timestamp = Date.now()
    const message = nanoid()
    const logger = new Logger({
      enabled: true,
      debug: 'namespace*',
    })

    logger.addTransport(mockTransport)
    logger.debug(message, {}, 'namespace')

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Debug,
      message,
      {},
      timestamp,
    )
  })

  test('ignores inactive', () => {
    const timestamp = Date.now()
    const message = nanoid()
    const logger = new Logger({
      enabled: true,
      debug: 'namespace:foo:*',
    })

    logger.addTransport(mockTransport)
    logger.debug(message, {}, 'namespace:bar:baz')

    expect(mockTransport).not.toHaveBeenCalledWith(
      LogLevel.Debug,
      message,
      {},
      timestamp,
    )
  })
})

describe('supports levels', () => {
  test('debug', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Debug,
    })
    const message = nanoid()
    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)

    logger.debug(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Debug,
      message,
      {},
      timestamp,
    )

    logger.info(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Info,
      message,
      {},
      timestamp,
    )

    logger.warn(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      message,
      {},
      timestamp,
    )

    const e = new Error(message)
    logger.error(e)
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Error, e, {}, timestamp)
  })

  test('info', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Info,
    })
    const message = nanoid()
    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)

    logger.debug(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.info(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Info,
      message,
      {},
      timestamp,
    )
  })

  test('warn', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Warn,
    })
    const message = nanoid()
    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)

    logger.debug(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.info(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.warn(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      message,
      {},
      timestamp,
    )
  })

  test('error', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Error,
    })
    const message = nanoid()
    const mockTransport = jest.fn()

    logger.addTransport(mockTransport)

    logger.debug(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.info(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.warn(message)
    expect(mockTransport).not.toHaveBeenCalled()

    const e = new Error('original message')
    logger.error(e)
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Error, e, {}, timestamp)
  })
})
