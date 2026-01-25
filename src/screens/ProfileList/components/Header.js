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
import { useMemo } from 'react';
import { View } from 'react-native';
import { AppBskyGraphDefs, RichText as RichTextAPI } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useHaptics } from '#/lib/haptics';
import { makeListLink } from '#/lib/routes/links';
import { logger } from '#/logger';
import { useListBlockMutation, useListMuteMutation } from '#/state/queries/list';
import { useAddSavedFeedsMutation, useUpdateSavedFeedsMutation, } from '#/state/queries/preferences';
import { useSession } from '#/state/session';
import { ProfileSubpageHeader } from '#/view/com/profile/ProfileSubpageHeader';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Loader } from '#/components/Loader';
import { RichText } from '#/components/RichText';
import * as Toast from '#/components/Toast';
import { useAnalytics } from '#/analytics';
import { MoreOptionsMenu } from './MoreOptionsMenu';
import { SubscribeMenu } from './SubscribeMenu';
export function Header(_a) {
    var _this = this;
    var _b, _c, _d;
    var rkey = _a.rkey, list = _a.list, preferences = _a.preferences;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST;
    var isModList = list.purpose === AppBskyGraphDefs.MODLIST;
    var isBlocking = !!((_b = list.viewer) === null || _b === void 0 ? void 0 : _b.blocked);
    var isMuting = !!((_c = list.viewer) === null || _c === void 0 ? void 0 : _c.muted);
    var playHaptic = useHaptics();
    var _e = useListMuteMutation(), muteList = _e.mutateAsync, isMutePending = _e.isPending;
    var _f = useListBlockMutation(), blockList = _f.mutateAsync, isBlockPending = _f.isPending;
    var _g = useAddSavedFeedsMutation(), addSavedFeeds = _g.mutateAsync, isAddSavedFeedPending = _g.isPending;
    var _h = useUpdateSavedFeedsMutation(), updateSavedFeeds = _h.mutateAsync, isUpdatingSavedFeeds = _h.isPending;
    var isPending = isAddSavedFeedPending || isUpdatingSavedFeeds;
    var savedFeedConfig = (_d = preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds) === null || _d === void 0 ? void 0 : _d.find(function (f) { return f.value === list.uri; });
    var isPinned = Boolean(savedFeedConfig === null || savedFeedConfig === void 0 ? void 0 : savedFeedConfig.pinned);
    var onTogglePinned = function () { return __awaiter(_this, void 0, void 0, function () {
        var pinned, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    playHaptic();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!savedFeedConfig) return [3 /*break*/, 3];
                    pinned = !savedFeedConfig.pinned;
                    return [4 /*yield*/, updateSavedFeeds([
                            __assign(__assign({}, savedFeedConfig), { pinned: pinned }),
                        ])];
                case 2:
                    _a.sent();
                    Toast.show(pinned
                        ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Pinned to your feeds"], ["Pinned to your feeds"]))))
                        : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Unpinned from your feeds"], ["Unpinned from your feeds"])))));
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, addSavedFeeds([
                        {
                            type: 'list',
                            value: list.uri,
                            pinned: true,
                        },
                    ])];
                case 4:
                    _a.sent();
                    Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Saved to your feeds"], ["Saved to your feeds"])))));
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["There was an issue contacting the server"], ["There was an issue contacting the server"])))), {
                        type: 'error',
                    });
                    logger.error('Failed to toggle pinned feed', { message: e_1 });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var onUnsubscribeMute = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, muteList({ uri: list.uri, mute: false })];
                case 1:
                    _b.sent();
                    Toast.show(_(msg({ message: 'List unmuted', context: 'toast' })));
                    ax.metric('moderation:unsubscribedFromList', { listType: 'mute' });
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var onUnsubscribeBlock = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, blockList({ uri: list.uri, block: false })];
                case 1:
                    _b.sent();
                    Toast.show(_(msg({ message: 'List unblocked', context: 'toast' })));
                    ax.metric('moderation:unsubscribedFromList', { listType: 'block' });
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var descriptionRT = useMemo(function () {
        return list.description
            ? new RichTextAPI({
                text: list.description,
                facets: list.descriptionFacets,
            })
            : undefined;
    }, [list]);
    return (_jsxs(_Fragment, { children: [_jsxs(ProfileSubpageHeader, { href: makeListLink(list.creator.handle || list.creator.did || '', rkey), title: list.name, avatar: list.avatar, isOwner: list.creator.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did), creator: list.creator, purpose: list.purpose, avatarType: "list", children: [isCurateList ? (_jsxs(Button, { testID: isPinned ? 'unpinBtn' : 'pinBtn', color: isPinned ? 'secondary' : 'primary_subtle', label: isPinned ? _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Unpin"], ["Unpin"])))) : _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Pin to home"], ["Pin to home"])))), onPress: onTogglePinned, disabled: isPending, size: "small", style: [a.rounded_full], children: [!isPinned && _jsx(ButtonIcon, { icon: isPending ? Loader : PinIcon }), _jsx(ButtonText, { children: isPinned ? _jsx(Trans, { children: "Unpin" }) : _jsx(Trans, { children: "Pin to home" }) })] })) : isModList ? (isBlocking ? (_jsxs(Button, { testID: "unblockBtn", color: "secondary", label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Unblock"], ["Unblock"])))), onPress: onUnsubscribeBlock, size: "small", style: [a.rounded_full], disabled: isBlockPending, children: [isBlockPending && _jsx(ButtonIcon, { icon: Loader }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Unblock" }) })] })) : isMuting ? (_jsxs(Button, { testID: "unmuteBtn", color: "secondary", label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Unmute"], ["Unmute"])))), onPress: onUnsubscribeMute, size: "small", style: [a.rounded_full], disabled: isMutePending, children: [isMutePending && _jsx(ButtonIcon, { icon: Loader }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Unmute" }) })] })) : (_jsx(SubscribeMenu, { list: list }))) : null, _jsx(MoreOptionsMenu, { list: list })] }), descriptionRT ? (_jsx(View, { style: [a.px_lg, a.pt_sm, a.pb_sm, a.gap_md], children: _jsx(RichText, { value: descriptionRT, style: [a.text_md] }) })) : null] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
