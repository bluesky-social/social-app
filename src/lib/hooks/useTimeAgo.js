var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { useCallback } from 'react';
import { defineMessage, msg, plural } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { differenceInSeconds } from 'date-fns';
var NOW = 5;
var MINUTE = 60;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;
var MONTH_30 = DAY * 30;
export function useGetTimeAgo(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.future, future = _c === void 0 ? false : _c;
    var i18n = useLingui().i18n;
    return useCallback(function (earlier, later, options) {
        var diff = dateDiff(earlier, later, future ? 'up' : 'down');
        return formatDateDiff({ diff: diff, i18n: i18n, format: options === null || options === void 0 ? void 0 : options.format });
    }, [i18n, future]);
}
/**
 * Returns the difference between `earlier` and `later` dates, based on
 * opinionated rules.
 *
 * - All month are considered exactly 30 days.
 * - Dates assume `earlier` <= `later`, and will otherwise return 'now'.
 * - All values round down
 */
export function dateDiff(earlier, later, rounding) {
    if (rounding === void 0) { rounding = 'down'; }
    var diff = {
        value: 0,
        unit: 'now',
    };
    var e = new Date(earlier);
    var l = new Date(later);
    var diffSeconds = differenceInSeconds(l, e);
    if (diffSeconds < NOW) {
        diff = {
            value: 0,
            unit: 'now',
        };
    }
    else if (diffSeconds < MINUTE) {
        diff = {
            value: diffSeconds,
            unit: 'second',
        };
    }
    else if (diffSeconds < HOUR) {
        var value = rounding === 'up'
            ? Math.ceil(diffSeconds / MINUTE)
            : Math.floor(diffSeconds / MINUTE);
        diff = {
            value: value,
            unit: 'minute',
        };
    }
    else if (diffSeconds < DAY) {
        var value = rounding === 'up'
            ? Math.ceil(diffSeconds / HOUR)
            : Math.floor(diffSeconds / HOUR);
        diff = {
            value: value,
            unit: 'hour',
        };
    }
    else if (diffSeconds < MONTH_30) {
        var value = rounding === 'up'
            ? Math.ceil(diffSeconds / DAY)
            : Math.floor(diffSeconds / DAY);
        diff = {
            value: value,
            unit: 'day',
        };
    }
    else {
        var value = rounding === 'up'
            ? Math.ceil(diffSeconds / MONTH_30)
            : Math.floor(diffSeconds / MONTH_30);
        diff = {
            value: value,
            unit: 'month',
        };
    }
    return __assign(__assign({}, diff), { earlier: e, later: l });
}
/**
 * Accepts a `DateDiff` and teturns the difference between `earlier` and
 * `later` dates, formatted as a natural language string.
 *
 * - All month are considered exactly 30 days.
 * - Dates assume `earlier` <= `later`, and will otherwise return 'now'.
 * - Differences >= 360 days are returned as the "M/D/YYYY" string
 * - All values round down
 */
export function formatDateDiff(_a) {
    var diff = _a.diff, _b = _a.format, format = _b === void 0 ? 'short' : _b, i18n = _a.i18n;
    var long = format === 'long';
    switch (diff.unit) {
        case 'now': {
            return i18n._(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["now"], ["now"]))));
        }
        case 'second': {
            return long
                ? i18n._(plural(diff.value, { one: '# second', other: '# seconds' }))
                : i18n._(defineMessage({
                    message: "".concat(diff.value, "s"),
                    comment: "How many seconds have passed, displayed in a narrow form",
                }));
        }
        case 'minute': {
            return long
                ? i18n._(plural(diff.value, { one: '# minute', other: '# minutes' }))
                : i18n._(defineMessage({
                    message: "".concat(diff.value, "m"),
                    comment: "How many minutes have passed, displayed in a narrow form",
                }));
        }
        case 'hour': {
            return long
                ? i18n._(plural(diff.value, { one: '# hour', other: '# hours' }))
                : i18n._(defineMessage({
                    message: "".concat(diff.value, "h"),
                    comment: "How many hours have passed, displayed in a narrow form",
                }));
        }
        case 'day': {
            return long
                ? i18n._(plural(diff.value, { one: '# day', other: '# days' }))
                : i18n._(defineMessage({
                    message: "".concat(diff.value, "d"),
                    comment: "How many days have passed, displayed in a narrow form",
                }));
        }
        case 'month': {
            if (diff.value < 12) {
                return long
                    ? i18n._(plural(diff.value, { one: '# month', other: '# months' }))
                    : i18n._(defineMessage({
                        message: plural(diff.value, { one: '#mo', other: '#mo' }),
                        comment: "How many months have passed, displayed in a narrow form",
                    }));
            }
            return i18n.date(new Date(diff.earlier));
        }
    }
}
var templateObject_1;
