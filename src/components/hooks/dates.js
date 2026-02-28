/**
 * Hooks for date-fns localized formatters.
 *
 * Our app supports some languages that are not included in date-fns by
 * default, in which case it will fall back to English.
 *
 * {@link https://github.com/date-fns/date-fns/blob/main/docs/i18n.md}
 */
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
import { formatDistance } from 'date-fns';
import { useDateLocale } from '#/locale/i18nProvider';
/**
 * Returns a localized `formatDistance` function.
 * {@link formatDistance}
 */
export function useFormatDistance() {
    var locale = useDateLocale();
    return useCallback(function (date, baseDate, options) {
        return formatDistance(date, baseDate, __assign(__assign({}, options), { locale: locale }));
    }, [locale]);
}
