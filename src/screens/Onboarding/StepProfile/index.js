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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { launchImageLibraryAsync, UIImagePickerPreferredAssetRepresentationMode, } from 'expo-image-picker';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { usePhotoLibraryPermission } from '#/lib/hooks/usePermissions';
import { compressIfNeeded } from '#/lib/media/manip';
import { openCropper } from '#/lib/media/picker';
import { getDataUriSize } from '#/lib/media/util';
import { useRequestNotificationsPermission } from '#/lib/notifications/notifications';
import { isCancelledError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { OnboardingControls, OnboardingDescriptionText, OnboardingPosition, OnboardingTitleText, } from '#/screens/Onboarding/Layout';
import { useOnboardingInternalState } from '#/screens/Onboarding/state';
import { AvatarCircle } from '#/screens/Onboarding/StepProfile/AvatarCircle';
import { AvatarCreatorCircle } from '#/screens/Onboarding/StepProfile/AvatarCreatorCircle';
import { AvatarCreatorItems } from '#/screens/Onboarding/StepProfile/AvatarCreatorItems';
import { PlaceholderCanvas, } from '#/screens/Onboarding/StepProfile/PlaceholderCanvas';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useSheetWrapper } from '#/components/Dialog/sheet-wrapper';
import { CircleInfo_Stroke2_Corner0_Rounded } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE, IS_WEB } from '#/env';
import { avatarColors, emojiItems } from './types';
var AvatarContext = React.createContext({});
AvatarContext.displayName = 'AvatarContext';
export var useAvatar = function () { return React.useContext(AvatarContext); };
var randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
export function StepProfile() {
    var _this = this;
    var _a, _b, _c;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var requestPhotoAccessIfNeeded = usePhotoLibraryPermission().requestPhotoAccessIfNeeded;
    var requestNotificationsPermission = useRequestNotificationsPermission();
    var creatorControl = Dialog.useDialogControl();
    var _d = React.useState(''), error = _d[0], setError = _d[1];
    var _e = useOnboardingInternalState(), state = _e.state, dispatch = _e.dispatch;
    var _f = React.useState({
        image: (_a = state.profileStepResults) === null || _a === void 0 ? void 0 : _a.image,
        placeholder: ((_b = state.profileStepResults.creatorState) === null || _b === void 0 ? void 0 : _b.emoji) || emojiItems.at,
        backgroundColor: ((_c = state.profileStepResults.creatorState) === null || _c === void 0 ? void 0 : _c.backgroundColor) || randomColor,
        useCreatedAvatar: state.profileStepResults.isCreatedAvatar,
    }), avatar = _f[0], setAvatar = _f[1];
    var canvasRef = React.useRef(null);
    React.useEffect(function () {
        requestNotificationsPermission('StartOnboarding');
    }, [requestNotificationsPermission]);
    var sheetWrapper = useSheetWrapper();
    var openPicker = React.useCallback(function (opts) { return __awaiter(_this, void 0, void 0, function () {
        var response;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, sheetWrapper(launchImageLibraryAsync(__assign(__assign({ exif: false, mediaTypes: ['images'], quality: 1 }, opts), { legacy: true, preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Automatic })))];
                case 1:
                    response = _b.sent();
                    return [2 /*return*/, ((_a = response.assets) !== null && _a !== void 0 ? _a : [])
                            .slice(0, 1)
                            .filter(function (asset) {
                            var _a, _b, _c, _d;
                            if (!((_a = asset.mimeType) === null || _a === void 0 ? void 0 : _a.startsWith('image/')) ||
                                (!((_b = asset.mimeType) === null || _b === void 0 ? void 0 : _b.endsWith('jpeg')) &&
                                    !((_c = asset.mimeType) === null || _c === void 0 ? void 0 : _c.endsWith('jpg')) &&
                                    !((_d = asset.mimeType) === null || _d === void 0 ? void 0 : _d.endsWith('png')))) {
                                setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Only .jpg and .png files are supported"], ["Only .jpg and .png files are supported"])))));
                                return false;
                            }
                            return true;
                        })
                            .map(function (image) { return ({
                            mime: 'image/jpeg',
                            height: image.height,
                            width: image.width,
                            path: image.uri,
                            size: getDataUriSize(image.uri),
                        }); })];
            }
        });
    }); }, [_, setError, sheetWrapper]);
    var onContinue = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var imageUri;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    imageUri = (_a = avatar === null || avatar === void 0 ? void 0 : avatar.image) === null || _a === void 0 ? void 0 : _a.path;
                    if (!(!imageUri || avatar.useCreatedAvatar)) return [3 /*break*/, 2];
                    return [4 /*yield*/, ((_b = canvasRef.current) === null || _b === void 0 ? void 0 : _b.capture())];
                case 1:
                    imageUri = _e.sent();
                    _e.label = 2;
                case 2:
                    if (imageUri) {
                        dispatch({
                            type: 'setProfileStepResults',
                            image: avatar.image,
                            imageUri: imageUri,
                            imageMime: (_d = (_c = avatar.image) === null || _c === void 0 ? void 0 : _c.mime) !== null && _d !== void 0 ? _d : 'image/jpeg',
                            isCreatedAvatar: avatar.useCreatedAvatar,
                            creatorState: {
                                emoji: avatar.placeholder,
                                backgroundColor: avatar.backgroundColor,
                            },
                        });
                    }
                    dispatch({ type: 'next' });
                    ax.metric('onboarding:profile:nextPressed', {});
                    return [2 /*return*/];
            }
        });
    }); }, [ax, avatar, dispatch]);
    var onDoneCreating = React.useCallback(function () {
        setAvatar(function (prev) { return (__assign(__assign({}, prev), { image: undefined, useCreatedAvatar: true })); });
        creatorControl.close();
    }, [creatorControl]);
    var openLibrary = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var items, image, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, requestPhotoAccessIfNeeded()];
                case 1:
                    if (!(_a.sent())) {
                        return [2 /*return*/];
                    }
                    setError('');
                    return [4 /*yield*/, sheetWrapper(openPicker({
                            aspect: [1, 1],
                        }))];
                case 2:
                    items = _a.sent();
                    image = items[0];
                    if (!image)
                        return [2 /*return*/];
                    if (!!IS_WEB) return [3 /*break*/, 6];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, openCropper({
                            imageUri: image.path,
                            shape: 'circle',
                            aspectRatio: 1 / 1,
                        })];
                case 4:
                    image = _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    if (!isCancelledError(e_1)) {
                        logger.error('Failed to crop avatar in onboarding', { error: e_1 });
                    }
                    return [3 /*break*/, 6];
                case 6: return [4 /*yield*/, compressIfNeeded(image, 1000000)
                    // If we are on mobile, prefetching the image will load the image into memory before we try and display it,
                    // stopping any brief flickers.
                ];
                case 7:
                    image = _a.sent();
                    if (!IS_NATIVE) return [3 /*break*/, 9];
                    return [4 /*yield*/, ExpoImage.prefetch(image.path)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    setAvatar(function (prev) { return (__assign(__assign({}, prev), { image: image, useCreatedAvatar: false })); });
                    return [2 /*return*/];
            }
        });
    }); }, [
        requestPhotoAccessIfNeeded,
        setAvatar,
        openPicker,
        setError,
        sheetWrapper,
    ]);
    var onSecondaryPress = React.useCallback(function () {
        if (avatar.useCreatedAvatar) {
            openLibrary();
        }
        else {
            creatorControl.open();
        }
    }, [avatar.useCreatedAvatar, creatorControl, openLibrary]);
    var value = React.useMemo(function () { return ({
        avatar: avatar,
        setAvatar: setAvatar,
    }); }, [avatar]);
    return (_jsxs(AvatarContext.Provider, { value: value, children: [_jsxs(View, { style: [a.align_start], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(OnboardingPosition, {}), _jsx(OnboardingTitleText, { children: _jsx(Trans, { children: "Give your profile a face" }) }), _jsx(OnboardingDescriptionText, { children: _jsx(Trans, { children: "Help people know you're not a bot by uploading a picture or creating an avatar." }) })] }), _jsxs(View, { style: [a.w_full, a.align_center, { paddingTop: gtMobile ? 80 : 60 }], children: [_jsx(AvatarCircle, { openLibrary: openLibrary, openCreator: creatorControl.open }), error && (_jsxs(View, { style: [
                                    a.flex_row,
                                    a.gap_sm,
                                    a.align_center,
                                    a.mt_xl,
                                    a.py_md,
                                    a.px_lg,
                                    a.border,
                                    a.rounded_md,
                                    t.atoms.bg_contrast_25,
                                    t.atoms.border_contrast_low,
                                ], children: [_jsx(CircleInfo_Stroke2_Corner0_Rounded, { size: "sm" }), _jsx(Text, { style: [a.leading_snug], children: error })] }))] }), _jsx(OnboardingControls.Portal, { children: _jsxs(View, { style: [a.gap_md, gtMobile && a.flex_row_reverse], children: [_jsx(Button, { testID: "onboardingContinue", color: "primary", size: "large", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Continue to next step"], ["Continue to next step"])))), onPress: onContinue, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Continue" }) }) }), _jsx(Button, { testID: "onboardingAvatarCreator", color: "primary_subtle", size: "large", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Open avatar creator"], ["Open avatar creator"])))), onPress: onSecondaryPress, children: _jsx(ButtonText, { children: avatar.useCreatedAvatar ? (_jsx(Trans, { children: "Upload a photo instead" })) : (_jsx(Trans, { children: "Create an avatar instead" })) }) })] }) })] }), _jsx(Dialog.Outer, { control: creatorControl, children: _jsxs(Dialog.Inner, { label: "Avatar creator", style: [
                        {
                            width: 'auto',
                            maxWidth: 410,
                        },
                    ], children: [_jsx(View, { style: [a.align_center, { paddingTop: 20 }], children: _jsx(AvatarCreatorCircle, { avatar: avatar }) }), _jsxs(View, { style: [a.pt_3xl, a.gap_lg], children: [_jsx(AvatarCreatorItems, { type: "emojis", avatar: avatar, setAvatar: setAvatar }), _jsx(AvatarCreatorItems, { type: "colors", avatar: avatar, setAvatar: setAvatar })] }), _jsx(View, { style: [a.pt_4xl], children: _jsx(Button, { color: "primary", size: "large", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Done"], ["Done"])))), onPress: onDoneCreating, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Done" }) }) }) })] }) }), _jsx(PlaceholderCanvas, { ref: canvasRef })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
