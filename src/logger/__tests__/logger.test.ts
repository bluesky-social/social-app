import * as Sentry from '@sentry/react-native'
import {nanoid} from 'nanoid/non-secure'
import {vi} from 'vitest'

import {Logger} from '#/logger'
import {sentryTransport} from '#/logger/transports/sentry'
import {LogLevel} from '#/logger/types'

vi.mock('@sentry/react-native', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

beforeAll(() => {
  vi.useFakeTimers()
})

describe('general functionality', () => {
  test('default params', () => {
    const logger = new Logger()
    expect(logger.level).toEqual(LogLevel.Info)
  })

  test('can override default params', () => {
    const logger = new Logger({
      level: LogLevel.Debug,
    })
    expect(logger.level).toEqual(LogLevel.Debug)
  })

  test('contextFilter overrides level', () => {
    const logger = new Logger({
      level: LogLevel.Info,
      contextFilter: 'test',
    })
    expect(logger.level).toEqual(LogLevel.Debug)
  })

  test('supports extra metadata', () => {
    const timestamp = Date.now()
    const logger = new Logger({})

    const mockTransport = vi.fn()

    logger.addTransport(mockTransport)

    const extra = {foo: true, __metadata__: {}}
    logger.warn('message', extra)

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      undefined,
      'message',
      extra,
      timestamp,
    )
  })

  test('supports inherited metadata', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      metadata: {bar: true},
    })

    const mockTransport = vi.fn()

    logger.addTransport(mockTransport)

    const extra = {foo: true, __metadata__: {bar: true}}
    logger.warn('message', extra)

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      undefined,
      'message',
      extra,
      timestamp,
    )
  })

  test('supports nullish/falsy metadata', () => {
    const timestamp = Date.now()
    const logger = new Logger({})

    const mockTransport = vi.fn()

    const remove = logger.addTransport(mockTransport)

    // @ts-expect-error testing the JS case
    logger.warn('a', null)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      undefined,
      'a',
      {__metadata__: {}},
      timestamp,
    )

    // @ts-expect-error testing the JS case
    logger.warn('b', false)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      undefined,
      'b',
      {__metadata__: {}},
      timestamp,
    )

    // @ts-expect-error testing the JS case
    logger.warn('c', 0)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      undefined,
      'c',
      {__metadata__: {}},
      timestamp,
    )

    remove()

    logger.addTransport((level, context, message, metadata) => {
      expect(typeof metadata).toEqual('object')
    })

    // @ts-expect-error testing the JS case
    logger.warn('message', null)
  })

  test('sentryTransport', () => {
    const message = 'message'
    const timestamp = Date.now()
    const sentryTimestamp = timestamp / 1000

    /*
    sentryTransport(
      LogLevel.Debug,
      Logger.Context.Default,
      message,
      {},
      timestamp,
    )
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: Logger.Context.Default,
      message,
      data: {__context__: 'logger'},
      type: 'default',
      level: LogLevel.Debug,
      timestamp: sentryTimestamp,
    })
    */

    sentryTransport(
      LogLevel.Info,
      Logger.Context.Default,
      message,
      {type: 'info', prop: true},
      timestamp,
    )
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: Logger.Context.Default,
      message,
      data: {prop: true, __context__: 'logger'},
      type: 'info',
      level: LogLevel.Info,
      timestamp: sentryTimestamp,
    })

    sentryTransport(
      LogLevel.Log,
      Logger.Context.Default,
      message,
      {},
      timestamp,
    )
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: Logger.Context.Default,
      message,
      data: {__context__: 'logger'},
      type: 'default',
      level: 'log',
      timestamp: sentryTimestamp,
    })
    vi.runAllTimers()
    expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
      level: 'log',
      tags: {category: 'logger'},
      extra: {__context__: 'logger'},
    })

    sentryTransport(
      LogLevel.Warn,
      Logger.Context.Default,
      message,
      {},
      timestamp,
    )
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: Logger.Context.Default,
      message,
      data: {__context__: 'logger'},
      type: 'default',
      level: 'warning',
      timestamp: sentryTimestamp,
    })
    vi.runAllTimers()
    expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
      level: 'warning',
      tags: {category: 'logger'},
      extra: {__context__: 'logger'},
    })

    const e = new Error('error')
    const tags = {
      prop: 'prop',
    }

    sentryTransport(
      LogLevel.Error,
      Logger.Context.Default,
      e,
      {
        tags,
        prop: true,
      },
      timestamp,
    )

    expect(Sentry.captureException).toHaveBeenCalledWith(e, {
      tags: {
        ...tags,
        category: 'logger',
      },
      extra: {
        prop: true,
        __context__: 'logger',
      },
    })
  })

  test('sentryTransport serializes errors', () => {
    const message = 'message'
    const timestamp = Date.now()
    const sentryTimestamp = timestamp / 1000

    sentryTransport(
      LogLevel.Info,
      undefined,
      message,
      {error: new Error('foo')},
      timestamp,
    )
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {error: 'Error: foo'},
      type: 'default',
      level: LogLevel.Info,
      timestamp: sentryTimestamp,
    })
  })

  test('add/remove transport', () => {
    const timestamp = Date.now()
    const logger = new Logger({})
    const mockTransport = vi.fn()

    const remove = logger.addTransport(mockTransport)

    logger.warn('warn')

    remove()

    logger.warn('warn')

    // only called once bc it was removed
    expect(mockTransport).toHaveBeenNthCalledWith(
      1,
      LogLevel.Warn,
      undefined,
      'warn',
      {__metadata__: {}},
      timestamp,
    )
  })
})

describe('create', () => {
  test('create', () => {
    const mockTransport = vi.fn()
    const timestamp = Date.now()
    const message = nanoid()
    const logger = Logger.create(Logger.Context.Default)

    logger.addTransport(mockTransport)
    logger.info(message, {})

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Info,
      Logger.Context.Default,
      message,
      {__metadata__: {}},
      timestamp,
    )
  })
})

describe('debug contexts', () => {
  test('specific', () => {
    const mockTransport = vi.fn()
    const timestamp = Date.now()
    const message = nanoid()
    const logger = new Logger({
      // @ts-ignore
      context: 'specific',
      level: LogLevel.Debug,
    })

    logger.addTransport(mockTransport)
    logger.debug(message, {})

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Debug,
      'specific',
      message,
      {__metadata__: {}},
      timestamp,
    )
  })

  test('namespaced', () => {
    const mockTransport = vi.fn()
    const timestamp = Date.now()
    const message = nanoid()
    const logger = new Logger({
      // @ts-ignore
      context: 'namespace:foo',
      contextFilter: 'namespace:*',
      level: LogLevel.Debug,
    })

    logger.addTransport(mockTransport)
    logger.debug(message, {})

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Debug,
      'namespace:foo',
      message,
      {__metadata__: {}},
      timestamp,
    )
  })

  test('ignores inactive', () => {
    const mockTransport = vi.fn()
    const timestamp = Date.now()
    const message = nanoid()
    const logger = new Logger({
      // @ts-ignore
      context: 'namespace:bar:baz',
      contextFilter: 'namespace:foo:*',
    })

    logger.addTransport(mockTransport)
    logger.debug(message, {})

    expect(mockTransport).not.toHaveBeenCalledWith(
      LogLevel.Debug,
      'namespace:bar:baz',
      message,
      {__metadata__: {}},
      timestamp,
    )
  })
})

describe('supports levels', () => {
  test('debug', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      level: LogLevel.Debug,
    })
    const message = nanoid()
    const mockTransport = vi.fn()

    logger.addTransport(mockTransport)

    logger.debug(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Debug,
      undefined,
      message,
      {__metadata__: {}},
      timestamp,
    )

    logger.info(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Info,
      undefined,
      message,
      {__metadata__: {}},
      timestamp,
    )

    logger.warn(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      undefined,
      message,
      {__metadata__: {}},
      timestamp,
    )

    const e = new Error(message)
    logger.error(e)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Error,
      undefined,
      e,
      {__metadata__: {}},
      timestamp,
    )
  })

  test('info', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      level: LogLevel.Info,
    })
    const message = nanoid()
    const mockTransport = vi.fn()

    logger.addTransport(mockTransport)

    logger.debug(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.info(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Info,
      undefined,
      message,
      {__metadata__: {}},
      timestamp,
    )
  })

  test('warn', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      level: LogLevel.Warn,
    })
    const message = nanoid()
    const mockTransport = vi.fn()

    logger.addTransport(mockTransport)

    logger.debug(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.info(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.warn(message)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Warn,
      undefined,
      message,
      {__metadata__: {}},
      timestamp,
    )
  })

  test('error', () => {
    const timestamp = Date.now()
    const logger = new Logger({
      level: LogLevel.Error,
    })
    const message = nanoid()
    const mockTransport = vi.fn()

    logger.addTransport(mockTransport)

    logger.debug(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.info(message)
    expect(mockTransport).not.toHaveBeenCalled()

    logger.warn(message)
    expect(mockTransport).not.toHaveBeenCalled()

    const e = new Error('original message')
    logger.error(e)
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Error,
      undefined,
      e,
      {__metadata__: {}},
      timestamp,
    )
  })
})
