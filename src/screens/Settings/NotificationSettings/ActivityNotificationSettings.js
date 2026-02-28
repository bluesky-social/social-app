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
import { useCallback, useMemo } from 'react';
import { Text as RNText, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActivitySubscriptionsQuery } from '#/state/queries/activity-subscriptions';
import { useNotificationSettingsQuery } from '#/state/queries/notifications/settings';
import { List } from '#/view/com/util/List';
import { atoms as a, useTheme } from '#/alf';
import { SubscribeProfileDialog } from '#/components/activity-notifications/SubscribeProfileDialog';
import * as Admonition from '#/components/Admonition';
import { Button, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { BellRinging_Filled_Corner0_Rounded as BellRingingFilledIcon, BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon, } from '#/components/icons/BellRinging';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { ListFooter } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import * as SettingsList from '../components/SettingsList';
import { ItemTextWithSubtitle } from './components/ItemTextWithSubtitle';
import { PreferenceControls } from './components/PreferenceControls';
export function ActivityNotificationSettingsScreen(_a) {
    var _this = this;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useNotificationSettingsQuery(), preferences = _b.data, isError = _b.isError;
    var moderationOpts = useModerationOpts();
    var _c = useActivitySubscriptionsQuery(), subscriptions = _c.data, isPending = _c.isPending, error = _c.error, isFetchingNextPage = _c.isFetchingNextPage, fetchNextPage = _c.fetchNextPage, hasNextPage = _c.hasNextPage;
    var items = useMemo(function () {
        if (!subscriptions)
            return [];
        return subscriptions === null || subscriptions === void 0 ? void 0 : subscriptions.pages.flatMap(function (page) { return page.subscriptions; });
    }, [subscriptions]);
    var renderItem = useCallback(function (_a) {
        var item = _a.item;
        if (!moderationOpts)
            return null;
        return (_jsx(ActivitySubscriptionCard, { profile: item, moderationOpts: moderationOpts }));
    }, [moderationOpts]);
    var onEndReached = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isFetchingNextPage || !hasNextPage || isError)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchNextPage()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    logger.error('Failed to load more likes', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Notifications" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(List, { ListHeaderComponent: _jsxs(SettingsList.Container, { children: [_jsxs(SettingsList.Item, { style: [a.align_start], children: [_jsx(SettingsList.ItemIcon, { icon: BellRingingIcon }), _jsx(ItemTextWithSubtitle, { bold: true, titleText: _jsx(Trans, { children: "Activity from others" }), subtitleText: _jsx(Trans, { children: "Get notified about posts and replies from accounts you choose." }) })] }), isError ? (_jsx(View, { style: [a.px_lg, a.pt_md], children: _jsx(Admonition.Admonition, { type: "error", children: _jsx(Trans, { children: "Failed to load notification settings." }) }) })) : (_jsx(PreferenceControls, { name: "subscribedPost", preference: preferences === null || preferences === void 0 ? void 0 : preferences.subscribedPost }))] }), data: items, keyExtractor: keyExtractor, renderItem: renderItem, onEndReached: onEndReached, onEndReachedThreshold: 4, ListEmptyComponent: error ? null : (_jsx(View, { style: [a.px_xl, a.py_md], children: !isPending ? (_jsx(Admonition.Outer, { type: "tip", children: _jsxs(Admonition.Row, { children: [_jsx(Admonition.Icon, {}), _jsxs(Admonition.Content, { children: [_jsx(Admonition.Text, { children: _jsxs(Trans, { children: ["Enable notifications for an account by visiting their profile and pressing the", ' ', _jsx(RNText, { style: [
                                                            a.font_semi_bold,
                                                            t.atoms.text_contrast_high,
                                                        ], children: "bell icon" }), ' ', _jsx(BellRingingFilledIcon, { size: "xs", style: t.atoms.text_contrast_high }), "."] }) }), _jsx(Admonition.Text, { children: _jsxs(Trans, { children: ["If you want to restrict who can receive notifications for your account's activity, you can change this in", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Privacy and Security settings"], ["Privacy and Security settings"])))), to: { screen: 'ActivityPrivacySettings' }, style: [a.font_semi_bold], children: "Settings \u2192 Privacy and Security" }), "."] }) })] })] }) })) : (_jsx(View, { style: [a.flex_1, a.align_center, a.pt_xl], children: _jsx(Loader, { size: "lg" }) })) })), ListFooterComponent: _jsx(ListFooter, { style: [items.length === 0 && a.border_transparent], isFetchingNextPage: isFetchingNextPage, error: cleanError(error), onRetry: fetchNextPage, hasNextPage: hasNextPage }), windowSize: 11 })] }));
}
function keyExtractor(item) {
    return item.did;
}
function ActivitySubscriptionCard(_a) {
    var _b;
    var profileUnshadowed = _a.profile, moderationOpts = _a.moderationOpts;
    var profile = useProfileShadow(profileUnshadowed);
    var control = useDialogControl();
    var _ = useLingui()._;
    var t = useTheme();
    var preview = useMemo(function () {
        var _a;
        var actSub = (_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.activitySubscription;
        if ((actSub === null || actSub === void 0 ? void 0 : actSub.post) && (actSub === null || actSub === void 0 ? void 0 : actSub.reply)) {
            return _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Posts, Replies"], ["Posts, Replies"]))));
        }
        else if (actSub === null || actSub === void 0 ? void 0 : actSub.post) {
            return _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Posts"], ["Posts"]))));
        }
        else if (actSub === null || actSub === void 0 ? void 0 : actSub.reply) {
            return _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Replies"], ["Replies"]))));
        }
        return _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["None"], ["None"]))));
    }, [_, (_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.activitySubscription]);
    return (_jsxs(View, { style: [a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low], children: [_jsx(ProfileCard.Outer, { children: _jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts }), _jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts, inline: true }), _jsx(Text, { style: [a.leading_snug, t.atoms.text_contrast_medium], children: preview })] }), _jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Edit notifications from ", ""], ["Edit notifications from ", ""])), createSanitizedDisplayName(profile))), size: "small", color: "primary", variant: "solid", onPress: control.open, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Edit" }) }) })] }) }), _jsx(SubscribeProfileDialog, { control: control, profile: profile, moderationOpts: moderationOpts, includeProfile: true })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
