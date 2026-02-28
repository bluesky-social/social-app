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
import { launchImageLibraryAsync, UIImagePickerPreferredAssetRepresentationMode, } from 'expo-image-picker';
import { t } from '@lingui/core/macro';
import * as Toast from '#/view/com/util/Toast';
import { IS_IOS, IS_WEB } from '#/env';
import { VIDEO_MAX_DURATION_MS } from '../constants';
import { getDataUriSize } from './util';
export function openPicker(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, launchImageLibraryAsync(__assign(__assign({ exif: false, mediaTypes: ['images'], quality: 1, selectionLimit: 1 }, opts), { legacy: true, preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Automatic }))];
                case 1:
                    response = _b.sent();
                    return [2 /*return*/, ((_a = response.assets) !== null && _a !== void 0 ? _a : [])
                            .filter(function (asset) {
                            var _a;
                            if ((_a = asset.mimeType) === null || _a === void 0 ? void 0 : _a.startsWith('image/'))
                                return true;
                            Toast.show(t(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Only image files are supported"], ["Only image files are supported"]))), 'exclamation-circle');
                            return false;
                        })
                            .map(function (image) { return ({
                            mime: image.mimeType || 'image/jpeg',
                            height: image.height,
                            width: image.width,
                            path: image.uri,
                            size: getDataUriSize(image.uri),
                        }); })];
            }
        });
    });
}
export function openUnifiedPicker(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var selectionCountRemaining = _b.selectionCountRemaining;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, launchImageLibraryAsync({
                        exif: false,
                        mediaTypes: ['images', 'videos'],
                        quality: 1,
                        allowsMultipleSelection: true,
                        legacy: true,
                        base64: IS_WEB,
                        selectionLimit: IS_IOS ? selectionCountRemaining : undefined,
                        preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Automatic,
                        videoMaxDuration: VIDEO_MAX_DURATION_MS / 1000,
                    })];
                case 1: return [2 /*return*/, _c.sent()];
            }
        });
    });
}
var templateObject_1;
