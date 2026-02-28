var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { Share } from 'react-native';
// import * as Sharing from 'expo-sharing'
import { setStringAsync } from 'expo-clipboard';
import { t } from '@lingui/core/macro';
import * as Toast from '#/view/com/util/Toast';
import { IS_ANDROID, IS_IOS } from '#/env';
/**
 * This function shares a URL using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 * @param {string} url - A string representing the URL that needs to be shared or copied to the
 * clipboard.
 */
export function shareUrl(url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!IS_ANDROID) return [3 /*break*/, 2];
                    return [4 /*yield*/, Share.share({ message: url })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    if (!IS_IOS) return [3 /*break*/, 4];
                    return [4 /*yield*/, Share.share({ url: url })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    // React Native Share is not supported by web. Web Share API
                    // has increasing but not full support, so default to clipboard
                    setStringAsync(url);
                    Toast.show(t(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Copied to clipboard"], ["Copied to clipboard"]))), 'clipboard-check');
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * This function shares a text using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 *
 * @param {string} text - A string representing the text that needs to be shared or copied to the
 * clipboard.
 */
export function shareText(text) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(IS_ANDROID || IS_IOS)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Share.share({ message: text })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, setStringAsync(text)];
                case 3:
                    _a.sent();
                    Toast.show(t(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Copied to clipboard"], ["Copied to clipboard"]))), 'clipboard-check');
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2;
