var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import * as Sentry from '@sentry/react-native';
import { nanoid } from 'nanoid/non-secure';
import { Logger } from '#/logger';
import { sentryTransport } from '#/logger/transports/sentry';
import { LogLevel } from '#/logger/types';
jest.mock('@sentry/react-native', function () { return ({
    addBreadcrumb: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
}); });
beforeAll(function () {
    jest.useFakeTimers();
});
describe('general functionality', function () {
    test('default params', function () {
        var logger = new Logger();
        expect(logger.level).toEqual(LogLevel.Info);
    });
    test('can override default params', function () {
        var logger = new Logger({
            level: LogLevel.Debug,
        });
        expect(logger.level).toEqual(LogLevel.Debug);
    });
    test('contextFilter overrides level', function () {
        var logger = new Logger({
            level: LogLevel.Info,
            contextFilter: 'test',
        });
        expect(logger.level).toEqual(LogLevel.Debug);
    });
    test('supports extra metadata', function () {
        var timestamp = Date.now();
        var logger = new Logger({});
        var mockTransport = jest.fn();
        logger.addTransport(mockTransport);
        var extra = { foo: true, __metadata__: {} };
        logger.warn('message', extra);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, undefined, 'message', extra, timestamp);
    });
    test('supports inherited metadata', function () {
        var timestamp = Date.now();
        var logger = new Logger({
            metadata: { bar: true },
        });
        var mockTransport = jest.fn();
        logger.addTransport(mockTransport);
        var extra = { foo: true, __metadata__: { bar: true } };
        logger.warn('message', extra);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, undefined, 'message', extra, timestamp);
    });
    test('supports nullish/falsy metadata', function () {
        var timestamp = Date.now();
        var logger = new Logger({});
        var mockTransport = jest.fn();
        var remove = logger.addTransport(mockTransport);
        // @ts-expect-error testing the JS case
        logger.warn('a', null);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, undefined, 'a', { __metadata__: {} }, timestamp);
        // @ts-expect-error testing the JS case
        logger.warn('b', false);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, undefined, 'b', { __metadata__: {} }, timestamp);
        // @ts-expect-error testing the JS case
        logger.warn('c', 0);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, undefined, 'c', { __metadata__: {} }, timestamp);
        remove();
        logger.addTransport(function (level, context, message, metadata) {
            expect(typeof metadata).toEqual('object');
        });
        // @ts-expect-error testing the JS case
        logger.warn('message', null);
    });
    test('sentryTransport', function () {
        var message = 'message';
        var timestamp = Date.now();
        var sentryTimestamp = timestamp / 1000;
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
        sentryTransport(LogLevel.Info, Logger.Context.Default, message, { type: 'info', prop: true }, timestamp);
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
            category: Logger.Context.Default,
            message: message,
            data: { prop: true, __context__: 'logger' },
            type: 'info',
            level: LogLevel.Info,
            timestamp: sentryTimestamp,
        });
        sentryTransport(LogLevel.Log, Logger.Context.Default, message, {}, timestamp);
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
            category: Logger.Context.Default,
            message: message,
            data: { __context__: 'logger' },
            type: 'default',
            level: 'log',
            timestamp: sentryTimestamp,
        });
        jest.runAllTimers();
        expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
            level: 'log',
            tags: { category: 'logger' },
            extra: { __context__: 'logger' },
        });
        sentryTransport(LogLevel.Warn, Logger.Context.Default, message, {}, timestamp);
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
            category: Logger.Context.Default,
            message: message,
            data: { __context__: 'logger' },
            type: 'default',
            level: 'warning',
            timestamp: sentryTimestamp,
        });
        jest.runAllTimers();
        expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
            level: 'warning',
            tags: { category: 'logger' },
            extra: { __context__: 'logger' },
        });
        var e = new Error('error');
        var tags = {
            prop: 'prop',
        };
        sentryTransport(LogLevel.Error, Logger.Context.Default, e, {
            tags: tags,
            prop: true,
        }, timestamp);
        expect(Sentry.captureException).toHaveBeenCalledWith(e, {
            tags: __assign(__assign({}, tags), { category: 'logger' }),
            extra: {
                prop: true,
                __context__: 'logger',
            },
        });
    });
    test('sentryTransport serializes errors', function () {
        var message = 'message';
        var timestamp = Date.now();
        var sentryTimestamp = timestamp / 1000;
        sentryTransport(LogLevel.Info, undefined, message, { error: new Error('foo') }, timestamp);
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
            message: message,
            data: { error: 'Error: foo' },
            type: 'default',
            level: LogLevel.Info,
            timestamp: sentryTimestamp,
        });
    });
    test('add/remove transport', function () {
        var timestamp = Date.now();
        var logger = new Logger({});
        var mockTransport = jest.fn();
        var remove = logger.addTransport(mockTransport);
        logger.warn('warn');
        remove();
        logger.warn('warn');
        // only called once bc it was removed
        expect(mockTransport).toHaveBeenNthCalledWith(1, LogLevel.Warn, undefined, 'warn', { __metadata__: {} }, timestamp);
    });
});
describe('create', function () {
    test('create', function () {
        var mockTransport = jest.fn();
        var timestamp = Date.now();
        var message = nanoid();
        var logger = Logger.create(Logger.Context.Default);
        logger.addTransport(mockTransport);
        logger.info(message, {});
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Info, Logger.Context.Default, message, { __metadata__: {} }, timestamp);
    });
});
describe('debug contexts', function () {
    test('specific', function () {
        var mockTransport = jest.fn();
        var timestamp = Date.now();
        var message = nanoid();
        var logger = new Logger({
            // @ts-ignore
            context: 'specific',
            level: LogLevel.Debug,
        });
        logger.addTransport(mockTransport);
        logger.debug(message, {});
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, 'specific', message, { __metadata__: {} }, timestamp);
    });
    test('namespaced', function () {
        var mockTransport = jest.fn();
        var timestamp = Date.now();
        var message = nanoid();
        var logger = new Logger({
            // @ts-ignore
            context: 'namespace:foo',
            contextFilter: 'namespace:*',
            level: LogLevel.Debug,
        });
        logger.addTransport(mockTransport);
        logger.debug(message, {});
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, 'namespace:foo', message, { __metadata__: {} }, timestamp);
    });
    test('ignores inactive', function () {
        var mockTransport = jest.fn();
        var timestamp = Date.now();
        var message = nanoid();
        var logger = new Logger({
            // @ts-ignore
            context: 'namespace:bar:baz',
            contextFilter: 'namespace:foo:*',
        });
        logger.addTransport(mockTransport);
        logger.debug(message, {});
        expect(mockTransport).not.toHaveBeenCalledWith(LogLevel.Debug, 'namespace:bar:baz', message, { __metadata__: {} }, timestamp);
    });
});
describe('supports levels', function () {
    test('debug', function () {
        var timestamp = Date.now();
        var logger = new Logger({
            level: LogLevel.Debug,
        });
        var message = nanoid();
        var mockTransport = jest.fn();
        logger.addTransport(mockTransport);
        logger.debug(message);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, undefined, message, { __metadata__: {} }, timestamp);
        logger.info(message);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Info, undefined, message, { __metadata__: {} }, timestamp);
        logger.warn(message);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, undefined, message, { __metadata__: {} }, timestamp);
        var e = new Error(message);
        logger.error(e);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Error, undefined, e, { __metadata__: {} }, timestamp);
    });
    test('info', function () {
        var timestamp = Date.now();
        var logger = new Logger({
            level: LogLevel.Info,
        });
        var message = nanoid();
        var mockTransport = jest.fn();
        logger.addTransport(mockTransport);
        logger.debug(message);
        expect(mockTransport).not.toHaveBeenCalled();
        logger.info(message);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Info, undefined, message, { __metadata__: {} }, timestamp);
    });
    test('warn', function () {
        var timestamp = Date.now();
        var logger = new Logger({
            level: LogLevel.Warn,
        });
        var message = nanoid();
        var mockTransport = jest.fn();
        logger.addTransport(mockTransport);
        logger.debug(message);
        expect(mockTransport).not.toHaveBeenCalled();
        logger.info(message);
        expect(mockTransport).not.toHaveBeenCalled();
        logger.warn(message);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, undefined, message, { __metadata__: {} }, timestamp);
    });
    test('error', function () {
        var timestamp = Date.now();
        var logger = new Logger({
            level: LogLevel.Error,
        });
        var message = nanoid();
        var mockTransport = jest.fn();
        logger.addTransport(mockTransport);
        logger.debug(message);
        expect(mockTransport).not.toHaveBeenCalled();
        logger.info(message);
        expect(mockTransport).not.toHaveBeenCalled();
        logger.warn(message);
        expect(mockTransport).not.toHaveBeenCalled();
        var e = new Error('original message');
        logger.error(e);
        expect(mockTransport).toHaveBeenCalledWith(LogLevel.Error, undefined, e, { __metadata__: {} }, timestamp);
    });
});
