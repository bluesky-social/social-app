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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useMemo, useState } from 'react';
import { Image as RNImage, Pressable, StyleSheet, View, } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Image as ExpoImage } from 'expo-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useActorStatus } from '#/lib/actor-status';
import { useHaptics } from '#/lib/haptics';
import { useCameraPermission, usePhotoLibraryPermission, } from '#/lib/hooks/usePermissions';
import { compressIfNeeded } from '#/lib/media/manip';
import { openCamera, openCropper, openPicker } from '#/lib/media/picker';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { isCancelledError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { compressImage, createComposerImage, } from '#/state/gallery';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';
import { EditImageDialog } from '#/view/com/composer/photos/EditImageDialog';
import { atoms as a, tokens, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { useSheetWrapper } from '#/components/Dialog/sheet-wrapper';
import { Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon, Camera_Stroke2_Corner0_Rounded as CameraIcon, } from '#/components/icons/Camera';
import { StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon } from '#/components/icons/StreamingLive';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Link } from '#/components/Link';
import { LiveIndicator } from '#/components/live/LiveIndicator';
import { LiveStatusDialog } from '#/components/live/LiveStatusDialog';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import * as Menu from '#/components/Menu';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { useAnalytics } from '#/analytics';
import { IS_ANDROID, IS_NATIVE, IS_WEB, IS_WEB_TOUCH_DEVICE } from '#/env';
var BLUR_AMOUNT = IS_WEB ? 5 : 100;
var DefaultAvatar = function (_a) {
    var type = _a.type, overrideShape = _a.shape, size = _a.size;
    var finalShape = overrideShape !== null && overrideShape !== void 0 ? overrideShape : (type === 'user' ? 'circle' : 'square');
    var aviStyle = useMemo(function () {
        if (finalShape === 'square') {
            return { borderRadius: size > 32 ? 8 : 3, overflow: 'hidden' };
        }
    }, [finalShape, size]);
    if (type === 'algo') {
        // TODO: shape=circle
        // Font Awesome Pro 6.4.0 by @fontawesome -https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.
        return (_jsxs(Svg, { testID: "userAvatarFallback", width: size, height: size, viewBox: "0 0 32 32", fill: "none", stroke: "none", style: aviStyle, children: [_jsx(Rect, { width: "32", height: "32", rx: "4", fill: "#0070FF" }), _jsx(Path, { d: "M13.5 7.25C13.5 6.55859 14.0586 6 14.75 6C20.9648 6 26 11.0352 26 17.25C26 17.9414 25.4414 18.5 24.75 18.5C24.0586 18.5 23.5 17.9414 23.5 17.25C23.5 12.418 19.582 8.5 14.75 8.5C14.0586 8.5 13.5 7.94141 13.5 7.25ZM8.36719 14.6172L12.4336 18.6836L13.543 17.5742C13.5156 17.4727 13.5 17.3633 13.5 17.25C13.5 16.5586 14.0586 16 14.75 16C15.4414 16 16 16.5586 16 17.25C16 17.9414 15.4414 18.5 14.75 18.5C14.6367 18.5 14.5312 18.4844 14.4258 18.457L13.3164 19.5664L17.3828 23.6328C17.9492 24.1992 17.8438 25.1484 17.0977 25.4414C16.1758 25.8008 15.1758 26 14.125 26C9.63672 26 6 22.3633 6 17.875C6 16.8242 6.19922 15.8242 6.5625 14.9023C6.85547 14.1602 7.80469 14.0508 8.37109 14.6172H8.36719ZM14.75 9.75C18.8906 9.75 22.25 13.1094 22.25 17.25C22.25 17.9414 21.6914 18.5 21 18.5C20.3086 18.5 19.75 17.9414 19.75 17.25C19.75 14.4883 17.5117 12.25 14.75 12.25C14.0586 12.25 13.5 11.6914 13.5 11C13.5 10.3086 14.0586 9.75 14.75 9.75Z", fill: "white" })] }));
    }
    if (type === 'list') {
        // TODO: shape=circle
        // Font Awesome Pro 6.4.0 by @fontawesome -https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.
        return (_jsxs(Svg, { testID: "userAvatarFallback", width: size, height: size, viewBox: "0 0 32 32", fill: "none", stroke: "none", style: aviStyle, children: [_jsx(Path, { d: "M28 0H4C1.79086 0 0 1.79086 0 4V28C0 30.2091 1.79086 32 4 32H28C30.2091 32 32 30.2091 32 28V4C32 1.79086 30.2091 0 28 0Z", fill: "#0070FF" }), _jsx(Path, { d: "M22.1529 22.3542C23.4522 22.4603 24.7593 22.293 25.9899 21.8629C26.0369 21.2838 25.919 20.7032 25.6497 20.1884C25.3805 19.6735 24.9711 19.2454 24.4687 18.9535C23.9663 18.6617 23.3916 18.518 22.8109 18.5392C22.2303 18.5603 21.6676 18.7454 21.1878 19.0731M22.1529 22.3542C22.1489 21.1917 21.8142 20.0534 21.1878 19.0741ZM10.8111 19.0741C10.3313 18.7468 9.7687 18.5619 9.18826 18.5409C8.60781 18.5199 8.03327 18.6636 7.53107 18.9554C7.02888 19.2472 6.61953 19.6752 6.35036 20.1899C6.08119 20.7046 5.96319 21.285 6.01001 21.8639C7.23969 22.2964 8.5461 22.4632 9.84497 22.3531M10.8111 19.0741C10.1851 20.0535 9.84865 21.1908 9.84497 22.3531ZM19.0759 10.077C19.0759 10.8931 18.7518 11.6757 18.1747 12.2527C17.5977 12.8298 16.815 13.154 15.9989 13.154C15.1829 13.154 14.4002 12.8298 13.8232 12.2527C13.2461 11.6757 12.922 10.8931 12.922 10.077C12.922 9.26092 13.2461 8.47828 13.8232 7.90123C14.4002 7.32418 15.1829 7 15.9989 7C16.815 7 17.5977 7.32418 18.1747 7.90123C18.7518 8.47828 19.0759 9.26092 19.0759 10.077ZM25.2299 13.154C25.2299 13.457 25.1702 13.7571 25.0542 14.0371C24.9383 14.3171 24.7683 14.5715 24.554 14.7858C24.3397 15.0001 24.0853 15.1701 23.8053 15.2861C23.5253 15.402 23.2252 15.4617 22.9222 15.4617C22.6191 15.4617 22.319 15.402 22.039 15.2861C21.759 15.1701 21.5046 15.0001 21.2903 14.7858C21.0761 14.5715 20.9061 14.3171 20.7901 14.0371C20.6741 13.7571 20.6144 13.457 20.6144 13.154C20.6144 12.5419 20.8576 11.9549 21.2903 11.5222C21.7231 11.0894 22.3101 10.8462 22.9222 10.8462C23.5342 10.8462 24.1212 11.0894 24.554 11.5222C24.9868 11.9549 25.2299 12.5419 25.2299 13.154ZM11.3835 13.154C11.3835 13.457 11.3238 13.7571 11.2078 14.0371C11.0918 14.3171 10.9218 14.5715 10.7075 14.7858C10.4932 15.0001 10.2388 15.1701 9.95886 15.2861C9.67887 15.402 9.37878 15.4617 9.07572 15.4617C8.77266 15.4617 8.47257 15.402 8.19259 15.2861C7.9126 15.1701 7.6582 15.0001 7.4439 14.7858C7.22961 14.5715 7.05962 14.3171 6.94365 14.0371C6.82767 13.7571 6.76798 13.457 6.76798 13.154C6.76798 12.5419 7.01112 11.9549 7.4439 11.5222C7.87669 11.0894 8.46367 10.8462 9.07572 10.8462C9.68777 10.8462 10.2748 11.0894 10.7075 11.5222C11.1403 11.9549 11.3835 12.5419 11.3835 13.154Z", fill: "white" }), _jsx(Path, { d: "M22 22C22 25.3137 19.3137 25.5 16 25.5C12.6863 25.5 10 25.3137 10 22C10 18.6863 12.6863 16 16 16C19.3137 16 22 18.6863 22 22Z", fill: "white" })] }));
    }
    if (type === 'labeler') {
        return (_jsxs(Svg, { testID: "userAvatarFallback", width: size, height: size, viewBox: "0 0 32 32", fill: "none", stroke: "none", style: aviStyle, children: [finalShape === 'square' ? (_jsx(Rect, { x: "0", y: "0", width: "32", height: "32", rx: "3", fill: tokens.color.temp_purple })) : (_jsx(Circle, { cx: "16", cy: "16", r: "16", fill: tokens.color.temp_purple })), _jsx(Path, { d: "M24 9.75L16 7L8 9.75V15.9123C8 20.8848 12 23 16 25.1579C20 23 24 20.8848 24 15.9123V9.75Z", stroke: "white", strokeWidth: "2", strokeLinecap: "square", strokeLinejoin: "round" })] }));
    }
    // TODO: shape=square
    return (_jsxs(Svg, { testID: "userAvatarFallback", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "none", style: aviStyle, children: [_jsx(Circle, { cx: "12", cy: "12", r: "12", fill: "#0070ff" }), _jsx(Circle, { cx: "12", cy: "9.5", r: "3.5", fill: "#fff" }), _jsx(Path, { strokeLinecap: "round", strokeLinejoin: "round", fill: "#fff", d: "M 12.058 22.784 C 9.422 22.784 7.007 21.836 5.137 20.262 C 5.667 17.988 8.534 16.25 11.99 16.25 C 15.494 16.25 18.391 18.036 18.864 20.357 C 17.01 21.874 14.64 22.784 12.058 22.784 Z" })] }));
};
DefaultAvatar = memo(DefaultAvatar);
export { DefaultAvatar };
var UserAvatar = function (_a) {
    var _b = _a.type, type = _b === void 0 ? 'user' : _b, overrideShape = _a.shape, size = _a.size, avatar = _a.avatar, moderation = _a.moderation, _c = _a.usePlainRNImage, usePlainRNImage = _c === void 0 ? false : _c, onLoad = _a.onLoad, style = _a.style, live = _a.live, hideLiveBadge = _a.hideLiveBadge, noBorder = _a.noBorder;
    var t = useTheme();
    var finalShape = overrideShape !== null && overrideShape !== void 0 ? overrideShape : (type === 'user' ? 'circle' : 'square');
    var aviStyle = useMemo(function () {
        var borderRadius;
        if (finalShape === 'square') {
            borderRadius = size > 32 ? 8 : 3;
        }
        else {
            borderRadius = Math.floor(size / 2);
        }
        return {
            width: size,
            height: size,
            borderRadius: borderRadius,
            backgroundColor: t.palette.contrast_25,
        };
    }, [finalShape, size, t]);
    var borderStyle = useMemo(function () {
        return [
            { borderRadius: aviStyle.borderRadius },
            live && {
                borderColor: t.palette.negative_500,
                borderWidth: size > 16 ? 2 : 1,
                opacity: 1,
            },
        ];
    }, [aviStyle.borderRadius, live, t, size]);
    var alert = useMemo(function () {
        if (!(moderation === null || moderation === void 0 ? void 0 : moderation.alert)) {
            return null;
        }
        return (_jsx(View, { style: [
                a.absolute,
                a.right_0,
                a.bottom_0,
                a.rounded_full,
                { backgroundColor: t.palette.white },
            ], children: _jsx(FontAwesomeIcon, { icon: "exclamation-circle", style: { color: t.palette.negative_400 }, size: Math.floor(size / 3) }) }));
    }, [moderation === null || moderation === void 0 ? void 0 : moderation.alert, size, t]);
    var containerStyle = useMemo(function () {
        return [
            {
                width: size,
                height: size,
            },
            style,
        ];
    }, [size, style]);
    return avatar &&
        !(((moderation === null || moderation === void 0 ? void 0 : moderation.blur) && IS_ANDROID) /* android crashes with blur */) ? (_jsxs(View, { style: containerStyle, children: [usePlainRNImage ? (_jsx(RNImage, { accessibilityIgnoresInvertColors: true, testID: "userAvatarImage", style: aviStyle, resizeMode: "cover", source: {
                    uri: hackModifyThumbnailPath(avatar, size < 90),
                }, blurRadius: (moderation === null || moderation === void 0 ? void 0 : moderation.blur) ? BLUR_AMOUNT : 0, onLoad: onLoad })) : (_jsx(ExpoImage, { testID: "userAvatarImage", style: aviStyle, contentFit: "cover", source: {
                    uri: hackModifyThumbnailPath(avatar, size < 90),
                }, blurRadius: (moderation === null || moderation === void 0 ? void 0 : moderation.blur) ? BLUR_AMOUNT : 0, onLoad: onLoad })), !noBorder && _jsx(MediaInsetBorder, { style: borderStyle }), live && size > 16 && !hideLiveBadge && (_jsx(LiveIndicator, { size: size > 32 ? 'small' : 'tiny' })), alert] })) : (_jsxs(View, { style: containerStyle, children: [_jsx(DefaultAvatar, { type: type, shape: finalShape, size: size }), !noBorder && _jsx(MediaInsetBorder, { style: borderStyle }), live && size > 16 && !hideLiveBadge && (_jsx(LiveIndicator, { size: size > 32 ? 'small' : 'tiny' })), alert] }));
};
UserAvatar = memo(UserAvatar);
export { UserAvatar };
var EditableUserAvatar = function (_a) {
    var _b = _a.type, type = _b === void 0 ? 'user' : _b, size = _a.size, avatar = _a.avatar, onSelectNewAvatar = _a.onSelectNewAvatar;
    var t = useTheme();
    var _ = useLingui()._;
    var requestCameraAccessIfNeeded = useCameraPermission().requestCameraAccessIfNeeded;
    var requestPhotoAccessIfNeeded = usePhotoLibraryPermission().requestPhotoAccessIfNeeded;
    var _c = useState(), rawImage = _c[0], setRawImage = _c[1];
    var editImageDialogControl = useDialogControl();
    var sheetWrapper = useSheetWrapper();
    var circular = type !== 'algo' && type !== 'list';
    var aviStyle = useMemo(function () {
        if (!circular) {
            return {
                width: size,
                height: size,
                borderRadius: size > 32 ? 8 : 3,
            };
        }
        return {
            width: size,
            height: size,
            borderRadius: Math.floor(size / 2),
        };
    }, [circular, size]);
    var onOpenCamera = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, requestCameraAccessIfNeeded()];
                case 1:
                    if (!(_c.sent())) {
                        return [2 /*return*/];
                    }
                    _a = onSelectNewAvatar;
                    _b = compressIfNeeded;
                    return [4 /*yield*/, openCamera({
                            aspect: [1, 1],
                        })];
                case 2: return [4 /*yield*/, _b.apply(void 0, [_c.sent()])];
                case 3:
                    _a.apply(void 0, [_c.sent()]);
                    return [2 /*return*/];
            }
        });
    }); }, [onSelectNewAvatar, requestCameraAccessIfNeeded]);
    var onOpenLibrary = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var items, item, _a, _b, _c, e_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, requestPhotoAccessIfNeeded()];
                case 1:
                    if (!(_d.sent())) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, sheetWrapper(openPicker({
                            aspect: [1, 1],
                        }))];
                case 2:
                    items = _d.sent();
                    item = items[0];
                    if (!item) {
                        return [2 /*return*/];
                    }
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 9, , 10]);
                    if (!IS_NATIVE) return [3 /*break*/, 6];
                    _a = onSelectNewAvatar;
                    _b = compressIfNeeded;
                    return [4 /*yield*/, openCropper({
                            imageUri: item.path,
                            shape: circular ? 'circle' : 'rectangle',
                            aspectRatio: 1,
                        })];
                case 4: return [4 /*yield*/, _b.apply(void 0, [_d.sent()])];
                case 5:
                    _a.apply(void 0, [_d.sent()]);
                    return [3 /*break*/, 8];
                case 6:
                    _c = setRawImage;
                    return [4 /*yield*/, createComposerImage(item)];
                case 7:
                    _c.apply(void 0, [_d.sent()]);
                    editImageDialogControl.open();
                    _d.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    e_1 = _d.sent();
                    // Don't log errors for cancelling selection to sentry on ios or android
                    if (!isCancelledError(e_1)) {
                        logger.error('Failed to crop avatar', { error: e_1 });
                    }
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); }, [
        onSelectNewAvatar,
        requestPhotoAccessIfNeeded,
        sheetWrapper,
        editImageDialogControl,
        circular,
    ]);
    var onRemoveAvatar = useCallback(function () {
        onSelectNewAvatar(null);
    }, [onSelectNewAvatar]);
    var onChangeEditImage = useCallback(function (image) { return __awaiter(void 0, void 0, void 0, function () {
        var compressed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, compressImage(image)];
                case 1:
                    compressed = _a.sent();
                    onSelectNewAvatar(compressed);
                    return [2 /*return*/];
            }
        });
    }); }, [onSelectNewAvatar]);
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Edit avatar"], ["Edit avatar"])))), children: function (_a) {
                            var props = _a.props;
                            return (_jsxs(Pressable, __assign({}, props, { testID: "changeAvatarBtn", children: [avatar ? (_jsx(ExpoImage, { testID: "userAvatarImage", style: aviStyle, source: { uri: avatar }, accessibilityRole: "image" })) : (_jsx(DefaultAvatar, { type: type, size: size })), _jsx(View, { style: [
                                            styles.editButtonContainer,
                                            t.atoms.bg_contrast_25,
                                            a.border,
                                            t.atoms.border_contrast_low,
                                        ], children: _jsx(CameraFilledIcon, { height: 14, width: 14, style: t.atoms.text }) })] })));
                        } }), _jsxs(Menu.Outer, { showCancel: true, children: [_jsxs(Menu.Group, { children: [IS_NATIVE && (_jsxs(Menu.Item, { testID: "changeAvatarCameraBtn", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Upload from Camera"], ["Upload from Camera"])))), onPress: onOpenCamera, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Upload from Camera" }) }), _jsx(Menu.ItemIcon, { icon: CameraIcon })] })), _jsxs(Menu.Item, { testID: "changeAvatarLibraryBtn", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Upload from Library"], ["Upload from Library"])))), onPress: onOpenLibrary, children: [_jsx(Menu.ItemText, { children: IS_NATIVE ? (_jsx(Trans, { children: "Upload from Library" })) : (_jsx(Trans, { children: "Upload from Files" })) }), _jsx(Menu.ItemIcon, { icon: LibraryIcon })] })] }), !!avatar && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsx(Menu.Group, { children: _jsxs(Menu.Item, { testID: "changeAvatarRemoveBtn", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Remove Avatar"], ["Remove Avatar"])))), onPress: onRemoveAvatar, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Remove Avatar" }) }), _jsx(Menu.ItemIcon, { icon: TrashIcon })] }) })] }))] })] }), _jsx(EditImageDialog, { control: editImageDialogControl, image: rawImage, onChange: onChangeEditImage, aspectRatio: 1, circularCrop: circular })] }));
};
EditableUserAvatar = memo(EditableUserAvatar);
export { EditableUserAvatar };
var PreviewableUserAvatar = function (_a) {
    var _b;
    var moderation = _a.moderation, profile = _a.profile, disableHoverCard = _a.disableHoverCard, disableNavigation = _a.disableNavigation, onBeforePress = _a.onBeforePress, live = _a.live, props = __rest(_a, ["moderation", "profile", "disableHoverCard", "disableNavigation", "onBeforePress", "live"]);
    var ax = useAnalytics();
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var status = useActorStatus(profile);
    var liveControl = useDialogControl();
    var playHaptic = useHaptics();
    var onPress = useCallback(function () {
        onBeforePress === null || onBeforePress === void 0 ? void 0 : onBeforePress();
        unstableCacheProfileView(queryClient, profile);
    }, [profile, queryClient, onBeforePress]);
    var onOpenLiveStatus = useCallback(function () {
        playHaptic('Light');
        ax.metric('live:card:open', { subject: profile.did, from: 'post' });
        liveControl.open();
    }, [liveControl, playHaptic, profile.did]);
    var avatarEl = (_jsx(UserAvatar, __assign({ avatar: profile.avatar, moderation: moderation, type: ((_b = profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', live: status.isActive || live }, props)));
    var linkStyle = props.type !== 'algo' && props.type !== 'list'
        ? a.rounded_full
        : { borderRadius: props.size > 32 ? 8 : 3 };
    return (_jsx(ProfileHoverCard, { did: profile.did, disable: disableHoverCard, children: disableNavigation ? (avatarEl) : status.isActive && (IS_NATIVE || IS_WEB_TOUCH_DEVICE) ? (_jsxs(_Fragment, { children: [_jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", "'s avatar"], ["", "'s avatar"])), sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle)))), accessibilityHint: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Opens live status dialog"], ["Opens live status dialog"])))), onPress: onOpenLiveStatus, children: avatarEl }), _jsx(LiveStatusDialog, { control: liveControl, profile: profile, status: status, embed: status.embed })] })) : (_jsx(Link, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", "'s avatar"], ["", "'s avatar"])), sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle)))), accessibilityHint: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Opens this profile"], ["Opens this profile"])))), to: makeProfileLink({
                did: profile.did,
                handle: profile.handle,
            }), onPress: onPress, style: linkStyle, children: avatarEl })) }));
};
PreviewableUserAvatar = memo(PreviewableUserAvatar);
export { PreviewableUserAvatar };
// HACK
// We have started serving smaller avis but haven't updated lexicons to give the data properly
// manually string-replace to use the smaller ones
// -prf
function hackModifyThumbnailPath(uri, isEnabled) {
    return isEnabled
        ? uri.replace('/img/avatar/plain/', '/img/avatar_thumbnail/plain/')
        : uri;
}
var styles = StyleSheet.create({
    editButtonContainer: {
        position: 'absolute',
        width: 24,
        height: 24,
        bottom: 0,
        right: 0,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
