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
import { useEffect } from 'react';
import { Linking, View } from 'react-native';
import * as Notification from 'expo-notifications';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppState } from '#/lib/appState';
import { useNotificationSettingsQuery } from '#/state/queries/notifications/settings';
import { atoms as a } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { At_Stroke2_Corner2_Rounded as AtIcon } from '#/components/icons/At';
import { BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { Bubble_Stroke2_Corner2_Rounded as BubbleIcon } from '#/components/icons/Bubble';
import { Haptic_Stroke2_Corner2_Rounded as HapticIcon } from '#/components/icons/Haptic';
import { Heart2_Stroke2_Corner0_Rounded as HeartIcon, LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon, } from '#/components/icons/Heart2';
import { PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import { CloseQuote_Stroke2_Corner0_Rounded as CloseQuoteIcon } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner2_Rounded as RepostIcon, RepostRepost_Stroke2_Corner2_Rounded as RepostRepostIcon, } from '#/components/icons/Repost';
import { Shapes_Stroke2_Corner0_Rounded as ShapesIcon } from '#/components/icons/Shapes';
import * as Layout from '#/components/Layout';
import { IS_ANDROID, IS_IOS, IS_WEB } from '#/env';
import * as SettingsList from '../components/SettingsList';
import { ItemTextWithSubtitle } from './components/ItemTextWithSubtitle';
var RQKEY = ['notification-permissions'];
export function NotificationSettingsScreen(_a) {
    var _this = this;
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var _b = useNotificationSettingsQuery(), settings = _b.data, isError = _b.isError;
    var _c = useQuery({
        queryKey: RQKEY,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (IS_WEB)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, Notification.getPermissionsAsync()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
    }), permissions = _c.data, refetch = _c.refetch;
    var appState = useAppState();
    useEffect(function () {
        if (appState === 'active') {
            refetch();
        }
    }, [appState, refetch]);
    var onRequestPermissions = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (IS_WEB)
                        return [2 /*return*/];
                    if (!(permissions === null || permissions === void 0 ? void 0 : permissions.canAskAgain)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Notification.requestPermissionsAsync()];
                case 1:
                    response = _b.sent();
                    queryClient.setQueryData(RQKEY, response);
                    return [3 /*break*/, 8];
                case 2:
                    if (!IS_ANDROID) return [3 /*break*/, 7];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
                            {
                                key: 'android.provider.extra.APP_PACKAGE',
                                value: 'xyz.blueskyweb.app',
                            },
                        ])];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    Linking.openSettings();
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 8];
                case 7:
                    if (IS_IOS) {
                        Linking.openSettings();
                    }
                    _b.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Notifications" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [permissions && !permissions.granted && (_jsxs(_Fragment, { children: [_jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Enable push notifications"], ["Enable push notifications"])))), onPress: onRequestPermissions, children: [_jsx(SettingsList.ItemIcon, { icon: HapticIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Enable push notifications" }) })] }), _jsx(SettingsList.Divider, {})] })), isError && (_jsx(View, { style: [a.px_lg, a.pb_md], children: _jsx(Admonition, { type: "error", children: _jsx(Trans, { children: "Failed to load notification settings." }) }) })), _jsxs(View, { style: [a.gap_sm], children: [_jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Settings for like notifications"], ["Settings for like notifications"])))), to: { screen: 'LikeNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: HeartIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Likes" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.like }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Settings for new follower notifications"], ["Settings for new follower notifications"])))), to: { screen: 'NewFollowerNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: PersonPlusIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "New followers" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.follow }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Settings for reply notifications"], ["Settings for reply notifications"])))), to: { screen: 'ReplyNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: BubbleIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Replies" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.reply }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Settings for mention notifications"], ["Settings for mention notifications"])))), to: { screen: 'MentionNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: AtIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Mentions" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.mention }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Settings for quote notifications"], ["Settings for quote notifications"])))), to: { screen: 'QuoteNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: CloseQuoteIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Quotes" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.quote }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Settings for repost notifications"], ["Settings for repost notifications"])))), to: { screen: 'RepostNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: RepostIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Reposts" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.repost }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Settings for activity from others"], ["Settings for activity from others"])))), to: { screen: 'ActivityNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: BellRingingIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Activity from others" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.subscribedPost }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Settings for notifications for likes of your reposts"], ["Settings for notifications for likes of your reposts"])))), to: { screen: 'LikesOnRepostsNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: LikeRepostIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Likes of your reposts" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.likeViaRepost }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Settings for notifications for reposts of your reposts"], ["Settings for notifications for reposts of your reposts"])))), to: { screen: 'RepostsOnRepostsNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: RepostRepostIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Reposts of your reposts" }), subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.repostViaRepost }), showSkeleton: !settings })] }), _jsxs(SettingsList.LinkItem, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Settings for notifications for everything else"], ["Settings for notifications for everything else"])))), to: { screen: 'MiscellaneousNotificationSettings' }, contentContainerStyle: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: ShapesIcon }), _jsx(ItemTextWithSubtitle, { titleText: _jsx(Trans, { children: "Everything else" }), 
                                            // technically a bundle of several settings, but since they're set together
                                            // and are most likely in sync we'll just show the state of one of them
                                            subtitleText: _jsx(SettingPreview, { preference: settings === null || settings === void 0 ? void 0 : settings.starterpackJoined }), showSkeleton: !settings })] })] })] }) })] }));
}
function SettingPreview(_a) {
    var preference = _a.preference;
    var _ = useLingui()._;
    if (!preference) {
        return null;
    }
    else {
        if ('include' in preference) {
            if (preference.include === 'all') {
                if (preference.list && preference.push) {
                    return _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["In-app, Push, Everyone"], ["In-app, Push, Everyone"]))));
                }
                else if (preference.list) {
                    return _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["In-app, Everyone"], ["In-app, Everyone"]))));
                }
                else if (preference.push) {
                    return _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Push, Everyone"], ["Push, Everyone"]))));
                }
            }
            else if (preference.include === 'follows') {
                if (preference.list && preference.push) {
                    return _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["In-app, Push, People you follow"], ["In-app, Push, People you follow"]))));
                }
                else if (preference.list) {
                    return _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["In-app, People you follow"], ["In-app, People you follow"]))));
                }
                else if (preference.push) {
                    return _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Push, People you follow"], ["Push, People you follow"]))));
                }
            }
        }
        else {
            if (preference.list && preference.push) {
                return _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["In-app, Push"], ["In-app, Push"]))));
            }
            else if (preference.list) {
                return _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["In-app"], ["In-app"]))));
            }
            else if (preference.push) {
                return _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Push"], ["Push"]))));
            }
        }
    }
    return _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Off"], ["Off"]))));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21;
