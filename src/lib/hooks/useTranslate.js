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
import { useCallback } from 'react';
import * as IntentLauncher from 'expo-intent-launcher';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { getTranslatorLink } from '#/locale/helpers';
import { IS_ANDROID } from '#/env';
/**
 * Will always link out to Google Translate. If inline translation is desired,
 * use `useTranslateOnDevice`
 */
export function useTranslate() {
    var _this = this;
    var openLink = useOpenLink();
    return useCallback(function (text, targetLangCode, sourceLanguage) { return __awaiter(_this, void 0, void 0, function () {
        var translateUrl, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    translateUrl = getTranslatorLink(text, targetLangCode, sourceLanguage);
                    if (!IS_ANDROID) return [3 /*break*/, 7];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, IntentLauncher.getApplicationIconAsync('com.google.android.apps.translate')];
                case 2:
                    // use `getApplicationIconAsync` to determine if the translate app is installed
                    if (!(_a.sent())) {
                        throw new Error('Translate app not installed');
                    }
                    // TODO: this should only be called one at a time, use something like
                    // RQ's `scope` - otherwise can trigger the browser to open unexpectedly when the call throws -sfn
                    return [4 /*yield*/, IntentLauncher.startActivityAsync('android.intent.action.PROCESS_TEXT', {
                            type: 'text/plain',
                            extra: {
                                'android.intent.extra.PROCESS_TEXT': text,
                                'android.intent.extra.PROCESS_TEXT_READONLY': true,
                            },
                            // note: to skip the intermediate app select, we need to specify a
                            // `className`. however, this isn't safe to hardcode, we'd need to query the
                            // package manager for the correct activity. this requires native code, so
                            // skip for now -sfn
                            // packageName: 'com.google.android.apps.translate',
                            // className: 'com.google.android.apps.translate.TranslateActivity',
                        })];
                case 3:
                    // TODO: this should only be called one at a time, use something like
                    // RQ's `scope` - otherwise can trigger the browser to open unexpectedly when the call throws -sfn
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    if (__DEV__)
                        console.error(err_1);
                    // most likely means they don't have the translate app
                    return [4 /*yield*/, openLink(translateUrl)];
                case 5:
                    // most likely means they don't have the translate app
                    _a.sent();
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, openLink(translateUrl)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9: return [2 /*return*/];
            }
        });
    }); }, [openLink]);
}
