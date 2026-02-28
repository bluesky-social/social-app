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
import { View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useSaveImageToMediaLibrary } from '#/lib/media/save-image';
import { shareUrl } from '#/lib/sharing';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import { QrCode_Stroke2_Corner0_Rounded as QrCodeIcon } from '#/components/icons/QrCode';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE, IS_WEB } from '#/env';
export function ShareDialog(props) {
    return (_jsxs(Dialog.Outer, { control: props.control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(ShareDialogInner, __assign({}, props))] }));
}
function ShareDialogInner(_a) {
    var _this = this;
    var starterPack = _a.starterPack, link = _a.link, imageLoaded = _a.imageLoaded, qrDialogControl = _a.qrDialogControl, control = _a.control;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var imageUrl = getStarterPackOgCard(starterPack);
    var onShareLink = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!link)
                return [2 /*return*/];
            shareUrl(link);
            ax.metric('starterPack:share', {
                starterPack: starterPack.uri,
                shareType: 'link',
            });
            control.close();
            return [2 /*return*/];
        });
    }); };
    var saveImageToAlbum = useSaveImageToMediaLibrary();
    var onSave = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, saveImageToAlbum(imageUrl)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsx(_Fragment, { children: _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Share link dialog"], ["Share link dialog"])))), children: [!imageLoaded || !link ? (_jsx(View, { style: [a.align_center, a.justify_center, { minHeight: 350 }], children: _jsx(Loader, { size: "xl" }) })) : (_jsxs(View, { style: [!gtMobile && a.gap_lg], children: [_jsxs(View, { style: [a.gap_sm, gtMobile && a.pb_lg], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_2xl], children: _jsx(Trans, { children: "Invite people to this starter pack!" }) }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Share this starter pack and help people join your community on Bluesky." }) })] }), _jsx(Image, { source: { uri: imageUrl }, style: [
                                a.rounded_sm,
                                a.aspect_card,
                                {
                                    transform: [{ scale: gtMobile ? 0.85 : 1 }],
                                    marginTop: gtMobile ? -20 : 0,
                                },
                            ], accessibilityIgnoresInvertColors: true }), _jsxs(View, { style: [
                                a.gap_md,
                                gtMobile && [
                                    a.gap_sm,
                                    a.justify_center,
                                    a.flex_row,
                                    a.flex_wrap,
                                ],
                            ], children: [_jsxs(Button, { label: IS_WEB ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Copy link"], ["Copy link"])))) : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Share link"], ["Share link"])))), color: "primary_subtle", size: "large", onPress: onShareLink, children: [_jsx(ButtonIcon, { icon: ChainLinkIcon }), _jsx(ButtonText, { children: IS_WEB ? (_jsx(Trans, { children: "Copy Link" })) : (_jsx(Trans, { children: "Share link" })) })] }), _jsxs(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Share QR code"], ["Share QR code"])))), color: "primary_subtle", size: "large", onPress: function () {
                                        control.close(function () {
                                            qrDialogControl.open();
                                        });
                                    }, children: [_jsx(ButtonIcon, { icon: QrCodeIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Share QR code" }) })] }), IS_NATIVE && (_jsxs(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Save image"], ["Save image"])))), color: "secondary", size: "large", onPress: onSave, children: [_jsx(ButtonIcon, { icon: DownloadIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Save image" }) })] }))] })] })), _jsx(Dialog.Close, {})] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
