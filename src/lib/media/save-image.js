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
import { useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import * as Toast from '#/components/Toast';
import { IS_NATIVE } from '#/env';
import { saveImageToMediaLibrary } from './manip';
/**
 * Same as `saveImageToMediaLibrary`, but also handles permissions and toasts
 */
export function useSaveImageToMediaLibrary() {
    var _this = this;
    var _ = useLingui()._;
    var _a = MediaLibrary.usePermissions({
        granularPermissions: ['photo'],
    }), permissionResponse = _a[0], requestPermission = _a[1], getPermission = _a[2];
    return useCallback(function (uri) { return __awaiter(_this, void 0, void 0, function () {
        function save() {
            return __awaiter(this, void 0, void 0, function () {
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, saveImageToMediaLibrary({ uri: uri })];
                        case 1:
                            _a.sent();
                            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Image saved"], ["Image saved"])))));
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Failed to save image: ", ""], ["Failed to save image: ", ""])), String(e_1))), {
                                type: 'error',
                            });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        var permission, _a, askAgain;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!IS_NATIVE) {
                        throw new Error('useSaveImageToMediaLibrary is native only');
                    }
                    if (!(permissionResponse !== null && permissionResponse !== void 0)) return [3 /*break*/, 1];
                    _a = permissionResponse;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, getPermission()];
                case 2:
                    _a = (_b.sent());
                    _b.label = 3;
                case 3:
                    permission = _a;
                    if (!permission.granted) return [3 /*break*/, 5];
                    return [4 /*yield*/, save()];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 5:
                    if (!permission.canAskAgain) return [3 /*break*/, 10];
                    return [4 /*yield*/, requestPermission()];
                case 6:
                    askAgain = _b.sent();
                    if (!askAgain.granted) return [3 /*break*/, 8];
                    return [4 /*yield*/, save()];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 8:
                    // since we've been explicitly denied, show a toast.
                    Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Images cannot be saved unless permission is granted to access your photo library."], ["Images cannot be saved unless permission is granted to access your photo library."])))), { type: 'error' });
                    _b.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Permission to access your photo library was denied. Please enable it in your system settings."], ["Permission to access your photo library was denied. Please enable it in your system settings."])))), { type: 'error' });
                    _b.label = 11;
                case 11: return [2 /*return*/];
            }
        });
    }); }, [permissionResponse, requestPermission, getPermission, _]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
