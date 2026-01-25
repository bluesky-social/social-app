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
var _a;
import React from 'react';
import { formatDistance } from 'date-fns';
import { ca, cy, da, de, el, enGB, eo, es, eu, fi, fr, fy, gd, gl, hi, hu, id, it, ja, km, ko, nl, pl, pt, ptBR, ro, ru, sv, th, tr, uk, vi, zhCN, zhHK, zhTW, } from 'date-fns/locale';
import { useLanguagePrefs } from '#/state/preferences';
/**
 * {@link AppLanguage}
 */
var locales = (_a = {
        en: undefined,
        an: undefined,
        ast: undefined,
        ca: ca,
        cy: cy,
        da: da,
        de: de,
        el: el
    },
    _a['en-GB'] = enGB,
    _a.eo = eo,
    _a.es = es,
    _a.eu = eu,
    _a.fi = fi,
    _a.fr = fr,
    _a.fy = fy,
    _a.ga = undefined,
    _a.gd = gd,
    _a.gl = gl,
    _a.hi = hi,
    _a.hu = hu,
    _a.ia = undefined,
    _a.id = id,
    _a.it = it,
    _a.ja = ja,
    _a.km = km,
    _a.ko = ko,
    _a.ne = undefined,
    _a.nl = nl,
    _a.pl = pl,
    _a['pt-PT'] = pt,
    _a['pt-BR'] = ptBR,
    _a.ro = ro,
    _a.ru = ru,
    _a.sv = sv,
    _a.th = th,
    _a.tr = tr,
    _a.uk = uk,
    _a.vi = vi,
    _a['zh-Hans-CN'] = zhCN,
    _a['zh-Hant-HK'] = zhHK,
    _a['zh-Hant-TW'] = zhTW,
    _a);
/**
 * Returns a localized `formatDistance` function.
 * {@link formatDistance}
 */
export function useFormatDistance() {
    var appLanguage = useLanguagePrefs().appLanguage;
    return React.useCallback(function (date, baseDate, options) {
        var locale = locales[appLanguage];
        return formatDistance(date, baseDate, __assign(__assign({}, options), { locale: locale }));
    }, [appLanguage]);
}
