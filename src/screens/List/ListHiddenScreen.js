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
import React from 'react';
import { View } from 'react-native';
import { AppBskyGraphDefs } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { useGoBack } from '#/lib/hooks/useGoBack';
import { sanitizeHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { RQKEY_ROOT as listQueryRoot, useListBlockMutation, useListMuteMutation, } from '#/state/queries/list';
import { useRemoveFeedMutation, } from '#/state/queries/preferences';
import { useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { CenteredView } from '#/view/com/util/Views';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { Loader } from '#/components/Loader';
import { useHider } from '#/components/moderation/Hider';
import { Text } from '#/components/Typography';
export function ListHiddenScreen(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g;
    var list = _a.list, preferences = _a.preferences;
    var _ = useLingui()._;
    var t = useTheme();
    var currentAccount = useSession().currentAccount;
    var gtMobile = useBreakpoints().gtMobile;
    var isOwner = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === list.creator.did;
    var goBack = useGoBack();
    var queryClient = useQueryClient();
    var isModList = list.purpose === AppBskyGraphDefs.MODLIST;
    var _h = React.useState(false), isProcessing = _h[0], setIsProcessing = _h[1];
    var listBlockMutation = useListBlockMutation();
    var listMuteMutation = useListMuteMutation();
    var removeSavedFeed = useRemoveFeedMutation().mutateAsync;
    var setIsContentVisible = useHider().setIsContentVisible;
    var savedFeedConfig = preferences.savedFeeds.find(function (f) { return f.value === list.uri; });
    var onUnsubscribe = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1, e_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setIsProcessing(true);
                    if (!((_a = list.viewer) === null || _a === void 0 ? void 0 : _a.muted)) return [3 /*break*/, 4];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, listMuteMutation.mutateAsync({ uri: list.uri, mute: false })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _c.sent();
                    setIsProcessing(false);
                    logger.error('Failed to unmute list', { message: e_1 });
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))));
                    return [2 /*return*/];
                case 4:
                    if (!((_b = list.viewer) === null || _b === void 0 ? void 0 : _b.blocked)) return [3 /*break*/, 8];
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, listBlockMutation.mutateAsync({ uri: list.uri, block: false })];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 8];
                case 7:
                    e_2 = _c.sent();
                    setIsProcessing(false);
                    logger.error('Failed to unblock list', { message: e_2 });
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))));
                    return [2 /*return*/];
                case 8:
                    queryClient.invalidateQueries({
                        queryKey: [listQueryRoot],
                    });
                    Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Unsubscribed from list"], ["Unsubscribed from list"])))));
                    setIsProcessing(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var onRemoveList = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!savedFeedConfig)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, removeSavedFeed(savedFeedConfig)];
                case 2:
                    _a.sent();
                    Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Removed from saved feeds"], ["Removed from saved feeds"])))));
                    return [3 /*break*/, 5];
                case 3:
                    e_3 = _a.sent();
                    logger.error('Failed to remove list from saved feeds', { message: e_3 });
                    Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))));
                    return [3 /*break*/, 5];
                case 4:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(CenteredView, { style: [
            a.flex_1,
            a.align_center,
            a.gap_5xl,
            !gtMobile && a.justify_between,
            t.atoms.border_contrast_low,
            { paddingTop: 175, paddingBottom: 110 },
        ], sideBorders: true, children: [_jsxs(View, { style: [a.w_full, a.align_center, a.gap_lg], children: [_jsx(EyeSlash, { style: { color: t.atoms.text_contrast_medium.color }, height: 42, width: 42 }), _jsxs(View, { style: [a.gap_sm, a.align_center], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_3xl], children: ((_b = list.creator.viewer) === null || _b === void 0 ? void 0 : _b.blocking) || ((_c = list.creator.viewer) === null || _c === void 0 ? void 0 : _c.blockedBy) ? (_jsx(Trans, { children: "Creator has been blocked" })) : (_jsx(Trans, { children: "List has been hidden" })) }), _jsx(Text, { style: [
                                    a.text_md,
                                    a.text_center,
                                    a.px_md,
                                    t.atoms.text_contrast_high,
                                    { lineHeight: 1.4 },
                                ], children: ((_d = list.creator.viewer) === null || _d === void 0 ? void 0 : _d.blocking) || ((_e = list.creator.viewer) === null || _e === void 0 ? void 0 : _e.blockedBy) ? (_jsx(Trans, { children: "Either the creator of this list has blocked you or you have blocked the creator." })) : isOwner ? (_jsx(Trans, { children: "This list \u2013 created by you \u2013 contains possible violations of Bluesky's community guidelines in its name or description." })) : (_jsxs(Trans, { children: ["This list \u2013 created by", ' ', _jsx(Text, { style: [a.font_semi_bold], children: sanitizeHandle(list.creator.handle, '@') }), ' ', "\u2013 contains possible violations of Bluesky's community guidelines in its name or description."] })) })] })] }), _jsxs(View, { style: [a.gap_md, gtMobile ? { width: 350 } : [a.w_full, a.px_lg]], children: [_jsxs(View, { style: [a.gap_md], children: [savedFeedConfig ? (_jsxs(Button, { variant: "solid", color: "secondary", size: "large", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Remove from saved feeds"], ["Remove from saved feeds"])))), onPress: onRemoveList, disabled: isProcessing, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Remove from saved feeds" }) }), isProcessing ? (_jsx(ButtonIcon, { icon: Loader, position: "right" })) : null] })) : null, isOwner ? (_jsx(Button, { variant: "solid", color: "secondary", size: "large", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Show list anyway"], ["Show list anyway"])))), onPress: function () { return setIsContentVisible(true); }, disabled: isProcessing, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Show anyway" }) }) })) : ((_f = list.viewer) === null || _f === void 0 ? void 0 : _f.muted) || ((_g = list.viewer) === null || _g === void 0 ? void 0 : _g.blocked) ? (_jsxs(Button, { variant: "solid", color: "secondary", size: "large", label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Unsubscribe from list"], ["Unsubscribe from list"])))), onPress: function () {
                                    if (isModList) {
                                        onUnsubscribe();
                                    }
                                    else {
                                        onRemoveList();
                                    }
                                }, disabled: isProcessing, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Unsubscribe from list" }) }), isProcessing ? (_jsx(ButtonIcon, { icon: Loader, position: "right" })) : null] })) : null] }), _jsx(Button, { variant: "solid", color: "primary", label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Return to previous page"], ["Return to previous page"])))), onPress: goBack, size: "large", disabled: isProcessing, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Go Back" }) }) })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
