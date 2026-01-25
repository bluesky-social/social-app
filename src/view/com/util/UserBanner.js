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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useCameraPermission, usePhotoLibraryPermission, } from '#/lib/hooks/usePermissions';
import { compressIfNeeded } from '#/lib/media/manip';
import { openCamera, openCropper, openPicker } from '#/lib/media/picker';
import { isCancelledError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { compressImage, createComposerImage, } from '#/state/gallery';
import { EditImageDialog } from '#/view/com/composer/photos/EditImageDialog';
import { EventStopper } from '#/view/com/util/EventStopper';
import { atoms as a, tokens, useTheme } from '#/alf';
import { useDialogControl } from '#/components/Dialog';
import { useSheetWrapper } from '#/components/Dialog/sheet-wrapper';
import { Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon, Camera_Stroke2_Corner0_Rounded as CameraIcon, } from '#/components/icons/Camera';
import { StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon } from '#/components/icons/StreamingLive';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Menu from '#/components/Menu';
import { IS_ANDROID, IS_NATIVE } from '#/env';
export function UserBanner(_a) {
    var _this = this;
    var type = _a.type, banner = _a.banner, moderation = _a.moderation, onSelectNewBanner = _a.onSelectNewBanner;
    var t = useTheme();
    var _ = useLingui()._;
    var requestCameraAccessIfNeeded = useCameraPermission().requestCameraAccessIfNeeded;
    var requestPhotoAccessIfNeeded = usePhotoLibraryPermission().requestPhotoAccessIfNeeded;
    var sheetWrapper = useSheetWrapper();
    var _b = useState(), rawImage = _b[0], setRawImage = _b[1];
    var editImageDialogControl = useDialogControl();
    var onOpenCamera = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, requestCameraAccessIfNeeded()];
                case 1:
                    if (!(_d.sent())) {
                        return [2 /*return*/];
                    }
                    if (!(onSelectNewBanner === null || onSelectNewBanner === void 0)) return [3 /*break*/, 2];
                    _a = void 0;
                    return [3 /*break*/, 5];
                case 2:
                    _b = onSelectNewBanner;
                    _c = compressIfNeeded;
                    return [4 /*yield*/, openCamera({
                            aspect: [3, 1],
                        })];
                case 3: return [4 /*yield*/, _c.apply(void 0, [_d.sent()])];
                case 4:
                    _a = _b.apply(void 0, [_d.sent()]);
                    _d.label = 5;
                case 5:
                    _a;
                    return [2 /*return*/];
            }
        });
    }); }, [onSelectNewBanner, requestCameraAccessIfNeeded]);
    var onOpenLibrary = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var items, _a, _b, _c, _d, e_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, requestPhotoAccessIfNeeded()];
                case 1:
                    if (!(_e.sent())) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, sheetWrapper(openPicker())];
                case 2:
                    items = _e.sent();
                    if (!items[0]) {
                        return [2 /*return*/];
                    }
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 11, , 12]);
                    if (!IS_NATIVE) return [3 /*break*/, 8];
                    if (!(onSelectNewBanner === null || onSelectNewBanner === void 0)) return [3 /*break*/, 4];
                    _a = void 0;
                    return [3 /*break*/, 7];
                case 4:
                    _b = onSelectNewBanner;
                    _c = compressIfNeeded;
                    return [4 /*yield*/, openCropper({
                            imageUri: items[0].path,
                            aspectRatio: 3 / 1,
                        })];
                case 5: return [4 /*yield*/, _c.apply(void 0, [_e.sent()])];
                case 6:
                    _a = _b.apply(void 0, [_e.sent()]);
                    _e.label = 7;
                case 7:
                    _a;
                    return [3 /*break*/, 10];
                case 8:
                    _d = setRawImage;
                    return [4 /*yield*/, createComposerImage(items[0])];
                case 9:
                    _d.apply(void 0, [_e.sent()]);
                    editImageDialogControl.open();
                    _e.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    e_1 = _e.sent();
                    // Don't log errors for cancelling selection to sentry on ios or android
                    if (!isCancelledError(e_1)) {
                        logger.error('Failed to crop banner', { error: e_1 });
                    }
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    }); }, [
        onSelectNewBanner,
        requestPhotoAccessIfNeeded,
        sheetWrapper,
        editImageDialogControl,
    ]);
    var onRemoveBanner = useCallback(function () {
        onSelectNewBanner === null || onSelectNewBanner === void 0 ? void 0 : onSelectNewBanner(null);
    }, [onSelectNewBanner]);
    var onChangeEditImage = useCallback(function (image) { return __awaiter(_this, void 0, void 0, function () {
        var compressed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, compressImage(image)];
                case 1:
                    compressed = _a.sent();
                    onSelectNewBanner === null || onSelectNewBanner === void 0 ? void 0 : onSelectNewBanner(compressed);
                    return [2 /*return*/];
            }
        });
    }); }, [onSelectNewBanner]);
    // setUserBanner is only passed as prop on the EditProfile component
    return onSelectNewBanner ? (_jsxs(_Fragment, { children: [_jsx(EventStopper, { onKeyDown: true, children: _jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Edit avatar"], ["Edit avatar"])))), children: function (_a) {
                                var props = _a.props;
                                return (_jsxs(Pressable, __assign({}, props, { testID: "changeBannerBtn", children: [banner ? (_jsx(Image, { testID: "userBannerImage", style: styles.bannerImage, source: { uri: banner }, accessible: true, accessibilityIgnoresInvertColors: true })) : (_jsx(View, { testID: "userBannerFallback", style: [styles.bannerImage, t.atoms.bg_contrast_25] })), _jsx(View, { style: [
                                                styles.editButtonContainer,
                                                t.atoms.bg_contrast_25,
                                                a.border,
                                                t.atoms.border_contrast_low,
                                            ], children: _jsx(CameraFilledIcon, { height: 14, width: 14, style: t.atoms.text }) })] })));
                            } }), _jsxs(Menu.Outer, { showCancel: true, children: [_jsxs(Menu.Group, { children: [IS_NATIVE && (_jsxs(Menu.Item, { testID: "changeBannerCameraBtn", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Upload from Camera"], ["Upload from Camera"])))), onPress: onOpenCamera, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Upload from Camera" }) }), _jsx(Menu.ItemIcon, { icon: CameraIcon })] })), _jsxs(Menu.Item, { testID: "changeBannerLibraryBtn", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Upload from Library"], ["Upload from Library"])))), onPress: onOpenLibrary, children: [_jsx(Menu.ItemText, { children: IS_NATIVE ? (_jsx(Trans, { children: "Upload from Library" })) : (_jsx(Trans, { children: "Upload from Files" })) }), _jsx(Menu.ItemIcon, { icon: LibraryIcon })] })] }), !!banner && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsx(Menu.Group, { children: _jsxs(Menu.Item, { testID: "changeBannerRemoveBtn", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Remove Banner"], ["Remove Banner"])))), onPress: onRemoveBanner, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Remove Banner" }) }), _jsx(Menu.ItemIcon, { icon: TrashIcon })] }) })] }))] })] }) }), _jsx(EditImageDialog, { control: editImageDialogControl, image: rawImage, onChange: onChangeEditImage, aspectRatio: 3 })] })) : banner &&
        !(((moderation === null || moderation === void 0 ? void 0 : moderation.blur) && IS_ANDROID) /* android crashes with blur */) ? (_jsx(Image, { testID: "userBannerImage", style: [styles.bannerImage, t.atoms.bg_contrast_25], contentFit: "cover", source: { uri: banner }, blurRadius: (moderation === null || moderation === void 0 ? void 0 : moderation.blur) ? 100 : 0, accessible: true, accessibilityIgnoresInvertColors: true })) : (_jsx(View, { testID: "userBannerFallback", style: [
            styles.bannerImage,
            type === 'labeler' ? styles.labelerBanner : t.atoms.bg_contrast_25,
        ] }));
}
var styles = StyleSheet.create({
    editButtonContainer: {
        position: 'absolute',
        width: 24,
        height: 24,
        bottom: 8,
        right: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerImage: {
        width: '100%',
        height: 150,
    },
    labelerBanner: {
        backgroundColor: tokens.color.temp_purple,
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
