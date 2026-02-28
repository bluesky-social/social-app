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
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { POST_IMG_MAX } from '#/lib/constants';
import { useCameraPermission } from '#/lib/hooks/usePermissions';
import { openCamera } from '#/lib/media/picker';
import { logger } from '#/logger';
import { createComposerImage } from '#/state/gallery';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { Camera_Stroke2_Corner0_Rounded as Camera } from '#/components/icons/Camera';
import { IS_NATIVE, IS_WEB_MOBILE } from '#/env';
export function OpenCameraBtn(_a) {
    var _this = this;
    var disabled = _a.disabled, onAdd = _a.onAdd;
    var _ = useLingui()._;
    var requestCameraAccessIfNeeded = useCameraPermission().requestCameraAccessIfNeeded;
    var _b = MediaLibrary.usePermissions({ granularPermissions: ['photo'] }), mediaPermissionRes = _b[0], requestMediaPermission = _b[1];
    var t = useTheme();
    var onPressTakePicture = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var img, res, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    return [4 /*yield*/, requestCameraAccessIfNeeded()];
                case 1:
                    if (!(_a.sent())) {
                        return [2 /*return*/];
                    }
                    if (!(!(mediaPermissionRes === null || mediaPermissionRes === void 0 ? void 0 : mediaPermissionRes.granted) && (mediaPermissionRes === null || mediaPermissionRes === void 0 ? void 0 : mediaPermissionRes.canAskAgain))) return [3 /*break*/, 3];
                    return [4 /*yield*/, requestMediaPermission()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, openCamera({
                        aspect: [POST_IMG_MAX.width, POST_IMG_MAX.height],
                    })
                    // If we don't have permissions it's fine, we just wont save it. The post itself will still have access to
                    // the image even without these permissions
                ];
                case 4:
                    img = _a.sent();
                    if (!mediaPermissionRes) return [3 /*break*/, 6];
                    return [4 /*yield*/, MediaLibrary.createAssetAsync(img.path)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, createComposerImage(img)];
                case 7:
                    res = _a.sent();
                    onAdd([res]);
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _a.sent();
                    // ignore
                    logger.warn('Error using camera', { error: err_1 });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); }, [
        onAdd,
        requestCameraAccessIfNeeded,
        mediaPermissionRes,
        requestMediaPermission,
    ]);
    var shouldShowCameraButton = IS_NATIVE || IS_WEB_MOBILE;
    if (!shouldShowCameraButton) {
        return null;
    }
    return (_jsx(Button, { testID: "openCameraButton", onPress: onPressTakePicture, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Camera"], ["Camera"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens camera on device"], ["Opens camera on device"])))), style: a.p_sm, variant: "ghost", shape: "round", color: "primary", disabled: disabled, children: _jsx(Camera, { size: "lg", style: disabled && t.atoms.text_contrast_low }) }));
}
var templateObject_1, templateObject_2;
