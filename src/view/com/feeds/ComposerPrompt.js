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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useCameraPermission, usePhotoLibraryPermission, useVideoLibraryPermission, } from '#/lib/hooks/usePermissions';
import { openCamera, openUnifiedPicker } from '#/lib/media/picker';
import { useCurrentAccountProfile } from '#/state/queries/useCurrentAccountProfile';
import { MAX_IMAGES } from '#/view/com/composer/state/composer';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, native, useTheme, web } from '#/alf';
import { Button } from '#/components/Button';
import { useSheetWrapper } from '#/components/Dialog/sheet-wrapper';
import { Camera_Stroke2_Corner0_Rounded as CameraIcon } from '#/components/icons/Camera';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { SubtleHover } from '#/components/SubtleHover';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
export function ComposerPrompt() {
    var _this = this;
    var _a;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var openComposer = useOpenComposer().openComposer;
    var profile = useCurrentAccountProfile();
    var _b = useState(false), hover = _b[0], setHover = _b[1];
    var requestCameraAccessIfNeeded = useCameraPermission().requestCameraAccessIfNeeded;
    var requestPhotoAccessIfNeeded = usePhotoLibraryPermission().requestPhotoAccessIfNeeded;
    var requestVideoAccessIfNeeded = useVideoLibraryPermission().requestVideoAccessIfNeeded;
    var sheetWrapper = useSheetWrapper();
    var onPress = useCallback(function () {
        ax.metric('composerPrompt:press', {});
        openComposer({});
    }, [ax, openComposer]);
    var onPressImage = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, photoAccess, videoAccess, selectionCountRemaining, _b, assets, canceled, imageUris, err_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ax.metric('composerPrompt:gallery:press', {});
                    // On web, open the composer with the gallery picker auto-opening
                    if (!IS_NATIVE) {
                        openComposer({ openGallery: true });
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, Promise.all([
                            requestPhotoAccessIfNeeded(),
                            requestVideoAccessIfNeeded(),
                        ])];
                case 2:
                    _a = _c.sent(), photoAccess = _a[0], videoAccess = _a[1];
                    if (!photoAccess && !videoAccess) {
                        return [2 /*return*/];
                    }
                    if (Keyboard.isVisible()) {
                        Keyboard.dismiss();
                    }
                    selectionCountRemaining = MAX_IMAGES;
                    return [4 /*yield*/, sheetWrapper(openUnifiedPicker({ selectionCountRemaining: selectionCountRemaining }))];
                case 3:
                    _b = _c.sent(), assets = _b.assets, canceled = _b.canceled;
                    if (canceled) {
                        return [2 /*return*/];
                    }
                    if (assets.length > 0) {
                        imageUris = assets
                            .filter(function (asset) { var _a; return (_a = asset.mimeType) === null || _a === void 0 ? void 0 : _a.startsWith('image/'); })
                            .slice(0, MAX_IMAGES)
                            .map(function (asset) { return ({
                            uri: asset.uri,
                            width: asset.width,
                            height: asset.height,
                        }); });
                        if (imageUris.length > 0) {
                            openComposer({ imageUris: imageUris });
                        }
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _c.sent();
                    if (!String(err_1).toLowerCase().includes('cancel')) {
                        ax.logger.error('Error opening image picker', { error: err_1 });
                    }
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [
        ax,
        openComposer,
        requestPhotoAccessIfNeeded,
        requestVideoAccessIfNeeded,
        sheetWrapper,
    ]);
    var onPressCamera = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var image, imageUris, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ax.metric('composerPrompt:camera:press', {});
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, requestCameraAccessIfNeeded()];
                case 2:
                    if (!(_a.sent())) {
                        return [2 /*return*/];
                    }
                    if (IS_NATIVE && Keyboard.isVisible()) {
                        Keyboard.dismiss();
                    }
                    return [4 /*yield*/, openCamera({
                            mediaTypes: 'images',
                        })];
                case 3:
                    image = _a.sent();
                    imageUris = [
                        {
                            uri: image.path,
                            width: image.width,
                            height: image.height,
                        },
                    ];
                    openComposer({
                        imageUris: IS_NATIVE ? imageUris : undefined,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _a.sent();
                    if (!String(err_2).toLowerCase().includes('cancel')) {
                        ax.logger.error('Error opening camera', { error: err_2 });
                    }
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [ax, openComposer, requestCameraAccessIfNeeded]);
    if (!profile) {
        return null;
    }
    return (_jsxs(Pressable, { onPress: onPress, android_ripple: null, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Compose new post"], ["Compose new post"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens the post composer"], ["Opens the post composer"])))), onPointerEnter: function () { return setHover(true); }, onPointerLeave: function () { return setHover(false); }, style: function (_a) {
            var pressed = _a.pressed;
            return [
                a.relative,
                a.flex_row,
                a.align_start,
                {
                    paddingLeft: 18,
                    paddingRight: 15,
                },
                a.py_md,
                native({
                    paddingTop: 10,
                    paddingBottom: 10,
                }),
                web({
                    cursor: 'pointer',
                    outline: 'none',
                }),
                pressed && web({ outline: 'none' }),
            ];
        }, children: [_jsx(SubtleHover, { hover: hover }), _jsx(UserAvatar, { avatar: profile.avatar, size: 42, type: ((_a = profile.associated) === null || _a === void 0 ? void 0 : _a.labeler) ? 'labeler' : 'user' }), _jsxs(View, { style: [
                    a.flex_1,
                    a.ml_md,
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    {
                        height: 40,
                    },
                ], children: [_jsx(Text, { style: [
                            t.atoms.text_contrast_medium,
                            a.text_md,
                            { includeFontPadding: false },
                        ], children: _jsx(Trans, { children: "What's up?" }) }), _jsxs(View, { style: [a.flex_row, a.gap_md], children: [IS_NATIVE && (_jsx(Button, { onPress: function (e) {
                                    e.stopPropagation();
                                    onPressCamera();
                                }, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Open camera"], ["Open camera"])))), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Opens device camera"], ["Opens device camera"])))), variant: "ghost", shape: "round", children: function (_a) {
                                    var hovered = _a.hovered, pressed = _a.pressed, focused = _a.focused;
                                    return (_jsx(CameraIcon, { size: "lg", style: {
                                            color: hovered || pressed || focused
                                                ? t.palette.primary_500
                                                : t.palette.contrast_300,
                                        } }));
                                } })), _jsx(Button, { onPress: function (e) {
                                    e.stopPropagation();
                                    onPressImage();
                                }, label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Add image"], ["Add image"])))), accessibilityHint: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Opens image picker"], ["Opens image picker"])))), variant: "ghost", shape: "round", children: function (_a) {
                                    var hovered = _a.hovered, pressed = _a.pressed, focused = _a.focused;
                                    return (_jsx(ImageIcon, { size: "lg", style: {
                                            color: hovered || pressed || focused
                                                ? t.palette.primary_500
                                                : t.palette.contrast_300,
                                        } }));
                                } })] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
