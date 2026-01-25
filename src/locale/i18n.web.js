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
import { useEffect } from 'react';
import { i18n } from '@lingui/core';
import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import { AppLanguage } from '#/locale/languages';
import { useLanguagePrefs } from '#/state/preferences';
/**
 * We do a dynamic import of just the catalog that we need
 */
export function dynamicActivate(locale) {
    return __awaiter(this, void 0, void 0, function () {
        var mod, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
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
                case 1: return [4 /*yield*/, import("./locales/an/messages")];
                case 2:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 3: return [4 /*yield*/, import("./locales/ast/messages")];
                case 4:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 5: return [4 /*yield*/, import("./locales/ca/messages")];
                case 6:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 7: return [4 /*yield*/, import("./locales/cy/messages")];
                case 8:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 9: return [4 /*yield*/, import("./locales/da/messages")];
                case 10:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 11: return [4 /*yield*/, import("./locales/de/messages")];
                case 12:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 13: return [4 /*yield*/, import("./locales/el/messages")];
                case 14:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 15: return [4 /*yield*/, import("./locales/en-GB/messages")];
                case 16:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 17: return [4 /*yield*/, import("./locales/eo/messages")];
                case 18:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 19: return [4 /*yield*/, import("./locales/es/messages")];
                case 20:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 21: return [4 /*yield*/, import("./locales/eu/messages")];
                case 22:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 23: return [4 /*yield*/, import("./locales/fi/messages")];
                case 24:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 25: return [4 /*yield*/, import("./locales/fr/messages")];
                case 26:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 27: return [4 /*yield*/, import("./locales/fy/messages")];
                case 28:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 29: return [4 /*yield*/, import("./locales/ga/messages")];
                case 30:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 31: return [4 /*yield*/, import("./locales/gd/messages")];
                case 32:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 33: return [4 /*yield*/, import("./locales/gl/messages")];
                case 34:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 35: return [4 /*yield*/, import("./locales/hi/messages")];
                case 36:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 37: return [4 /*yield*/, import("./locales/hu/messages")];
                case 38:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 39: return [4 /*yield*/, import("./locales/ia/messages")];
                case 40:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 41: return [4 /*yield*/, import("./locales/id/messages")];
                case 42:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 43: return [4 /*yield*/, import("./locales/it/messages")];
                case 44:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 45: return [4 /*yield*/, import("./locales/ja/messages")];
                case 46:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 47: return [4 /*yield*/, import("./locales/km/messages")];
                case 48:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 49: return [4 /*yield*/, import("./locales/ko/messages")];
                case 50:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 51: return [4 /*yield*/, import("./locales/ne/messages")];
                case 52:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 53: return [4 /*yield*/, import("./locales/nl/messages")];
                case 54:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 55: return [4 /*yield*/, import("./locales/pl/messages")];
                case 56:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 57: return [4 /*yield*/, import("./locales/pt-BR/messages")];
                case 58:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 59: return [4 /*yield*/, import("./locales/pt-PT/messages")];
                case 60:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 61: return [4 /*yield*/, import("./locales/ro/messages")];
                case 62:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 63: return [4 /*yield*/, import("./locales/ru/messages")];
                case 64:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 65: return [4 /*yield*/, import("./locales/sv/messages")];
                case 66:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 67: return [4 /*yield*/, import("./locales/th/messages")];
                case 68:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 69: return [4 /*yield*/, import("./locales/tr/messages")];
                case 70:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 71: return [4 /*yield*/, import("./locales/uk/messages")];
                case 72:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 73: return [4 /*yield*/, import("./locales/vi/messages")];
                case 74:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 75: return [4 /*yield*/, import("./locales/zh-CN/messages")];
                case 76:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 77: return [4 /*yield*/, import("./locales/zh-HK/messages")];
                case 78:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 79: return [4 /*yield*/, import("./locales/zh-TW/messages")];
                case 80:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 81: return [4 /*yield*/, import("./locales/en/messages")];
                case 82:
                    mod = _b.sent();
                    return [3 /*break*/, 83];
                case 83:
                    i18n.load(locale, mod.messages);
                    i18n.activate(locale);
                    return [2 /*return*/];
            }
        });
    });
}
export function useLocaleLanguage() {
    var appLanguage = useLanguagePrefs().appLanguage;
    useEffect(function () {
        var sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage);
        document.documentElement.lang = sanitizedLanguage;
        dynamicActivate(sanitizedLanguage);
    }, [appLanguage]);
}
