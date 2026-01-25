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
// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577
import '@formatjs/intl-locale/polyfill-force';
import '@formatjs/intl-pluralrules/polyfill-force';
import '@formatjs/intl-numberformat/polyfill-force';
import '@formatjs/intl-displaynames/polyfill-force';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-numberformat/locale-data/en';
import '@formatjs/intl-displaynames/locale-data/en';
import { useEffect } from 'react';
import { i18n } from '@lingui/core';
import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import { AppLanguage } from '#/locale/languages';
import { messages as messagesAn } from '#/locale/locales/an/messages';
import { messages as messagesAst } from '#/locale/locales/ast/messages';
import { messages as messagesCa } from '#/locale/locales/ca/messages';
import { messages as messagesCy } from '#/locale/locales/cy/messages';
import { messages as messagesDa } from '#/locale/locales/da/messages';
import { messages as messagesDe } from '#/locale/locales/de/messages';
import { messages as messagesEl } from '#/locale/locales/el/messages';
import { messages as messagesEn } from '#/locale/locales/en/messages';
import { messages as messagesEn_GB } from '#/locale/locales/en-GB/messages';
import { messages as messagesEo } from '#/locale/locales/eo/messages';
import { messages as messagesEs } from '#/locale/locales/es/messages';
import { messages as messagesEu } from '#/locale/locales/eu/messages';
import { messages as messagesFi } from '#/locale/locales/fi/messages';
import { messages as messagesFr } from '#/locale/locales/fr/messages';
import { messages as messagesFy } from '#/locale/locales/fy/messages';
import { messages as messagesGa } from '#/locale/locales/ga/messages';
import { messages as messagesGd } from '#/locale/locales/gd/messages';
import { messages as messagesGl } from '#/locale/locales/gl/messages';
import { messages as messagesHi } from '#/locale/locales/hi/messages';
import { messages as messagesHu } from '#/locale/locales/hu/messages';
import { messages as messagesIa } from '#/locale/locales/ia/messages';
import { messages as messagesId } from '#/locale/locales/id/messages';
import { messages as messagesIt } from '#/locale/locales/it/messages';
import { messages as messagesJa } from '#/locale/locales/ja/messages';
import { messages as messagesKm } from '#/locale/locales/km/messages';
import { messages as messagesKo } from '#/locale/locales/ko/messages';
import { messages as messagesNe } from '#/locale/locales/ne/messages';
import { messages as messagesNl } from '#/locale/locales/nl/messages';
import { messages as messagesPl } from '#/locale/locales/pl/messages';
import { messages as messagesPt_BR } from '#/locale/locales/pt-BR/messages';
import { messages as messagesPt_PT } from '#/locale/locales/pt-PT/messages';
import { messages as messagesRo } from '#/locale/locales/ro/messages';
import { messages as messagesRu } from '#/locale/locales/ru/messages';
import { messages as messagesSv } from '#/locale/locales/sv/messages';
import { messages as messagesTh } from '#/locale/locales/th/messages';
import { messages as messagesTr } from '#/locale/locales/tr/messages';
import { messages as messagesUk } from '#/locale/locales/uk/messages';
import { messages as messagesVi } from '#/locale/locales/vi/messages';
import { messages as messagesZh_CN } from '#/locale/locales/zh-CN/messages';
import { messages as messagesZh_HK } from '#/locale/locales/zh-HK/messages';
import { messages as messagesZh_TW } from '#/locale/locales/zh-TW/messages';
import { useLanguagePrefs } from '#/state/preferences';
/**
 * We do a dynamic import of just the catalog that we need
 */
export function dynamicActivate(locale) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
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
                case 1:
                    i18n.loadAndActivate({ locale: locale, messages: messagesAn });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/an'),
                            import('@formatjs/intl-numberformat/locale-data/es'),
                            import('@formatjs/intl-displaynames/locale-data/es'),
                        ])];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 3:
                    i18n.loadAndActivate({ locale: locale, messages: messagesAst });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ast'),
                            import('@formatjs/intl-numberformat/locale-data/ast'),
                            import('@formatjs/intl-displaynames/locale-data/ast'),
                        ])];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 5:
                    i18n.loadAndActivate({ locale: locale, messages: messagesCa });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ca'),
                            import('@formatjs/intl-numberformat/locale-data/ca'),
                            import('@formatjs/intl-displaynames/locale-data/ca'),
                        ])];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 7:
                    i18n.loadAndActivate({ locale: locale, messages: messagesCy });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/cy'),
                            import('@formatjs/intl-numberformat/locale-data/cy'),
                            import('@formatjs/intl-displaynames/locale-data/cy'),
                        ])];
                case 8:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 9:
                    i18n.loadAndActivate({ locale: locale, messages: messagesDa });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/da'),
                            import('@formatjs/intl-numberformat/locale-data/da'),
                            import('@formatjs/intl-displaynames/locale-data/da'),
                        ])];
                case 10:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 11:
                    i18n.loadAndActivate({ locale: locale, messages: messagesDe });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/de'),
                            import('@formatjs/intl-numberformat/locale-data/de'),
                            import('@formatjs/intl-displaynames/locale-data/de'),
                        ])];
                case 12:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 13:
                    i18n.loadAndActivate({ locale: locale, messages: messagesEl });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/el'),
                            import('@formatjs/intl-numberformat/locale-data/el'),
                            import('@formatjs/intl-displaynames/locale-data/el'),
                        ])];
                case 14:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 15:
                    i18n.loadAndActivate({ locale: locale, messages: messagesEn_GB });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/en'),
                            import('@formatjs/intl-numberformat/locale-data/en-GB'),
                            import('@formatjs/intl-displaynames/locale-data/en-GB'),
                        ])];
                case 16:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 17:
                    i18n.loadAndActivate({ locale: locale, messages: messagesEo });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/eo'),
                            import('@formatjs/intl-numberformat/locale-data/eo'),
                            // borked, see https://github.com/bluesky-social/social-app/pull/9574
                            // import('@formatjs/intl-displaynames/locale-data/eo'),
                        ])];
                case 18:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 19:
                    i18n.loadAndActivate({ locale: locale, messages: messagesEs });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/es'),
                            import('@formatjs/intl-numberformat/locale-data/es'),
                            import('@formatjs/intl-displaynames/locale-data/es'),
                        ])];
                case 20:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 21:
                    i18n.loadAndActivate({ locale: locale, messages: messagesEu });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/eu'),
                            import('@formatjs/intl-numberformat/locale-data/eu'),
                            import('@formatjs/intl-displaynames/locale-data/eu'),
                        ])];
                case 22:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 23:
                    i18n.loadAndActivate({ locale: locale, messages: messagesFi });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/fi'),
                            import('@formatjs/intl-numberformat/locale-data/fi'),
                            import('@formatjs/intl-displaynames/locale-data/fi'),
                        ])];
                case 24:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 25:
                    i18n.loadAndActivate({ locale: locale, messages: messagesFr });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/fr'),
                            import('@formatjs/intl-numberformat/locale-data/fr'),
                            import('@formatjs/intl-displaynames/locale-data/fr'),
                        ])];
                case 26:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 27:
                    i18n.loadAndActivate({ locale: locale, messages: messagesFy });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/fy'),
                            import('@formatjs/intl-numberformat/locale-data/fy'),
                            import('@formatjs/intl-displaynames/locale-data/fy'),
                        ])];
                case 28:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 29:
                    i18n.loadAndActivate({ locale: locale, messages: messagesGa });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ga'),
                            import('@formatjs/intl-numberformat/locale-data/ga'),
                            import('@formatjs/intl-displaynames/locale-data/ga'),
                        ])];
                case 30:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 31:
                    i18n.loadAndActivate({ locale: locale, messages: messagesGd });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/gd'),
                            import('@formatjs/intl-numberformat/locale-data/gd'),
                            import('@formatjs/intl-displaynames/locale-data/gd'),
                        ])];
                case 32:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 33:
                    i18n.loadAndActivate({ locale: locale, messages: messagesGl });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/gl'),
                            import('@formatjs/intl-numberformat/locale-data/gl'),
                            import('@formatjs/intl-displaynames/locale-data/gl'),
                        ])];
                case 34:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 35:
                    i18n.loadAndActivate({ locale: locale, messages: messagesHi });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/hi'),
                            import('@formatjs/intl-numberformat/locale-data/hi'),
                            import('@formatjs/intl-displaynames/locale-data/hi'),
                        ])];
                case 36:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 37:
                    i18n.loadAndActivate({ locale: locale, messages: messagesHu });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/hu'),
                            import('@formatjs/intl-numberformat/locale-data/hu'),
                            import('@formatjs/intl-displaynames/locale-data/hu'),
                        ])];
                case 38:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 39:
                    i18n.loadAndActivate({ locale: locale, messages: messagesIa });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ia'),
                            import('@formatjs/intl-numberformat/locale-data/ia'),
                            import('@formatjs/intl-displaynames/locale-data/ia'),
                        ])];
                case 40:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 41:
                    i18n.loadAndActivate({ locale: locale, messages: messagesId });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/id'),
                            import('@formatjs/intl-numberformat/locale-data/id'),
                            import('@formatjs/intl-displaynames/locale-data/id'),
                        ])];
                case 42:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 43:
                    i18n.loadAndActivate({ locale: locale, messages: messagesIt });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/it'),
                            import('@formatjs/intl-numberformat/locale-data/it'),
                            import('@formatjs/intl-displaynames/locale-data/it'),
                        ])];
                case 44:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 45:
                    i18n.loadAndActivate({ locale: locale, messages: messagesJa });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ja'),
                            import('@formatjs/intl-numberformat/locale-data/ja'),
                            import('@formatjs/intl-displaynames/locale-data/ja'),
                        ])];
                case 46:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 47:
                    i18n.loadAndActivate({ locale: locale, messages: messagesKm });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/km'),
                            import('@formatjs/intl-numberformat/locale-data/km'),
                            import('@formatjs/intl-displaynames/locale-data/km'),
                        ])];
                case 48:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 49:
                    i18n.loadAndActivate({ locale: locale, messages: messagesKo });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ko'),
                            import('@formatjs/intl-numberformat/locale-data/ko'),
                            import('@formatjs/intl-displaynames/locale-data/ko'),
                        ])];
                case 50:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 51:
                    i18n.loadAndActivate({ locale: locale, messages: messagesNe });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ne'),
                            import('@formatjs/intl-numberformat/locale-data/ne'),
                            import('@formatjs/intl-displaynames/locale-data/ne'),
                        ])];
                case 52:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 53:
                    i18n.loadAndActivate({ locale: locale, messages: messagesNl });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/nl'),
                            import('@formatjs/intl-numberformat/locale-data/nl'),
                            import('@formatjs/intl-displaynames/locale-data/nl'),
                        ])];
                case 54:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 55:
                    i18n.loadAndActivate({ locale: locale, messages: messagesPl });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/pl'),
                            import('@formatjs/intl-numberformat/locale-data/pl'),
                            import('@formatjs/intl-displaynames/locale-data/pl'),
                        ])];
                case 56:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 57:
                    i18n.loadAndActivate({ locale: locale, messages: messagesPt_BR });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/pt'),
                            import('@formatjs/intl-numberformat/locale-data/pt'),
                            import('@formatjs/intl-displaynames/locale-data/pt'),
                        ])];
                case 58:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 59:
                    i18n.loadAndActivate({ locale: locale, messages: messagesPt_PT });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/pt-PT'),
                            import('@formatjs/intl-numberformat/locale-data/pt-PT'),
                            import('@formatjs/intl-displaynames/locale-data/pt-PT'),
                        ])];
                case 60:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 61:
                    i18n.loadAndActivate({ locale: locale, messages: messagesRo });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ro'),
                            import('@formatjs/intl-numberformat/locale-data/ro'),
                            import('@formatjs/intl-displaynames/locale-data/ro'),
                        ])];
                case 62:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 63:
                    i18n.loadAndActivate({ locale: locale, messages: messagesRu });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/ru'),
                            import('@formatjs/intl-numberformat/locale-data/ru'),
                            import('@formatjs/intl-displaynames/locale-data/ru'),
                        ])];
                case 64:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 65:
                    i18n.loadAndActivate({ locale: locale, messages: messagesSv });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/sv'),
                            import('@formatjs/intl-numberformat/locale-data/sv'),
                            import('@formatjs/intl-displaynames/locale-data/sv'),
                        ])];
                case 66:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 67:
                    i18n.loadAndActivate({ locale: locale, messages: messagesTh });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/th'),
                            import('@formatjs/intl-numberformat/locale-data/th'),
                            import('@formatjs/intl-displaynames/locale-data/th'),
                        ])];
                case 68:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 69:
                    i18n.loadAndActivate({ locale: locale, messages: messagesTr });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/tr'),
                            import('@formatjs/intl-numberformat/locale-data/tr'),
                            import('@formatjs/intl-displaynames/locale-data/tr'),
                        ])];
                case 70:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 71:
                    i18n.loadAndActivate({ locale: locale, messages: messagesUk });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/uk'),
                            import('@formatjs/intl-numberformat/locale-data/uk'),
                            import('@formatjs/intl-displaynames/locale-data/uk'),
                        ])];
                case 72:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 73:
                    i18n.loadAndActivate({ locale: locale, messages: messagesVi });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/vi'),
                            import('@formatjs/intl-numberformat/locale-data/vi'),
                            import('@formatjs/intl-displaynames/locale-data/vi'),
                        ])];
                case 74:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 75:
                    i18n.loadAndActivate({ locale: locale, messages: messagesZh_CN });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/zh'),
                            import('@formatjs/intl-numberformat/locale-data/zh'),
                            import('@formatjs/intl-displaynames/locale-data/zh'),
                        ])];
                case 76:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 77:
                    i18n.loadAndActivate({ locale: locale, messages: messagesZh_HK });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/zh'),
                            import('@formatjs/intl-numberformat/locale-data/zh'),
                            import('@formatjs/intl-displaynames/locale-data/zh'),
                        ])];
                case 78:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 79:
                    i18n.loadAndActivate({ locale: locale, messages: messagesZh_TW });
                    return [4 /*yield*/, Promise.all([
                            import('@formatjs/intl-pluralrules/locale-data/zh'),
                            import('@formatjs/intl-numberformat/locale-data/zh'),
                            import('@formatjs/intl-displaynames/locale-data/zh'),
                        ])];
                case 80:
                    _b.sent();
                    return [3 /*break*/, 82];
                case 81:
                    {
                        i18n.loadAndActivate({ locale: locale, messages: messagesEn });
                        return [3 /*break*/, 82];
                    }
                    _b.label = 82;
                case 82: return [2 /*return*/];
            }
        });
    });
}
export function useLocaleLanguage() {
    var appLanguage = useLanguagePrefs().appLanguage;
    useEffect(function () {
        dynamicActivate(sanitizeAppLanguageSetting(appLanguage));
    }, [appLanguage]);
}
