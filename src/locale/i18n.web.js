var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useEffect, useState } from 'react';
import { i18n } from '@lingui/core';
import defaultLocale from 'date-fns/locale/en-US';
import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import { AppLanguage } from '#/locale/languages';
import { useLanguagePrefs } from '#/state/preferences';
/**
 * We do a dynamic import of just the catalog that we need
 */
export function dynamicActivate(locale) {
    return __awaiter(this, void 0, void 0, function () {
        var mod, dateLocale, _a;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13;
        return __generator(this, function (_14) {
            switch (_14.label) {
                case 0:
                    dateLocale = defaultLocale;
                    _a = locale;
                    switch (_a) {
                        case AppLanguage.an: return [3 /*break*/, 1];
                        case AppLanguage.ast: return [3 /*break*/, 3];
                        case AppLanguage.ca: return [3 /*break*/, 5];
                        case AppLanguage.cy: return [3 /*break*/, 7];
                        case AppLanguage.da: return [3 /*break*/, 9];
                        case AppLanguage.de: return [3 /*break*/, 11];
                        case AppLanguage.el: return [3 /*break*/, 13];
                        case AppLanguage.en_GB: return [3 /*break*/, 15];
                        case AppLanguage.eo: return [3 /*break*/, 17];
                        case AppLanguage.es: return [3 /*break*/, 19];
                        case AppLanguage.eu: return [3 /*break*/, 21];
                        case AppLanguage.fi: return [3 /*break*/, 23];
                        case AppLanguage.fr: return [3 /*break*/, 25];
                        case AppLanguage.fy: return [3 /*break*/, 27];
                        case AppLanguage.ga: return [3 /*break*/, 29];
                        case AppLanguage.gd: return [3 /*break*/, 31];
                        case AppLanguage.gl: return [3 /*break*/, 33];
                        case AppLanguage.hi: return [3 /*break*/, 35];
                        case AppLanguage.hu: return [3 /*break*/, 37];
                        case AppLanguage.ia: return [3 /*break*/, 39];
                        case AppLanguage.id: return [3 /*break*/, 41];
                        case AppLanguage.it: return [3 /*break*/, 43];
                        case AppLanguage.ja: return [3 /*break*/, 45];
                        case AppLanguage.km: return [3 /*break*/, 47];
                        case AppLanguage.ko: return [3 /*break*/, 49];
                        case AppLanguage.ne: return [3 /*break*/, 51];
                        case AppLanguage.nl: return [3 /*break*/, 53];
                        case AppLanguage.pl: return [3 /*break*/, 55];
                        case AppLanguage.pt_BR: return [3 /*break*/, 57];
                        case AppLanguage.pt_PT: return [3 /*break*/, 59];
                        case AppLanguage.ro: return [3 /*break*/, 61];
                        case AppLanguage.ru: return [3 /*break*/, 63];
                        case AppLanguage.sv: return [3 /*break*/, 65];
                        case AppLanguage.th: return [3 /*break*/, 67];
                        case AppLanguage.tr: return [3 /*break*/, 69];
                        case AppLanguage.uk: return [3 /*break*/, 71];
                        case AppLanguage.vi: return [3 /*break*/, 73];
                        case AppLanguage.zh_CN: return [3 /*break*/, 75];
                        case AppLanguage.zh_HK: return [3 /*break*/, 77];
                        case AppLanguage.zh_TW: return [3 /*break*/, 79];
                    }
                    return [3 /*break*/, 81];
                case 1:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/an/messages"),
                            import('date-fns/locale/es'),
                        ])];
                case 2:
                    _b = _14.sent(), mod = _b[0], dateLocale = _b[1].default;
                    return [3 /*break*/, 83];
                case 3:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/ast/messages"),
                            import('date-fns/locale/es'),
                        ])];
                case 4:
                    _c = _14.sent(), mod = _c[0], dateLocale = _c[1].default;
                    return [3 /*break*/, 83];
                case 5:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/ca/messages"),
                            import('date-fns/locale/ca'),
                        ])];
                case 6:
                    _d = _14.sent(), mod = _d[0], dateLocale = _d[1].default;
                    return [3 /*break*/, 83];
                case 7:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/cy/messages"),
                            import('date-fns/locale/cy'),
                        ])];
                case 8:
                    _e = _14.sent(), mod = _e[0], dateLocale = _e[1].default;
                    return [3 /*break*/, 83];
                case 9:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/da/messages"),
                            import('date-fns/locale/da'),
                        ])];
                case 10:
                    _f = _14.sent(), mod = _f[0], dateLocale = _f[1].default;
                    return [3 /*break*/, 83];
                case 11:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/de/messages"),
                            import('date-fns/locale/de'),
                        ])];
                case 12:
                    _g = _14.sent(), mod = _g[0], dateLocale = _g[1].default;
                    return [3 /*break*/, 83];
                case 13:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/el/messages"),
                            import('date-fns/locale/el'),
                        ])];
                case 14:
                    _h = _14.sent(), mod = _h[0], dateLocale = _h[1].default;
                    return [3 /*break*/, 83];
                case 15:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/en-GB/messages"),
                            import('date-fns/locale/en-GB'),
                        ])];
                case 16:
                    _j = _14.sent(), mod = _j[0], dateLocale = _j[1].default;
                    return [3 /*break*/, 83];
                case 17:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/eo/messages"),
                            import('date-fns/locale/eo'),
                        ])];
                case 18:
                    _k = _14.sent(), mod = _k[0], dateLocale = _k[1].default;
                    return [3 /*break*/, 83];
                case 19:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/es/messages"),
                            import('date-fns/locale/es'),
                        ])];
                case 20:
                    _l = _14.sent(), mod = _l[0], dateLocale = _l[1].default;
                    return [3 /*break*/, 83];
                case 21:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/eu/messages"),
                            import('date-fns/locale/eu'),
                        ])];
                case 22:
                    _m = _14.sent(), mod = _m[0], dateLocale = _m[1].default;
                    return [3 /*break*/, 83];
                case 23:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/fi/messages"),
                            import('date-fns/locale/fi'),
                        ])];
                case 24:
                    _o = _14.sent(), mod = _o[0], dateLocale = _o[1].default;
                    return [3 /*break*/, 83];
                case 25:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/fr/messages"),
                            import('date-fns/locale/fr'),
                        ])];
                case 26:
                    _p = _14.sent(), mod = _p[0], dateLocale = _p[1].default;
                    return [3 /*break*/, 83];
                case 27:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/fy/messages"),
                            import('date-fns/locale/fy'),
                        ])];
                case 28:
                    _q = _14.sent(), mod = _q[0], dateLocale = _q[1].default;
                    return [3 /*break*/, 83];
                case 29: return [4 /*yield*/, import("./locales/ga/messages")];
                case 30:
                    mod = _14.sent();
                    return [3 /*break*/, 83];
                case 31:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/gd/messages"),
                            import('date-fns/locale/gd'),
                        ])];
                case 32:
                    _r = _14.sent(), mod = _r[0], dateLocale = _r[1].default;
                    return [3 /*break*/, 83];
                case 33:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/gl/messages"),
                            import('date-fns/locale/gl'),
                        ])];
                case 34:
                    _s = _14.sent(), mod = _s[0], dateLocale = _s[1].default;
                    return [3 /*break*/, 83];
                case 35:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/hi/messages"),
                            import('date-fns/locale/hi'),
                        ])];
                case 36:
                    _t = _14.sent(), mod = _t[0], dateLocale = _t[1].default;
                    return [3 /*break*/, 83];
                case 37:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/hu/messages"),
                            import('date-fns/locale/hu'),
                        ])];
                case 38:
                    _u = _14.sent(), mod = _u[0], dateLocale = _u[1].default;
                    return [3 /*break*/, 83];
                case 39: return [4 /*yield*/, import("./locales/ia/messages")];
                case 40:
                    mod = _14.sent();
                    return [3 /*break*/, 83];
                case 41:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/id/messages"),
                            import('date-fns/locale/id'),
                        ])];
                case 42:
                    _v = _14.sent(), mod = _v[0], dateLocale = _v[1].default;
                    return [3 /*break*/, 83];
                case 43:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/it/messages"),
                            import('date-fns/locale/it'),
                        ])];
                case 44:
                    _w = _14.sent(), mod = _w[0], dateLocale = _w[1].default;
                    return [3 /*break*/, 83];
                case 45:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/ja/messages"),
                            import('date-fns/locale/ja'),
                        ])];
                case 46:
                    _x = _14.sent(), mod = _x[0], dateLocale = _x[1].default;
                    return [3 /*break*/, 83];
                case 47:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/km/messages"),
                            import('date-fns/locale/km'),
                        ])];
                case 48:
                    _y = _14.sent(), mod = _y[0], dateLocale = _y[1].default;
                    return [3 /*break*/, 83];
                case 49:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/ko/messages"),
                            import('date-fns/locale/ko'),
                        ])];
                case 50:
                    _z = _14.sent(), mod = _z[0], dateLocale = _z[1].default;
                    return [3 /*break*/, 83];
                case 51: return [4 /*yield*/, import("./locales/ne/messages")];
                case 52:
                    mod = _14.sent();
                    return [3 /*break*/, 83];
                case 53:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/nl/messages"),
                            import('date-fns/locale/nl'),
                        ])];
                case 54:
                    _0 = _14.sent(), mod = _0[0], dateLocale = _0[1].default;
                    return [3 /*break*/, 83];
                case 55:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/pl/messages"),
                            import('date-fns/locale/pl'),
                        ])];
                case 56:
                    _1 = _14.sent(), mod = _1[0], dateLocale = _1[1].default;
                    return [3 /*break*/, 83];
                case 57:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/pt-BR/messages"),
                            import('date-fns/locale/pt-BR'),
                        ])];
                case 58:
                    _2 = _14.sent(), mod = _2[0], dateLocale = _2[1].default;
                    return [3 /*break*/, 83];
                case 59:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/pt-PT/messages"),
                            import('date-fns/locale/pt'),
                        ])];
                case 60:
                    _3 = _14.sent(), mod = _3[0], dateLocale = _3[1].default;
                    return [3 /*break*/, 83];
                case 61:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/ro/messages"),
                            import('date-fns/locale/ro'),
                        ])];
                case 62:
                    _4 = _14.sent(), mod = _4[0], dateLocale = _4[1].default;
                    return [3 /*break*/, 83];
                case 63:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/ru/messages"),
                            import('date-fns/locale/ru'),
                        ])];
                case 64:
                    _5 = _14.sent(), mod = _5[0], dateLocale = _5[1].default;
                    return [3 /*break*/, 83];
                case 65:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/sv/messages"),
                            import('date-fns/locale/sv'),
                        ])];
                case 66:
                    _6 = _14.sent(), mod = _6[0], dateLocale = _6[1].default;
                    return [3 /*break*/, 83];
                case 67:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/th/messages"),
                            import('date-fns/locale/th'),
                        ])];
                case 68:
                    _7 = _14.sent(), mod = _7[0], dateLocale = _7[1].default;
                    return [3 /*break*/, 83];
                case 69:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/tr/messages"),
                            import('date-fns/locale/tr'),
                        ])];
                case 70:
                    _8 = _14.sent(), mod = _8[0], dateLocale = _8[1].default;
                    return [3 /*break*/, 83];
                case 71:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/uk/messages"),
                            import('date-fns/locale/uk'),
                        ])];
                case 72:
                    _9 = _14.sent(), mod = _9[0], dateLocale = _9[1].default;
                    return [3 /*break*/, 83];
                case 73:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/vi/messages"),
                            import('date-fns/locale/vi'),
                        ])];
                case 74:
                    _10 = _14.sent(), mod = _10[0], dateLocale = _10[1].default;
                    return [3 /*break*/, 83];
                case 75:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/zh-CN/messages"),
                            import('date-fns/locale/zh-CN'),
                        ])];
                case 76:
                    _11 = _14.sent(), mod = _11[0], dateLocale = _11[1].default;
                    return [3 /*break*/, 83];
                case 77:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/zh-HK/messages"),
                            import('date-fns/locale/zh-HK'),
                        ])];
                case 78:
                    _12 = _14.sent(), mod = _12[0], dateLocale = _12[1].default;
                    return [3 /*break*/, 83];
                case 79:
                    ;
                    return [4 /*yield*/, Promise.all([
                            import("./locales/zh-TW/messages"),
                            import('date-fns/locale/zh-TW'),
                        ])];
                case 80:
                    _13 = _14.sent(), mod = _13[0], dateLocale = _13[1].default;
                    return [3 /*break*/, 83];
                case 81: return [4 /*yield*/, import("./locales/en/messages")];
                case 82:
                    mod = _14.sent();
                    return [3 /*break*/, 83];
                case 83:
                    i18n.load(locale, mod.messages);
                    i18n.activate(locale);
                    return [2 /*return*/, dateLocale];
            }
        });
    });
}
export function useLocaleLanguage() {
    var appLanguage = useLanguagePrefs().appLanguage;
    var _a = useState(defaultLocale), dateLocale = _a[0], setDateLocale = _a[1];
    useEffect(function () {
        var sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage);
        document.documentElement.lang = sanitizedLanguage;
        dynamicActivate(sanitizedLanguage).then(function (locale) {
            setDateLocale(locale);
        });
    }, [appLanguage]);
    return dateLocale;
}
