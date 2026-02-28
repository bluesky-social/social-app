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
import React from 'react';
import { View } from 'react-native';
import { AtUri } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { useHaptics } from '#/lib/haptics';
import { makeCustomFeedLink, makeProfileLink } from '#/lib/routes/links';
import { shareUrl } from '#/lib/sharing';
import { sanitizeHandle } from '#/lib/strings/handles';
import { toShareUrl } from '#/lib/strings/url-helpers';
import { logger } from '#/logger';
import { useLikeMutation, useUnlikeMutation } from '#/state/queries/like';
import { useAddSavedFeedsMutation, usePreferencesQuery, useRemoveFeedMutation, useUpdateSavedFeedsMutation, } from '#/state/queries/preferences';
import { useSession } from '#/state/session';
import { formatCount } from '#/view/com/util/numeric/format';
import * as Toast from '#/view/com/util/Toast';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Divider } from '#/components/Divider';
import { useRichText } from '#/components/hooks/useRichText';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share } from '#/components/icons/ArrowOutOfBox';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { DotGrid3x1_Stroke2_Corner0_Rounded as Ellipsis } from '#/components/icons/DotGrid';
import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled, Heart2_Stroke2_Corner0_Rounded as Heart, } from '#/components/icons/Heart2';
import { Pin_Filled_Corner0_Rounded as PinFilled, Pin_Stroke2_Corner0_Rounded as Pin, } from '#/components/icons/Pin';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import * as Menu from '#/components/Menu';
import { ReportDialog, useReportDialogControl, } from '#/components/moderation/ReportDialog';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
export function ProfileFeedHeaderSkeleton() {
    var t = useTheme();
    return (_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(View, { style: [a.w_full, a.rounded_sm, t.atoms.bg_contrast_25, { height: 40 }] }) }), _jsx(Layout.Header.Slot, { children: _jsx(View, { style: [
                        a.justify_center,
                        a.align_center,
                        a.rounded_full,
                        t.atoms.bg_contrast_25,
                        {
                            height: 34,
                            width: 34,
                        },
                    ], children: _jsx(Pin, { size: "lg", fill: t.atoms.text_contrast_low.color }) }) })] }));
}
export function ProfileFeedHeader(_a) {
    var _this = this;
    var _b;
    var info = _a.info;
    var t = useTheme();
    var _c = useLingui(), _ = _c._, i18n = _c.i18n;
    var ax = useAnalytics();
    var hasSession = useSession().hasSession;
    var gtMobile = useBreakpoints().gtMobile;
    var infoControl = Dialog.useDialogControl();
    var playHaptic = useHaptics();
    var preferences = usePreferencesQuery().data;
    var _d = React.useState(info.likeUri || ''), likeUri = _d[0], setLikeUri = _d[1];
    var likeCount = (info.likeCount || 0) +
        (likeUri && !info.likeUri ? 1 : !likeUri && info.likeUri ? -1 : 0);
    var _e = useAddSavedFeedsMutation(), addSavedFeeds = _e.mutateAsync, isAddSavedFeedPending = _e.isPending;
    var _f = useRemoveFeedMutation(), removeFeed = _f.mutateAsync, isRemovePending = _f.isPending;
    var _g = useUpdateSavedFeedsMutation(), updateSavedFeeds = _g.mutateAsync, isUpdateFeedPending = _g.isPending;
    var isFeedStateChangePending = isAddSavedFeedPending || isRemovePending || isUpdateFeedPending;
    var savedFeedConfig = (_b = preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds) === null || _b === void 0 ? void 0 : _b.find(function (f) { return f.value === info.uri; });
    var isSaved = Boolean(savedFeedConfig);
    var isPinned = Boolean(savedFeedConfig === null || savedFeedConfig === void 0 ? void 0 : savedFeedConfig.pinned);
    var onToggleSaved = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    playHaptic();
                    if (!savedFeedConfig) return [3 /*break*/, 2];
                    return [4 /*yield*/, removeFeed(savedFeedConfig)];
                case 1:
                    _a.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Removed from your feeds"], ["Removed from your feeds"])))));
                    ax.metric('feed:unsave', { feedUrl: info.uri });
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, addSavedFeeds([
                        {
                            type: 'feed',
                            value: info.uri,
                            pinned: false,
                        },
                    ])];
                case 3:
                    _a.sent();
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Saved to your feeds"], ["Saved to your feeds"])))));
                    ax.metric('feed:save', { feedUrl: info.uri });
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["There was an issue updating your feeds, please check your internet connection and try again."], ["There was an issue updating your feeds, please check your internet connection and try again."])))), 'xmark');
                    logger.error('Failed to update feeds', { message: err_1 });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var onTogglePinned = function () { return __awaiter(_this, void 0, void 0, function () {
        var pinned, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    playHaptic();
                    if (!savedFeedConfig) return [3 /*break*/, 2];
                    pinned = !savedFeedConfig.pinned;
                    return [4 /*yield*/, updateSavedFeeds([
                            __assign(__assign({}, savedFeedConfig), { pinned: pinned }),
                        ])];
                case 1:
                    _a.sent();
                    if (pinned) {
                        Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Pinned ", " to Home"], ["Pinned ", " to Home"])), info.displayName)));
                        ax.metric('feed:pin', { feedUrl: info.uri });
                    }
                    else {
                        Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Unpinned ", " from Home"], ["Unpinned ", " from Home"])), info.displayName)));
                        ax.metric('feed:unpin', { feedUrl: info.uri });
                    }
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, addSavedFeeds([
                        {
                            type: 'feed',
                            value: info.uri,
                            pinned: true,
                        },
                    ])];
                case 3:
                    _a.sent();
                    Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Pinned ", " to Home"], ["Pinned ", " to Home"])), info.displayName)));
                    ax.metric('feed:pin', { feedUrl: info.uri });
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    Toast.show(_(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["There was an issue contacting the server"], ["There was an issue contacting the server"])))), 'xmark');
                    logger.error('Failed to toggle pinned feed', { message: e_1 });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(_Fragment, { children: [_jsx(Layout.Center, { style: [t.atoms.bg, a.z_10, web([a.sticky, a.z_10, { top: 0 }])], children: _jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { align: "left", children: _jsx(Button, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Open feed info screen"], ["Open feed info screen"])))), style: [
                                    a.justify_start,
                                    {
                                        paddingVertical: IS_WEB ? 2 : 4,
                                        paddingRight: 8,
                                    },
                                ], onPress: function () {
                                    playHaptic();
                                    infoControl.open();
                                }, children: function (_a) {
                                    var hovered = _a.hovered, pressed = _a.pressed;
                                    return (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                                                    a.absolute,
                                                    a.inset_0,
                                                    a.rounded_sm,
                                                    a.transition_all,
                                                    t.atoms.bg_contrast_25,
                                                    {
                                                        opacity: 0,
                                                        left: IS_WEB ? -2 : -4,
                                                        right: 0,
                                                    },
                                                    pressed && {
                                                        opacity: 1,
                                                    },
                                                    hovered && {
                                                        opacity: 1,
                                                        transform: [{ scaleX: 1.01 }, { scaleY: 1.1 }],
                                                    },
                                                ] }), _jsxs(View, { style: [a.flex_1, a.flex_row, a.align_center, a.gap_sm], children: [info.avatar && (_jsx(UserAvatar, { size: 36, type: "algo", avatar: info.avatar })), _jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { style: [
                                                                    a.text_md,
                                                                    a.font_bold,
                                                                    a.leading_snug,
                                                                    gtMobile && a.text_lg,
                                                                ], numberOfLines: 2, emoji: true, children: info.displayName }), _jsxs(View, { style: [a.flex_row, { gap: 6 }], children: [_jsx(Text, { style: [
                                                                            a.flex_shrink,
                                                                            a.text_sm,
                                                                            a.leading_snug,
                                                                            t.atoms.text_contrast_medium,
                                                                        ], numberOfLines: 1, children: sanitizeHandle(info.creatorHandle, '@') }), _jsxs(View, { style: [a.flex_row, a.align_center, { gap: 2 }], children: [_jsx(HeartFilled, { size: "xs", fill: likeUri
                                                                                    ? t.palette.pink
                                                                                    : t.atoms.text_contrast_low.color }), _jsx(Text, { style: [
                                                                                    a.text_sm,
                                                                                    a.leading_snug,
                                                                                    t.atoms.text_contrast_medium,
                                                                                ], numberOfLines: 1, children: formatCount(i18n, likeCount) })] })] })] }), _jsx(Ellipsis, { size: "md", fill: t.atoms.text_contrast_low.color })] })] }));
                                } }) }), hasSession && (_jsx(Layout.Header.Slot, { children: isPinned ? (_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Open feed options menu"], ["Open feed options menu"])))), children: function (_a) {
                                            var props = _a.props;
                                            return (_jsx(Button, __assign({}, props, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Open feed options menu"], ["Open feed options menu"])))), size: "small", variant: "ghost", shape: "square", color: "secondary", children: _jsx(PinFilled, { size: "lg", fill: t.palette.primary_500 }) })));
                                        } }), _jsxs(Menu.Outer, { children: [_jsxs(Menu.Item, { disabled: isFeedStateChangePending, label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Unpin from home"], ["Unpin from home"])))), onPress: onTogglePinned, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Unpin from home"], ["Unpin from home"])))) }), _jsx(Menu.ItemIcon, { icon: X, position: "right" })] }), _jsxs(Menu.Item, { disabled: isFeedStateChangePending, label: isSaved
                                                    ? _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Remove from my feeds"], ["Remove from my feeds"]))))
                                                    : _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Save to my feeds"], ["Save to my feeds"])))), onPress: onToggleSaved, children: [_jsx(Menu.ItemText, { children: isSaved
                                                            ? _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Remove from my feeds"], ["Remove from my feeds"]))))
                                                            : _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Save to my feeds"], ["Save to my feeds"])))) }), _jsx(Menu.ItemIcon, { icon: isSaved ? Trash : Plus, position: "right" })] })] })] })) : (_jsx(Button, { label: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Pin to Home"], ["Pin to Home"])))), size: "small", variant: "ghost", shape: "square", color: "secondary", onPress: onTogglePinned, children: _jsx(ButtonIcon, { icon: Pin, size: "lg" }) })) }))] }) }), _jsxs(Dialog.Outer, { control: infoControl, children: [_jsx(Dialog.Handle, {}), _jsx(Dialog.ScrollableInner, { label: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Feed menu"], ["Feed menu"])))), style: [gtMobile ? { width: 'auto', minWidth: 450 } : a.w_full], children: _jsx(DialogInner, { info: info, likeUri: likeUri, setLikeUri: setLikeUri, likeCount: likeCount, isPinned: isPinned, onTogglePinned: onTogglePinned, isFeedStateChangePending: isFeedStateChangePending }) })] })] }));
}
function DialogInner(_a) {
    var _this = this;
    var info = _a.info, likeUri = _a.likeUri, setLikeUri = _a.setLikeUri, likeCount = _a.likeCount, isPinned = _a.isPinned, onTogglePinned = _a.onTogglePinned, isFeedStateChangePending = _a.isFeedStateChangePending;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var hasSession = useSession().hasSession;
    var playHaptic = useHaptics();
    var control = Dialog.useDialogContext();
    var reportDialogControl = useReportDialogControl();
    var rt = useRichText(info.description.text)[0];
    var _b = useLikeMutation(), likeFeed = _b.mutateAsync, isLikePending = _b.isPending;
    var _c = useUnlikeMutation(), unlikeFeed = _c.mutateAsync, isUnlikePending = _c.isPending;
    var isLiked = !!likeUri;
    var feedRkey = React.useMemo(function () { return new AtUri(info.uri).rkey; }, [info.uri]);
    var onToggleLiked = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    playHaptic();
                    if (!(isLiked && likeUri)) return [3 /*break*/, 2];
                    return [4 /*yield*/, unlikeFeed({ uri: likeUri })];
                case 1:
                    _a.sent();
                    setLikeUri('');
                    ax.metric('feed:unlike', { feedUrl: info.uri });
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, likeFeed({ uri: info.uri, cid: info.cid })];
                case 3:
                    res = _a.sent();
                    setLikeUri(res.uri);
                    ax.metric('feed:like', { feedUrl: info.uri });
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_2 = _a.sent();
                    Toast.show(_(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["There was an issue contacting the server, please check your internet connection and try again."], ["There was an issue contacting the server, please check your internet connection and try again."])))), 'xmark');
                    logger.error('Failed to toggle like', { message: err_2 });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var onPressShare = React.useCallback(function () {
        playHaptic();
        var url = toShareUrl(info.route.href);
        shareUrl(url);
        ax.metric('feed:share', { feedUrl: info.uri });
    }, [info, playHaptic]);
    var onPressReport = React.useCallback(function () {
        reportDialogControl.open();
    }, [reportDialogControl]);
    return (_jsxs(View, { style: [a.gap_md], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_md], children: [_jsx(UserAvatar, { type: "algo", size: 48, avatar: info.avatar }), _jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsx(Text, { style: [a.text_2xl, a.font_bold, a.leading_tight], numberOfLines: 2, emoji: true, children: info.displayName }), _jsx(Text, { style: [a.text_sm, a.leading_relaxed, t.atoms.text_contrast_medium], numberOfLines: 1, children: _jsxs(Trans, { children: ["By", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["View ", "'s profile"], ["View ", "'s profile"])), info.creatorHandle)), to: makeProfileLink({
                                                did: info.creatorDid,
                                                handle: info.creatorHandle,
                                            }), style: [a.text_sm, a.underline, t.atoms.text_contrast_medium], numberOfLines: 1, onPress: function () { return control.close(); }, children: sanitizeHandle(info.creatorHandle, '@') })] }) })] }), _jsx(Button, { label: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Share this feed"], ["Share this feed"])))), size: "small", variant: "ghost", color: "secondary", shape: "round", onPress: onPressShare, children: _jsx(ButtonIcon, { icon: Share, size: "lg" }) })] }), _jsx(RichText, { value: rt, style: [a.text_md] }), _jsx(View, { style: [a.flex_row, a.gap_sm, a.align_center], children: typeof likeCount === 'number' && (_jsx(InlineLinkText, { label: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["View users who like this feed"], ["View users who like this feed"])))), to: makeCustomFeedLink(info.creatorDid, feedRkey, 'liked-by'), style: [a.underline, t.atoms.text_contrast_medium], onPress: function () { return control.close(); }, children: _jsxs(Trans, { children: ["Liked by ", _jsx(Plural, { value: likeCount, one: "# user", other: "# users" })] }) })) }), hasSession && (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center, a.pt_sm], children: [_jsxs(Button, { disabled: isLikePending || isUnlikePending, label: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Like this feed"], ["Like this feed"])))), size: "small", color: "secondary", onPress: onToggleLiked, style: [a.flex_1], children: [isLiked ? (_jsx(HeartFilled, { size: "sm", fill: t.palette.pink })) : (_jsx(ButtonIcon, { icon: Heart })), _jsx(ButtonText, { children: isLiked ? _jsx(Trans, { children: "Unlike" }) : _jsx(Trans, { children: "Like" }) })] }), _jsxs(Button, { disabled: isFeedStateChangePending, label: isPinned ? _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Unpin feed"], ["Unpin feed"])))) : _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Pin feed"], ["Pin feed"])))), size: "small", color: isPinned ? 'secondary' : 'primary', onPress: onTogglePinned, style: [a.flex_1], children: [_jsx(ButtonText, { children: isPinned ? _jsx(Trans, { children: "Unpin feed" }) : _jsx(Trans, { children: "Pin feed" }) }), _jsx(ButtonIcon, { icon: Pin, position: "right" })] })] }), _jsxs(View, { style: [a.pt_xs, a.gap_lg], children: [_jsx(Divider, {}), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm, a.justify_between], children: [_jsx(Text, { style: [a.italic, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Something wrong? Let us know." }) }), _jsxs(Button, { label: _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Report feed"], ["Report feed"])))), size: "small", variant: "solid", color: "secondary", onPress: onPressReport, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Report feed" }) }), _jsx(ButtonIcon, { icon: CircleInfo, position: "right" })] })] }), info.view && (_jsx(ReportDialog, { control: reportDialogControl, subject: __assign(__assign({}, info.view), { $type: 'app.bsky.feed.defs#generatorView' }) }))] })] }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26;
