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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Suspense, useRef, useState } from 'react';
import { View } from 'react-native';
import { requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { createAssetAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { AppBskyGraphStarterpack } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { logger } from '#/logger';
import { atoms as a, useBreakpoints } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ShareIcon } from '#/components/icons/ArrowOutOfBox';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { FloppyDisk_Stroke2_Corner0_Rounded as FloppyDiskIcon } from '#/components/icons/FloppyDisk';
import { Loader } from '#/components/Loader';
import { QrCode } from '#/components/StarterPack/QrCode';
import * as Toast from '#/components/Toast';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE, IS_WEB } from '#/env';
import * as bsky from '#/types/bsky';
export function QrCodeDialog(_a) {
    var _this = this;
    var starterPack = _a.starterPack, link = _a.link, control = _a.control;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var gtMobile = useBreakpoints().gtMobile;
    var _b = useState(false), isSaveProcessing = _b[0], setIsSaveProcessing = _b[1];
    var _c = useState(false), isCopyProcessing = _c[0], setIsCopyProcessing = _c[1];
    var ref = useRef(null);
    var getCanvas = function (base64) {
        return new Promise(function (resolve) {
            var image = new Image();
            image.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                var ctx = canvas.getContext('2d');
                ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(image, 0, 0);
                resolve(canvas);
            };
            image.src = base64;
        });
    };
    var onSavePress = function () { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            (_b = (_a = ref.current) === null || _a === void 0 ? void 0 : _a.capture) === null || _b === void 0 ? void 0 : _b.call(_a).then(function (uri) { return __awaiter(_this, void 0, void 0, function () {
                var res, e_1, canvas, imgHref, link_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!IS_NATIVE) return [3 /*break*/, 6];
                            return [4 /*yield*/, requestMediaLibraryPermissionsAsync()];
                        case 1:
                            res = _a.sent();
                            if (!res.granted) {
                                Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You must grant access to your photo library to save a QR code"], ["You must grant access to your photo library to save a QR code"])))));
                                return [2 /*return*/];
                            }
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, createAssetAsync("file://".concat(uri))];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _a.sent();
                            Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["An error occurred while saving the QR code!"], ["An error occurred while saving the QR code!"])))), {
                                type: 'error',
                            });
                            logger.error('Failed to save QR code', { error: e_1 });
                            return [2 /*return*/];
                        case 5: return [3 /*break*/, 8];
                        case 6:
                            setIsSaveProcessing(true);
                            if (!bsky.validate(starterPack.record, AppBskyGraphStarterpack.validateRecord)) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, getCanvas(uri)];
                        case 7:
                            canvas = _a.sent();
                            imgHref = canvas
                                .toDataURL('image/png')
                                .replace('image/png', 'image/octet-stream');
                            link_1 = document.createElement('a');
                            link_1.setAttribute('download', "".concat(starterPack.record.name.replaceAll(' ', '_'), "_Share_Card.png"));
                            link_1.setAttribute('href', imgHref);
                            link_1.click();
                            _a.label = 8;
                        case 8:
                            ax.metric('starterPack:share', {
                                starterPack: starterPack.uri,
                                shareType: 'qrcode',
                                qrShareType: 'save',
                            });
                            setIsSaveProcessing(false);
                            Toast.show(IS_WEB
                                ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["QR code has been downloaded!"], ["QR code has been downloaded!"]))))
                                : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["QR code saved to your camera roll!"], ["QR code saved to your camera roll!"])))));
                            control.close();
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); };
    var onCopyPress = function () { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            setIsCopyProcessing(true);
            (_b = (_a = ref.current) === null || _a === void 0 ? void 0 : _a.capture) === null || _b === void 0 ? void 0 : _b.call(_a).then(function (uri) { return __awaiter(_this, void 0, void 0, function () {
                var canvas;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, getCanvas(uri)
                            // @ts-expect-error web only
                        ];
                        case 1:
                            canvas = _a.sent();
                            // @ts-expect-error web only
                            canvas.toBlob(function (blob) {
                                var item = new ClipboardItem({ 'image/png': blob });
                                navigator.clipboard.write([item]);
                            });
                            ax.metric('starterPack:share', {
                                starterPack: starterPack.uri,
                                shareType: 'qrcode',
                                qrShareType: 'copy',
                            });
                            Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["QR code copied to your clipboard!"], ["QR code copied to your clipboard!"])))));
                            setIsCopyProcessing(false);
                            control.close();
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); };
    var onSharePress = function () { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            (_b = (_a = ref.current) === null || _a === void 0 ? void 0 : _a.capture) === null || _b === void 0 ? void 0 : _b.call(_a).then(function (uri) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    control.close(function () {
                        Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'image/png' }).then(function () {
                            ax.metric('starterPack:share', {
                                starterPack: starterPack.uri,
                                shareType: 'qrcode',
                                qrShareType: 'share',
                            });
                        });
                    });
                    return [2 /*return*/];
                });
            }); });
            return [2 /*return*/];
        });
    }); };
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Create a QR code for a starter pack"], ["Create a QR code for a starter pack"])))), children: [_jsx(View, { style: [a.flex_1, a.align_center, a.gap_5xl], children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: !link ? (_jsx(Loading, {})) : (_jsxs(_Fragment, { children: [_jsx(QrCode, { starterPack: starterPack, link: link, ref: ref }), _jsxs(View, { style: [
                                            a.w_full,
                                            a.gap_md,
                                            gtMobile && [a.flex_row, a.justify_center, a.flex_wrap],
                                        ], children: [_jsxs(Button, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Copy QR code"], ["Copy QR code"])))), color: "primary_subtle", size: "large", onPress: IS_WEB ? onCopyPress : onSharePress, children: [_jsx(ButtonIcon, { icon: isCopyProcessing
                                                            ? Loader
                                                            : IS_WEB
                                                                ? ChainLinkIcon
                                                                : ShareIcon }), _jsx(ButtonText, { children: IS_WEB ? _jsx(Trans, { children: "Copy" }) : _jsx(Trans, { children: "Share" }) })] }), _jsxs(Button, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Save QR code"], ["Save QR code"])))), color: "secondary", size: "large", onPress: onSavePress, children: [_jsx(ButtonIcon, { icon: isSaveProcessing ? Loader : FloppyDiskIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Save" }) })] })] })] })) }) }), _jsx(Dialog.Close, {})] })] }));
}
function Loading() {
    return (_jsx(View, { style: [a.align_center, a.justify_center, { minHeight: 400 }], children: _jsx(Loader, { size: "xl" }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
