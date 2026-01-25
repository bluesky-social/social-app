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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { isNetworkError } from '#/lib/strings/errors';
import { Sentry } from '#/logger/sentry/lib';
import { LogLevel } from '#/logger/types';
import { prepareMetadata } from '#/logger/util';
export var sentryTransport = function (level, context, message, _a, timestamp) {
    var _b;
    var type = _a.type, tags = _a.tags, metadata = __rest(_a, ["type", "tags"]);
    // Skip debug messages entirely for now - esb
    if (level === LogLevel.Debug)
        return;
    var meta = __assign({ __context__: context }, prepareMetadata(metadata));
    var _tags = tags || {};
    _tags = __assign({ 
        // use `category` to match breadcrumbs
        category: context }, tags);
    /**
     * If a string, report a breadcrumb
     */
    if (typeof message === 'string') {
        var severity = (_b = {},
            _b[LogLevel.Debug] = 'debug',
            _b[LogLevel.Info] = 'info',
            _b[LogLevel.Log] = 'log',
            _b[LogLevel.Warn] = 'warning',
            _b[LogLevel.Error] = 'error',
            _b)[level];
        Sentry.addBreadcrumb({
            category: context,
            message: message,
            data: meta,
            type: type || 'default',
            level: severity,
            timestamp: timestamp / 1000, // Sentry expects seconds
        });
        // We don't want to send any network errors to sentry
        if (isNetworkError(message)) {
            return;
        }
        /**
         * Send all higher levels with `captureMessage`, with appropriate severity
         * level
         */
        if (level === 'error' || level === 'warn' || level === 'log') {
            // Defer non-critical messages so they're sent in a batch
            queueMessageForSentry(message, {
                level: severity,
                tags: _tags,
                extra: meta,
            });
        }
    }
    else {
        /**
         * It's otherwise an Error and should be reported with captureException
         */
        Sentry.captureException(message, {
            tags: _tags,
            extra: meta,
        });
    }
};
var queuedMessages = [];
var sentrySendTimeout = null;
function queueMessageForSentry(message, captureContext) {
    queuedMessages.push([message, captureContext]);
    if (!sentrySendTimeout) {
        // Throttle sending messages with a leading delay
        // so that we can get Sentry out of the critical path.
        sentrySendTimeout = setTimeout(function () {
            sentrySendTimeout = null;
            sendQueuedMessages();
        }, 7000);
    }
}
function sendQueuedMessages() {
    while (queuedMessages.length > 0) {
        var record = queuedMessages.shift();
        if (record) {
            Sentry.captureMessage(record[0], record[1]);
        }
    }
}
