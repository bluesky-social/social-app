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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useCallback, useContext, useMemo, useState, } from 'react';
import { LayoutAnimation, Platform } from 'react-native';
import { getLocales } from 'expo-localization';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { getTranslatorLink } from '#/locale/helpers';
import { logger } from '#/logger';
import { useLanguagePrefs } from '#/state/preferences';
import { useAnalytics } from '#/analytics';
var IDLE = { status: 'idle' };
/**
 * Attempts on-device translation via @bsky.app/expo-translate-text.
 * Uses a lazy import to avoid crashing if the native module isn't linked into
 * the current build.
 */
function attemptTranslation(input, targetLangCodeOriginal, sourceLangCodeOriginal) {
    return __awaiter(this, void 0, void 0, function () {
        var targetLangCode, sourceLangCode, deviceLocales, primaryLanguageTag, onTranslateTask, result;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    targetLangCode = Platform.OS === 'android'
                        ? targetLangCodeOriginal.split('-')[0]
                        : targetLangCodeOriginal;
                    sourceLangCode = Platform.OS === 'android'
                        ? sourceLangCodeOriginal === null || sourceLangCodeOriginal === void 0 ? void 0 : sourceLangCodeOriginal.split('-')[0]
                        : sourceLangCodeOriginal;
                    // Special cases for regional languages
                    if (Platform.OS !== 'android') {
                        deviceLocales = getLocales();
                        primaryLanguageTag = (_a = deviceLocales[0]) === null || _a === void 0 ? void 0 : _a.languageTag;
                        switch (targetLangCodeOriginal) {
                            case 'en': // en-US, en-GB
                            case 'es': // es-419, es-ES
                            case 'pt': // pt-BR, pt-PT
                            case 'zh': // zh-Hans-CN, zh-Hant-HK, zh-Hant-TW
                                targetLangCode = primaryLanguageTag !== null && primaryLanguageTag !== void 0 ? primaryLanguageTag : targetLangCodeOriginal;
                                break;
                        }
                    }
                    onTranslateTask = 
                    // Needed in order to type check the dynamically imported module.
                    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
                    require('@bsky.app/expo-translate-text').onTranslateTask;
                    return [4 /*yield*/, onTranslateTask({
                            input: input,
                            targetLangCode: targetLangCode,
                            sourceLangCode: sourceLangCode,
                        })
                        // Since `input` is always a string, the result should always be a string.
                    ];
                case 1:
                    result = _d.sent();
                    // Since `input` is always a string, the result should always be a string.
                    return [2 /*return*/, {
                            translatedText: typeof result.translatedTexts === 'string' ? result.translatedTexts : '',
                            targetLanguage: result.targetLanguage,
                            sourceLanguage: (_c = (_b = result.sourceLanguage) !== null && _b !== void 0 ? _b : sourceLangCode) !== null && _c !== void 0 ? _c : null, // iOS doesn't return the source language
                        }];
            }
        });
    });
}
var Context = createContext({
    translationState: IDLE,
    translate: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    clearTranslation: function () { },
});
Context.displayName = 'TranslationContext';
/**
 * Native translation hook. Attempts on-device translation using Apple
 * Translation (iOS 18+) or Google ML Kit (Android).
 *
 * Falls back to Google Translate URL if the language pack is unavailable.
 *
 * Web uses index.web.ts which always opens Google Translate.
 */
export function useTranslateOnDevice() {
    var context = useContext(Context);
    if (!context) {
        throw new Error('useTranslateOnDevice must be used within a TranslateOnDeviceProvider');
    }
    return context;
}
export function Provider(_a) {
    var _this = this;
    var children = _a.children;
    var _b = useState(IDLE), translationState = _b[0], setTranslationState = _b[1];
    var openLink = useOpenLink();
    var ax = useAnalytics();
    var primaryLanguage = useLanguagePrefs().primaryLanguage;
    var clearTranslation = useCallback(function () {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTranslationState(IDLE);
    }, []);
    var translate = useCallback(function (text_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([text_1], args_1, true), void 0, function (text, targetLangCode, sourceLangCode) {
            var result, e_1, translateUrl;
            if (targetLangCode === void 0) { targetLangCode = primaryLanguage; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setTranslationState({ status: 'loading' });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, attemptTranslation(text, targetLangCode, sourceLangCode)];
                    case 2:
                        result = _a.sent();
                        ax.metric('translate:result', {
                            method: 'on-device',
                            os: Platform.OS,
                            sourceLanguage: result.sourceLanguage,
                            targetLanguage: result.targetLanguage,
                        });
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setTranslationState({
                            status: 'success',
                            translatedText: result.translatedText,
                            sourceLanguage: result.sourceLanguage,
                            targetLanguage: result.targetLanguage,
                        });
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        logger.error('Failed to translate post on device', { safeMessage: e_1 });
                        // On-device translation failed (language pack missing or user dismissed
                        // the download prompt). Fall back to Google Translate.
                        ax.metric('translate:result', {
                            method: 'fallback-alert',
                            os: Platform.OS,
                            sourceLanguage: sourceLangCode !== null && sourceLangCode !== void 0 ? sourceLangCode : null,
                            targetLanguage: targetLangCode,
                        });
                        setTranslationState({ status: 'idle' });
                        translateUrl = getTranslatorLink(text, targetLangCode, sourceLangCode);
                        return [4 /*yield*/, openLink(translateUrl)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, [ax, openLink, primaryLanguage, setTranslationState]);
    var ctx = useMemo(function () { return ({ clearTranslation: clearTranslation, translate: translate, translationState: translationState }); }, [clearTranslation, translate, translationState]);
    return _jsx(Context.Provider, { value: ctx, children: children });
}
