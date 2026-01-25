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
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { msg, plural } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { VIDEO_MAX_DURATION_MS, VIDEO_MAX_SIZE } from '#/lib/constants';
import { usePhotoLibraryPermission, useVideoLibraryPermission, } from '#/lib/hooks/usePermissions';
import { openUnifiedPicker } from '#/lib/media/picker';
import { extractDataUriMime } from '#/lib/media/util';
import { MAX_IMAGES } from '#/view/com/composer/state/composer';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { useSheetWrapper } from '#/components/Dialog/sheet-wrapper';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import * as toast from '#/components/Toast';
import { IS_NATIVE, IS_WEB } from '#/env';
/**
 * Codes for known validation states
 */
var SelectedAssetError;
(function (SelectedAssetError) {
    SelectedAssetError["Unsupported"] = "Unsupported";
    SelectedAssetError["MixedTypes"] = "MixedTypes";
    SelectedAssetError["MaxImages"] = "MaxImages";
    SelectedAssetError["MaxVideos"] = "MaxVideos";
    SelectedAssetError["VideoTooLong"] = "VideoTooLong";
    SelectedAssetError["FileTooBig"] = "FileTooBig";
    SelectedAssetError["MaxGIFs"] = "MaxGIFs";
})(SelectedAssetError || (SelectedAssetError = {}));
/**
 * Supported video mime types. This differs slightly from
 * `SUPPORTED_MIME_TYPES` from `#/lib/constants` because we only care about
 * videos here.
 */
var SUPPORTED_VIDEO_MIME_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/quicktime',
];
function isSupportedVideoMimeType(mimeType) {
    return SUPPORTED_VIDEO_MIME_TYPES.includes(mimeType);
}
/**
 * Supported image mime types.
 */
var SUPPORTED_IMAGE_MIME_TYPES = [
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    'image/avif',
    IS_NATIVE && 'image/heic',
].filter(Boolean);
function isSupportedImageMimeType(mimeType) {
    return SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType);
}
/**
 * This is a last-ditch effort type thing here, try not to rely on this.
 */
var extensionToMimeType = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    webp: 'image/webp',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    heic: 'image/heic',
};
/**
 * Attempts to bucket the given asset into one of our known types based on its
 * `mimeType`. If `mimeType` is not available, we try to infer it through
 * various means.
 */
function classifyImagePickerAsset(asset) {
    var _a;
    /*
     * Try to use the `mimeType` reported by `expo-image-picker` first.
     */
    var mimeType = asset.mimeType;
    if (!mimeType) {
        /*
         * We can try to infer this from the data-uri.
         */
        var maybeMimeType = extractDataUriMime(asset.uri);
        if (maybeMimeType.startsWith('image/') ||
            maybeMimeType.startsWith('video/')) {
            mimeType = maybeMimeType;
        }
        else if (maybeMimeType.startsWith('file/')) {
            /*
             * On the off-chance we get a `file/*` mime, try to infer from the
             * extension.
             */
            var extension = (_a = asset.uri.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            mimeType = extensionToMimeType[extension || ''];
        }
    }
    if (!mimeType) {
        return {
            success: false,
            type: undefined,
            mimeType: undefined,
        };
    }
    /*
     * Distill this down into a type "class".
     */
    var type;
    if (mimeType === 'image/gif') {
        type = 'gif';
    }
    else if (mimeType === null || mimeType === void 0 ? void 0 : mimeType.startsWith('video/')) {
        type = 'video';
    }
    else if (mimeType === null || mimeType === void 0 ? void 0 : mimeType.startsWith('image/')) {
        type = 'image';
    }
    /*
     * If we weren't able to find a valid type, we don't support this asset.
     */
    if (!type) {
        return {
            success: false,
            type: undefined,
            mimeType: undefined,
        };
    }
    return {
        success: true,
        type: type,
        mimeType: mimeType,
    };
}
/**
 * Takes in raw assets from `expo-image-picker` and applies validation. Returns
 * the dominant `AssetType`, any valid assets, and any errors encountered along
 * the way.
 */
function processImagePickerAssets(assets_1, _a) {
    return __awaiter(this, arguments, void 0, function (assets, _b) {
        var errors, selectableAssetType, supportedAssets, _i, assets_2, asset, _c, success, type, mimeType;
        var selectionCountRemaining = _b.selectionCountRemaining, allowedAssetTypes = _b.allowedAssetTypes;
        return __generator(this, function (_d) {
            errors = new Set();
            supportedAssets = [];
            for (_i = 0, assets_2 = assets; _i < assets_2.length; _i++) {
                asset = assets_2[_i];
                _c = classifyImagePickerAsset(asset), success = _c.success, type = _c.type, mimeType = _c.mimeType;
                if (!success) {
                    errors.add(SelectedAssetError.Unsupported);
                    continue;
                }
                /*
                 * If we have an `allowedAssetTypes` prop, constrain to that. Otherwise,
                 * set this to the first valid asset type we see, and then use that to
                 * constrain all remaining selected assets.
                 */
                selectableAssetType = allowedAssetTypes || selectableAssetType || type;
                // ignore mixed types
                if (type !== selectableAssetType) {
                    errors.add(SelectedAssetError.MixedTypes);
                    continue;
                }
                if (type === 'video') {
                    /**
                     * We don't care too much about mimeType at this point on native,
                     * since the `processVideo` step later on will convert to `.mp4`.
                     */
                    if (IS_WEB && !isSupportedVideoMimeType(mimeType)) {
                        errors.add(SelectedAssetError.Unsupported);
                        continue;
                    }
                    /*
                     * Filesize appears to be stable across all platforms, so we can use it
                     * to filter out large files on web. On native, we compress these anyway,
                     * so we only check on web.
                     */
                    if (IS_WEB && asset.fileSize && asset.fileSize > VIDEO_MAX_SIZE) {
                        errors.add(SelectedAssetError.FileTooBig);
                        continue;
                    }
                }
                if (type === 'image') {
                    if (!isSupportedImageMimeType(mimeType)) {
                        errors.add(SelectedAssetError.Unsupported);
                        continue;
                    }
                }
                if (type === 'gif') {
                    /*
                     * Filesize appears to be stable across all platforms, so we can use it
                     * to filter out large files on web. On native, we compress GIFs as
                     * videos anyway, so we only check on web.
                     */
                    if (IS_WEB && asset.fileSize && asset.fileSize > VIDEO_MAX_SIZE) {
                        errors.add(SelectedAssetError.FileTooBig);
                        continue;
                    }
                }
                /*
                 * All validations passed, we have an asset!
                 */
                supportedAssets.push(__assign(__assign({ mimeType: mimeType }, asset), { 
                    /*
                     * In `expo-image-picker` >= v17, `uri` is now a `blob:` URL, not a
                     * data-uri. Our handling elsewhere in the app (for web) relies on the
                     * base64 data-uri, so we construct it here for web only.
                     */
                    uri: IS_WEB && asset.base64
                        ? "data:".concat(mimeType, ";base64,").concat(asset.base64)
                        : asset.uri }));
            }
            if (supportedAssets.length > 0) {
                if (selectableAssetType === 'image') {
                    if (supportedAssets.length > selectionCountRemaining) {
                        errors.add(SelectedAssetError.MaxImages);
                        supportedAssets = supportedAssets.slice(0, selectionCountRemaining);
                    }
                }
                else if (selectableAssetType === 'video') {
                    if (supportedAssets.length > 1) {
                        errors.add(SelectedAssetError.MaxVideos);
                        supportedAssets = supportedAssets.slice(0, 1);
                    }
                    if (supportedAssets[0].duration) {
                        if (IS_WEB) {
                            /*
                             * Web reports duration as seconds
                             */
                            supportedAssets[0].duration = supportedAssets[0].duration * 1000;
                        }
                        if (supportedAssets[0].duration > VIDEO_MAX_DURATION_MS) {
                            errors.add(SelectedAssetError.VideoTooLong);
                            supportedAssets = [];
                        }
                    }
                    else {
                        errors.add(SelectedAssetError.Unsupported);
                        supportedAssets = [];
                    }
                }
                else if (selectableAssetType === 'gif') {
                    if (supportedAssets.length > 1) {
                        errors.add(SelectedAssetError.MaxGIFs);
                        supportedAssets = supportedAssets.slice(0, 1);
                    }
                }
            }
            return [2 /*return*/, {
                    type: selectableAssetType, // set above
                    assets: supportedAssets,
                    errors: errors,
                }];
        });
    });
}
export function SelectMediaButton(_a) {
    var _this = this;
    var disabled = _a.disabled, allowedAssetTypes = _a.allowedAssetTypes, selectedAssetsCount = _a.selectedAssetsCount, onSelectAssets = _a.onSelectAssets, autoOpen = _a.autoOpen;
    var _ = useLingui()._;
    var requestPhotoAccessIfNeeded = usePhotoLibraryPermission().requestPhotoAccessIfNeeded;
    var requestVideoAccessIfNeeded = useVideoLibraryPermission().requestVideoAccessIfNeeded;
    var sheetWrapper = useSheetWrapper();
    var t = useTheme();
    var hasAutoOpened = useRef(false);
    var selectionCountRemaining = MAX_IMAGES - selectedAssetsCount;
    var processSelectedAssets = useCallback(function (rawAssets) { return __awaiter(_this, void 0, void 0, function () {
        var _a, type, assets, errorCodes, errors;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, processImagePickerAssets(rawAssets, {
                        selectionCountRemaining: selectionCountRemaining,
                        allowedAssetTypes: allowedAssetTypes,
                    })
                    /*
                     * Convert error codes to user-friendly messages.
                     */
                ];
                case 1:
                    _a = _b.sent(), type = _a.type, assets = _a.assets, errorCodes = _a.errors;
                    errors = Array.from(errorCodes).map(function (error) {
                        var _a;
                        return (_a = {},
                            _a[SelectedAssetError.Unsupported] = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["One or more of your selected files are not supported."], ["One or more of your selected files are not supported."])))),
                            _a[SelectedAssetError.MixedTypes] = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Selecting multiple media types is not supported."], ["Selecting multiple media types is not supported."])))),
                            _a[SelectedAssetError.MaxImages] = _(msg({
                                message: "You can select up to ".concat(plural(MAX_IMAGES, {
                                    other: '# images',
                                }), " in total."),
                                comment: "Error message for maximum number of images that can be selected to add to a post, currently 4 but may change.",
                            })),
                            _a[SelectedAssetError.MaxVideos] = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You can only select one video at a time."], ["You can only select one video at a time."])))),
                            _a[SelectedAssetError.VideoTooLong] = _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Videos must be less than 3 minutes long."], ["Videos must be less than 3 minutes long."])))),
                            _a[SelectedAssetError.MaxGIFs] = _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["You can only select one GIF at a time."], ["You can only select one GIF at a time."])))),
                            _a[SelectedAssetError.FileTooBig] = _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["One or more of your selected files are too large. Maximum size is 100\u00A0MB."], ["One or more of your selected files are too large. Maximum size is 100\u00A0MB."])))),
                            _a)[error];
                    });
                    /*
                     * Report the selected assets and any errors back to the
                     * composer.
                     */
                    onSelectAssets({
                        type: type,
                        assets: assets,
                        errors: errors,
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [_, onSelectAssets, selectionCountRemaining, allowedAssetTypes]);
    var onPressSelectMedia = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, photoAccess, videoAccess, _b, assets, canceled;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!IS_NATIVE) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.all([
                            requestPhotoAccessIfNeeded(),
                            requestVideoAccessIfNeeded(),
                        ])];
                case 1:
                    _a = _c.sent(), photoAccess = _a[0], videoAccess = _a[1];
                    if (!photoAccess && !videoAccess) {
                        toast.show(_(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["You need to allow access to your media library."], ["You need to allow access to your media library."])))), {
                            type: 'error',
                        });
                        return [2 /*return*/];
                    }
                    _c.label = 2;
                case 2:
                    if (IS_NATIVE && Keyboard.isVisible()) {
                        Keyboard.dismiss();
                    }
                    return [4 /*yield*/, sheetWrapper(openUnifiedPicker({ selectionCountRemaining: selectionCountRemaining }))];
                case 3:
                    _b = _c.sent(), assets = _b.assets, canceled = _b.canceled;
                    if (canceled)
                        return [2 /*return*/];
                    return [4 /*yield*/, processSelectedAssets(assets)];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [
        _,
        requestPhotoAccessIfNeeded,
        requestVideoAccessIfNeeded,
        sheetWrapper,
        processSelectedAssets,
        selectionCountRemaining,
    ]);
    useEffect(function () {
        if (autoOpen && !hasAutoOpened.current && !disabled) {
            hasAutoOpened.current = true;
            onPressSelectMedia();
        }
    }, [autoOpen, disabled, onPressSelectMedia]);
    return (_jsx(Button, { testID: "openMediaBtn", onPress: onPressSelectMedia, label: _(msg({
            message: "Add media to post",
            comment: "Accessibility label for button in composer to add images, a video, or a GIF to a post",
        })), accessibilityHint: _(msg({
            message: "Opens device gallery to select up to ".concat(plural(MAX_IMAGES, {
                other: '# images',
            }), ", or a single video or GIF."),
            comment: "Accessibility hint for button in composer to add images, a video, or a GIF to a post. Maximum number of images that can be selected is currently 4 but may change.",
        })), style: a.p_sm, variant: "ghost", shape: "round", color: "primary", disabled: disabled, children: _jsx(ImageIcon, { size: "lg", style: disabled && t.atoms.text_contrast_low, accessibilityIgnoresInvertColors: true }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
