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
import { nanoid } from 'nanoid/non-secure';
import { add } from '#/logger/logDump';
import { consoleTransport } from '#/logger/transports/console';
import { sentryTransport } from '#/logger/transports/sentry';
import { LogContext, LogLevel, } from '#/logger/types';
import { enabledLogLevels } from '#/logger/util';
import { ENV } from '#/env';
var TRANSPORTS = (function configureTransports() {
    switch (ENV) {
        case 'production': {
            return [sentryTransport].filter(Boolean);
        }
        case 'test': {
            return [];
        }
        default: {
            return [consoleTransport];
        }
    }
})();
var Logger = /** @class */ (function () {
    function Logger(_a) {
        var _b = _a === void 0 ? {} : _a, level = _b.level, context = _b.context, contextFilter = _b.contextFilter, _c = _b.metadata, ambientMetadata = _c === void 0 ? {} : _c;
        this.context = undefined;
        this.contextFilter = '';
        this.ambientMetadata = {};
        this.debugContextRegexes = [];
        this.transports = [];
        this.context = context;
        this.level = level || LogLevel.Info;
        this.contextFilter = contextFilter || '';
        this.ambientMetadata = ambientMetadata;
        if (this.contextFilter) {
            this.level = LogLevel.Debug;
        }
        this.debugContextRegexes = (this.contextFilter || '')
            .split(',')
            .map(function (filter) {
            return new RegExp(filter.replace(/[^\w:*-]/, '').replace(/\*/g, '.*'));
        });
    }
    Logger.create = function (context, metadata) {
        if (metadata === void 0) { metadata = {}; }
        var logger = new Logger({
            level: process.env.EXPO_PUBLIC_LOG_LEVEL,
            context: context,
            contextFilter: process.env.EXPO_PUBLIC_LOG_DEBUG || '',
            metadata: metadata,
        });
        for (var _i = 0, TRANSPORTS_1 = TRANSPORTS; _i < TRANSPORTS_1.length; _i++) {
            var transport = TRANSPORTS_1[_i];
            logger.addTransport(transport);
        }
        return logger;
    };
    Logger.prototype.debug = function (message, metadata) {
        if (metadata === void 0) { metadata = {}; }
        this.transport({ level: LogLevel.Debug, message: message, metadata: metadata });
    };
    Logger.prototype.info = function (message, metadata) {
        if (metadata === void 0) { metadata = {}; }
        this.transport({ level: LogLevel.Info, message: message, metadata: metadata });
    };
    Logger.prototype.log = function (message, metadata) {
        if (metadata === void 0) { metadata = {}; }
        this.transport({ level: LogLevel.Log, message: message, metadata: metadata });
    };
    Logger.prototype.warn = function (message, metadata) {
        if (metadata === void 0) { metadata = {}; }
        this.transport({ level: LogLevel.Warn, message: message, metadata: metadata });
    };
    Logger.prototype.error = function (error, metadata) {
        if (metadata === void 0) { metadata = {}; }
        this.transport({ level: LogLevel.Error, message: error, metadata: metadata });
    };
    Logger.prototype.addTransport = function (transport) {
        var _this = this;
        this.transports.push(transport);
        return function () {
            _this.transports.splice(_this.transports.indexOf(transport), 1);
        };
    };
    Logger.prototype.transport = function (_a) {
        var _this = this;
        var level = _a.level, message = _a.message, _b = _a.metadata, metadata = _b === void 0 ? {} : _b;
        if (level === LogLevel.Debug &&
            !!this.contextFilter &&
            !!this.context &&
            !this.debugContextRegexes.find(function (reg) { return reg.test(_this.context); }))
            return;
        var timestamp = Date.now();
        var meta = __assign({ __metadata__: this.ambientMetadata }, metadata);
        // send every log to syslog
        add({
            id: nanoid(),
            timestamp: timestamp,
            level: level,
            context: this.context,
            message: message,
            metadata: meta,
        });
        if (!enabledLogLevels[this.level].includes(level))
            return;
        for (var _i = 0, _c = this.transports; _i < _c.length; _i++) {
            var transport = _c[_i];
            transport(level, this.context, message, meta, timestamp);
        }
    };
    Logger.Level = LogLevel;
    Logger.Context = LogContext;
    return Logger;
}());
export { Logger };
/**
 * Default logger instance. See `@/logger/README` for docs.
 *
 * Basic usage:
 *
 *   `logger.debug(message[, metadata])`
 *   `logger.info(message[, metadata])`
 *   `logger.log(message[, metadata])`
 *   `logger.warn(message[, metadata])`
 *   `logger.error(error[, metadata])`
 */
export var logger = Logger.create(Logger.Context.Default);
