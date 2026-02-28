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
var _a;
import { LogLevel } from '#/logger/types';
export var enabledLogLevels = (_a = {},
    _a[LogLevel.Debug] = [
        LogLevel.Debug,
        LogLevel.Info,
        LogLevel.Log,
        LogLevel.Warn,
        LogLevel.Error,
    ],
    _a[LogLevel.Info] = [LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error],
    _a[LogLevel.Log] = [LogLevel.Log, LogLevel.Warn, LogLevel.Error],
    _a[LogLevel.Warn] = [LogLevel.Warn, LogLevel.Error],
    _a[LogLevel.Error] = [LogLevel.Error],
    _a);
export function prepareMetadata(metadata) {
    return Object.keys(metadata).reduce(function (acc, key) {
        var _a;
        var value = metadata[key];
        if (value instanceof Error) {
            value = value.toString();
        }
        if (typeof value === 'object' &&
            value !== null &&
            Object.keys(value).length === 0 &&
            value.constructor === Object) {
            return acc;
        }
        return __assign(__assign({}, acc), (_a = {}, _a[key] = value, _a));
    }, {});
}
