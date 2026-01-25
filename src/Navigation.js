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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/macro';
import { createBottomTabNavigator, } from '@react-navigation/bottom-tabs';
import { CommonActions, createNavigationContainerRef, DarkTheme, DefaultTheme, NavigationContainer, StackActions, } from '@react-navigation/native';
import { timeout } from '#/lib/async/timeout';
import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { useColorSchemeStyle } from '#/lib/hooks/useColorSchemeStyle';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { getNotificationPayload, notificationToURL, storePayloadForAccountSwitch, } from '#/lib/hooks/useNotificationHandler';
import { useWebScrollRestoration } from '#/lib/hooks/useWebScrollRestoration';
import { useCallOnce } from '#/lib/once';
import { buildStateObject } from '#/lib/routes/helpers';
import { bskyTitle } from '#/lib/strings/headings';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useSession } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { shouldRequestEmailConfirmation, snoozeEmailConfirmationPrompt, } from '#/state/shell/reminders';
import { useCloseAllActiveElements } from '#/state/util';
import { CommunityGuidelinesScreen } from '#/view/screens/CommunityGuidelines';
import { CopyrightPolicyScreen } from '#/view/screens/CopyrightPolicy';
import { DebugModScreen } from '#/view/screens/DebugMod';
import { FeedsScreen } from '#/view/screens/Feeds';
import { HomeScreen } from '#/view/screens/Home';
import { ListsScreen } from '#/view/screens/Lists';
import { ModerationBlockedAccounts } from '#/view/screens/ModerationBlockedAccounts';
import { ModerationModlistsScreen } from '#/view/screens/ModerationModlists';
import { ModerationMutedAccounts } from '#/view/screens/ModerationMutedAccounts';
import { NotFoundScreen } from '#/view/screens/NotFound';
import { NotificationsScreen } from '#/view/screens/Notifications';
import { PostThreadScreen } from '#/view/screens/PostThread';
import { PrivacyPolicyScreen } from '#/view/screens/PrivacyPolicy';
import { ProfileScreen } from '#/view/screens/Profile';
import { ProfileFeedLikedByScreen } from '#/view/screens/ProfileFeedLikedBy';
import { StorybookScreen } from '#/view/screens/Storybook';
import { SupportScreen } from '#/view/screens/Support';
import { TermsOfServiceScreen } from '#/view/screens/TermsOfService';
import { BottomBar } from '#/view/shell/bottom-bar/BottomBar';
import { createNativeStackNavigatorWithAuth } from '#/view/shell/createNativeStackNavigatorWithAuth';
import { BookmarksScreen } from '#/screens/Bookmarks';
import { SharedPreferencesTesterScreen } from '#/screens/E2E/SharedPreferencesTesterScreen';
import { FindContactsFlowScreen } from '#/screens/FindContactsFlowScreen';
import HashtagScreen from '#/screens/Hashtag';
import { LogScreen } from '#/screens/Log';
import { MessagesScreen } from '#/screens/Messages/ChatList';
import { MessagesConversationScreen } from '#/screens/Messages/Conversation';
import { MessagesInboxScreen } from '#/screens/Messages/Inbox';
import { MessagesSettingsScreen } from '#/screens/Messages/Settings';
import { ModerationScreen } from '#/screens/Moderation';
import { Screen as ModerationVerificationSettings } from '#/screens/Moderation/VerificationSettings';
import { Screen as ModerationInteractionSettings } from '#/screens/ModerationInteractionSettings';
import { NotificationsActivityListScreen } from '#/screens/Notifications/ActivityList';
import { PostLikedByScreen } from '#/screens/Post/PostLikedBy';
import { PostQuotesScreen } from '#/screens/Post/PostQuotes';
import { PostRepostedByScreen } from '#/screens/Post/PostRepostedBy';
import { ProfileKnownFollowersScreen } from '#/screens/Profile/KnownFollowers';
import { ProfileFeedScreen } from '#/screens/Profile/ProfileFeed';
import { ProfileFollowersScreen } from '#/screens/Profile/ProfileFollowers';
import { ProfileFollowsScreen } from '#/screens/Profile/ProfileFollows';
import { ProfileLabelerLikedByScreen } from '#/screens/Profile/ProfileLabelerLikedBy';
import { ProfileSearchScreen } from '#/screens/Profile/ProfileSearch';
import { ProfileListScreen } from '#/screens/ProfileList';
import { SavedFeeds } from '#/screens/SavedFeeds';
import { SearchScreen } from '#/screens/Search';
import { AboutSettingsScreen } from '#/screens/Settings/AboutSettings';
import { AccessibilitySettingsScreen } from '#/screens/Settings/AccessibilitySettings';
import { AccountSettingsScreen } from '#/screens/Settings/AccountSettings';
import { ActivityPrivacySettingsScreen } from '#/screens/Settings/ActivityPrivacySettings';
import { AppearanceSettingsScreen } from '#/screens/Settings/AppearanceSettings';
import { AppIconSettingsScreen } from '#/screens/Settings/AppIconSettings';
import { AppPasswordsScreen } from '#/screens/Settings/AppPasswords';
import { ContentAndMediaSettingsScreen } from '#/screens/Settings/ContentAndMediaSettings';
import { ExternalMediaPreferencesScreen } from '#/screens/Settings/ExternalMediaPreferences';
import { FindContactsSettingsScreen } from '#/screens/Settings/FindContactsSettings';
import { FollowingFeedPreferencesScreen } from '#/screens/Settings/FollowingFeedPreferences';
import { InterestsSettingsScreen } from '#/screens/Settings/InterestsSettings';
import { LanguageSettingsScreen } from '#/screens/Settings/LanguageSettings';
import { LegacyNotificationSettingsScreen } from '#/screens/Settings/LegacyNotificationSettings';
import { NotificationSettingsScreen } from '#/screens/Settings/NotificationSettings';
import { ActivityNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/ActivityNotificationSettings';
import { LikeNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/LikeNotificationSettings';
import { LikesOnRepostsNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/LikesOnRepostsNotificationSettings';
import { MentionNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/MentionNotificationSettings';
import { MiscellaneousNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/MiscellaneousNotificationSettings';
import { NewFollowerNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/NewFollowerNotificationSettings';
import { QuoteNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/QuoteNotificationSettings';
import { ReplyNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/ReplyNotificationSettings';
import { RepostNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/RepostNotificationSettings';
import { RepostsOnRepostsNotificationSettingsScreen } from '#/screens/Settings/NotificationSettings/RepostsOnRepostsNotificationSettings';
import { PrivacyAndSecuritySettingsScreen } from '#/screens/Settings/PrivacyAndSecuritySettings';
import { SettingsScreen } from '#/screens/Settings/Settings';
import { ThreadPreferencesScreen } from '#/screens/Settings/ThreadPreferences';
import { StarterPackScreen, StarterPackScreenShort, } from '#/screens/StarterPack/StarterPackScreen';
import { Wizard } from '#/screens/StarterPack/Wizard';
import TopicScreen from '#/screens/Topic';
import { VideoFeed } from '#/screens/VideoFeed';
import { useTheme } from '#/alf';
import { EmailDialogScreenID, useEmailDialogControl, } from '#/components/dialogs/EmailDialog';
import { useAnalytics } from '#/analytics';
import { setNavigationMetadata } from '#/analytics/metadata';
import { IS_NATIVE, IS_WEB } from '#/env';
import { router } from '#/routes';
import { Referrer } from '../modules/expo-bluesky-swiss-army';
var navigationRef = createNavigationContainerRef();
var HomeTab = createNativeStackNavigatorWithAuth();
var SearchTab = createNativeStackNavigatorWithAuth();
var NotificationsTab = createNativeStackNavigatorWithAuth();
var MyProfileTab = createNativeStackNavigatorWithAuth();
var MessagesTab = createNativeStackNavigatorWithAuth();
var Flat = createNativeStackNavigatorWithAuth();
var Tab = createBottomTabNavigator();
/**
 * These "common screens" are reused across stacks.
 */
function commonScreens(Stack, unreadCountLabel) {
    var title = function (page) {
        return bskyTitle(i18n._(page), unreadCountLabel);
    };
    return (_jsxs(_Fragment, { children: [_jsx(Stack.Screen, { name: "NotFound", getComponent: function () { return NotFoundScreen; }, options: { title: title(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Not Found"], ["Not Found"])))) } }), _jsx(Stack.Screen, { name: "Lists", component: ListsScreen, options: { title: title(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Lists"], ["Lists"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "Moderation", getComponent: function () { return ModerationScreen; }, options: { title: title(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Moderation"], ["Moderation"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "ModerationModlists", getComponent: function () { return ModerationModlistsScreen; }, options: { title: title(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Moderation Lists"], ["Moderation Lists"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "ModerationMutedAccounts", getComponent: function () { return ModerationMutedAccounts; }, options: { title: title(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Muted Accounts"], ["Muted Accounts"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "ModerationBlockedAccounts", getComponent: function () { return ModerationBlockedAccounts; }, options: { title: title(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Blocked Accounts"], ["Blocked Accounts"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "ModerationInteractionSettings", getComponent: function () { return ModerationInteractionSettings; }, options: {
                    title: title(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Post Interaction Settings"], ["Post Interaction Settings"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "ModerationVerificationSettings", getComponent: function () { return ModerationVerificationSettings; }, options: {
                    title: title(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Verification Settings"], ["Verification Settings"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "Settings", getComponent: function () { return SettingsScreen; }, options: { title: title(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Settings"], ["Settings"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "LanguageSettings", getComponent: function () { return LanguageSettingsScreen; }, options: { title: title(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Language Settings"], ["Language Settings"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "Profile", getComponent: function () { return ProfileScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: bskyTitle("@".concat(route.params.name), unreadCountLabel),
                    });
                } }), _jsx(Stack.Screen, { name: "ProfileFollowers", getComponent: function () { return ProfileFollowersScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: title(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["People following @", ""], ["People following @", ""])), route.params.name)),
                    });
                } }), _jsx(Stack.Screen, { name: "ProfileFollows", getComponent: function () { return ProfileFollowsScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: title(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["People followed by @", ""], ["People followed by @", ""])), route.params.name)),
                    });
                } }), _jsx(Stack.Screen, { name: "ProfileKnownFollowers", getComponent: function () { return ProfileKnownFollowersScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: title(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Followers of @", " that you know"], ["Followers of @", " that you know"])), route.params.name)),
                    });
                } }), _jsx(Stack.Screen, { name: "ProfileList", getComponent: function () { return ProfileListScreen; }, options: { title: title(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["List"], ["List"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "ProfileSearch", getComponent: function () { return ProfileSearchScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: title(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Search @", "'s posts"], ["Search @", "'s posts"])), route.params.name)),
                    });
                } }), _jsx(Stack.Screen, { name: "PostThread", getComponent: function () { return PostThreadScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: title(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Post by @", ""], ["Post by @", ""])), route.params.name)),
                    });
                } }), _jsx(Stack.Screen, { name: "PostLikedBy", getComponent: function () { return PostLikedByScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: title(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Post by @", ""], ["Post by @", ""])), route.params.name)),
                    });
                } }), _jsx(Stack.Screen, { name: "PostRepostedBy", getComponent: function () { return PostRepostedByScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: title(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Post by @", ""], ["Post by @", ""])), route.params.name)),
                    });
                } }), _jsx(Stack.Screen, { name: "PostQuotes", getComponent: function () { return PostQuotesScreen; }, options: function (_a) {
                    var route = _a.route;
                    return ({
                        title: title(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Post by @", ""], ["Post by @", ""])), route.params.name)),
                    });
                } }), _jsx(Stack.Screen, { name: "ProfileFeed", getComponent: function () { return ProfileFeedScreen; }, options: { title: title(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Feed"], ["Feed"])))) } }), _jsx(Stack.Screen, { name: "ProfileFeedLikedBy", getComponent: function () { return ProfileFeedLikedByScreen; }, options: { title: title(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Liked by"], ["Liked by"])))) } }), _jsx(Stack.Screen, { name: "ProfileLabelerLikedBy", getComponent: function () { return ProfileLabelerLikedByScreen; }, options: { title: title(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Liked by"], ["Liked by"])))) } }), _jsx(Stack.Screen, { name: "Debug", getComponent: function () { return StorybookScreen; }, options: { title: title(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Storybook"], ["Storybook"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "DebugMod", getComponent: function () { return DebugModScreen; }, options: { title: title(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Moderation states"], ["Moderation states"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "SharedPreferencesTester", getComponent: function () { return SharedPreferencesTesterScreen; }, options: { title: title(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Shared Preferences Tester"], ["Shared Preferences Tester"])))) } }), _jsx(Stack.Screen, { name: "Log", getComponent: function () { return LogScreen; }, options: { title: title(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Log"], ["Log"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "Support", getComponent: function () { return SupportScreen; }, options: { title: title(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Support"], ["Support"])))) } }), _jsx(Stack.Screen, { name: "PrivacyPolicy", getComponent: function () { return PrivacyPolicyScreen; }, options: { title: title(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Privacy Policy"], ["Privacy Policy"])))) } }), _jsx(Stack.Screen, { name: "TermsOfService", getComponent: function () { return TermsOfServiceScreen; }, options: { title: title(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["Terms of Service"], ["Terms of Service"])))) } }), _jsx(Stack.Screen, { name: "CommunityGuidelines", getComponent: function () { return CommunityGuidelinesScreen; }, options: { title: title(msg(templateObject_30 || (templateObject_30 = __makeTemplateObject(["Community Guidelines"], ["Community Guidelines"])))) } }), _jsx(Stack.Screen, { name: "CopyrightPolicy", getComponent: function () { return CopyrightPolicyScreen; }, options: { title: title(msg(templateObject_31 || (templateObject_31 = __makeTemplateObject(["Copyright Policy"], ["Copyright Policy"])))) } }), _jsx(Stack.Screen, { name: "AppPasswords", getComponent: function () { return AppPasswordsScreen; }, options: { title: title(msg(templateObject_32 || (templateObject_32 = __makeTemplateObject(["App Passwords"], ["App Passwords"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "SavedFeeds", getComponent: function () { return SavedFeeds; }, options: { title: title(msg(templateObject_33 || (templateObject_33 = __makeTemplateObject(["Edit My Feeds"], ["Edit My Feeds"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "PreferencesFollowingFeed", getComponent: function () { return FollowingFeedPreferencesScreen; }, options: {
                    title: title(msg(templateObject_34 || (templateObject_34 = __makeTemplateObject(["Following Feed Preferences"], ["Following Feed Preferences"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "PreferencesThreads", getComponent: function () { return ThreadPreferencesScreen; }, options: { title: title(msg(templateObject_35 || (templateObject_35 = __makeTemplateObject(["Threads Preferences"], ["Threads Preferences"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "PreferencesExternalEmbeds", getComponent: function () { return ExternalMediaPreferencesScreen; }, options: {
                    title: title(msg(templateObject_36 || (templateObject_36 = __makeTemplateObject(["External Media Preferences"], ["External Media Preferences"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "AccessibilitySettings", getComponent: function () { return AccessibilitySettingsScreen; }, options: {
                    title: title(msg(templateObject_37 || (templateObject_37 = __makeTemplateObject(["Accessibility Settings"], ["Accessibility Settings"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "AppearanceSettings", getComponent: function () { return AppearanceSettingsScreen; }, options: {
                    title: title(msg(templateObject_38 || (templateObject_38 = __makeTemplateObject(["Appearance"], ["Appearance"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "AccountSettings", getComponent: function () { return AccountSettingsScreen; }, options: {
                    title: title(msg(templateObject_39 || (templateObject_39 = __makeTemplateObject(["Account"], ["Account"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "PrivacyAndSecuritySettings", getComponent: function () { return PrivacyAndSecuritySettingsScreen; }, options: {
                    title: title(msg(templateObject_40 || (templateObject_40 = __makeTemplateObject(["Privacy and Security"], ["Privacy and Security"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "ActivityPrivacySettings", getComponent: function () { return ActivityPrivacySettingsScreen; }, options: {
                    title: title(msg(templateObject_41 || (templateObject_41 = __makeTemplateObject(["Privacy and Security"], ["Privacy and Security"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "FindContactsSettings", getComponent: function () { return FindContactsSettingsScreen; }, options: {
                    title: title(msg(templateObject_42 || (templateObject_42 = __makeTemplateObject(["Find Contacts"], ["Find Contacts"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "NotificationSettings", getComponent: function () { return NotificationSettingsScreen; }, options: { title: title(msg(templateObject_43 || (templateObject_43 = __makeTemplateObject(["Notification settings"], ["Notification settings"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "ReplyNotificationSettings", getComponent: function () { return ReplyNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_44 || (templateObject_44 = __makeTemplateObject(["Reply notifications"], ["Reply notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "MentionNotificationSettings", getComponent: function () { return MentionNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_45 || (templateObject_45 = __makeTemplateObject(["Mention notifications"], ["Mention notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "QuoteNotificationSettings", getComponent: function () { return QuoteNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_46 || (templateObject_46 = __makeTemplateObject(["Quote notifications"], ["Quote notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "LikeNotificationSettings", getComponent: function () { return LikeNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_47 || (templateObject_47 = __makeTemplateObject(["Like notifications"], ["Like notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "RepostNotificationSettings", getComponent: function () { return RepostNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_48 || (templateObject_48 = __makeTemplateObject(["Repost notifications"], ["Repost notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "NewFollowerNotificationSettings", getComponent: function () { return NewFollowerNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_49 || (templateObject_49 = __makeTemplateObject(["New follower notifications"], ["New follower notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "LikesOnRepostsNotificationSettings", getComponent: function () { return LikesOnRepostsNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_50 || (templateObject_50 = __makeTemplateObject(["Likes of your reposts notifications"], ["Likes of your reposts notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "RepostsOnRepostsNotificationSettings", getComponent: function () { return RepostsOnRepostsNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_51 || (templateObject_51 = __makeTemplateObject(["Reposts of your reposts notifications"], ["Reposts of your reposts notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "ActivityNotificationSettings", getComponent: function () { return ActivityNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_52 || (templateObject_52 = __makeTemplateObject(["Activity notifications"], ["Activity notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "MiscellaneousNotificationSettings", getComponent: function () { return MiscellaneousNotificationSettingsScreen; }, options: {
                    title: title(msg(templateObject_53 || (templateObject_53 = __makeTemplateObject(["Miscellaneous notifications"], ["Miscellaneous notifications"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "ContentAndMediaSettings", getComponent: function () { return ContentAndMediaSettingsScreen; }, options: {
                    title: title(msg(templateObject_54 || (templateObject_54 = __makeTemplateObject(["Content and Media"], ["Content and Media"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "InterestsSettings", getComponent: function () { return InterestsSettingsScreen; }, options: {
                    title: title(msg(templateObject_55 || (templateObject_55 = __makeTemplateObject(["Your interests"], ["Your interests"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "AboutSettings", getComponent: function () { return AboutSettingsScreen; }, options: {
                    title: title(msg(templateObject_56 || (templateObject_56 = __makeTemplateObject(["About"], ["About"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "AppIconSettings", getComponent: function () { return AppIconSettingsScreen; }, options: {
                    title: title(msg(templateObject_57 || (templateObject_57 = __makeTemplateObject(["App Icon"], ["App Icon"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "Hashtag", getComponent: function () { return HashtagScreen; }, options: { title: title(msg(templateObject_58 || (templateObject_58 = __makeTemplateObject(["Hashtag"], ["Hashtag"])))) } }), _jsx(Stack.Screen, { name: "Topic", getComponent: function () { return TopicScreen; }, options: { title: title(msg(templateObject_59 || (templateObject_59 = __makeTemplateObject(["Topic"], ["Topic"])))) } }), _jsx(Stack.Screen, { name: "MessagesConversation", getComponent: function () { return MessagesConversationScreen; }, options: { title: title(msg(templateObject_60 || (templateObject_60 = __makeTemplateObject(["Chat"], ["Chat"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "MessagesSettings", getComponent: function () { return MessagesSettingsScreen; }, options: { title: title(msg(templateObject_61 || (templateObject_61 = __makeTemplateObject(["Chat settings"], ["Chat settings"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "MessagesInbox", getComponent: function () { return MessagesInboxScreen; }, options: { title: title(msg(templateObject_62 || (templateObject_62 = __makeTemplateObject(["Chat request inbox"], ["Chat request inbox"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "NotificationsActivityList", getComponent: function () { return NotificationsActivityListScreen; }, options: { title: title(msg(templateObject_63 || (templateObject_63 = __makeTemplateObject(["Notifications"], ["Notifications"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "LegacyNotificationSettings", getComponent: function () { return LegacyNotificationSettingsScreen; }, options: { title: title(msg(templateObject_64 || (templateObject_64 = __makeTemplateObject(["Notification settings"], ["Notification settings"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "Feeds", getComponent: function () { return FeedsScreen; }, options: { title: title(msg(templateObject_65 || (templateObject_65 = __makeTemplateObject(["Feeds"], ["Feeds"])))) } }), _jsx(Stack.Screen, { name: "StarterPack", getComponent: function () { return StarterPackScreen; }, options: { title: title(msg(templateObject_66 || (templateObject_66 = __makeTemplateObject(["Starter Pack"], ["Starter Pack"])))) } }), _jsx(Stack.Screen, { name: "StarterPackShort", getComponent: function () { return StarterPackScreenShort; }, options: { title: title(msg(templateObject_67 || (templateObject_67 = __makeTemplateObject(["Starter Pack"], ["Starter Pack"])))) } }), _jsx(Stack.Screen, { name: "StarterPackWizard", getComponent: function () { return Wizard; }, options: { title: title(msg(templateObject_68 || (templateObject_68 = __makeTemplateObject(["Create a starter pack"], ["Create a starter pack"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "StarterPackEdit", getComponent: function () { return Wizard; }, options: { title: title(msg(templateObject_69 || (templateObject_69 = __makeTemplateObject(["Edit your starter pack"], ["Edit your starter pack"])))), requireAuth: true } }), _jsx(Stack.Screen, { name: "VideoFeed", getComponent: function () { return VideoFeed; }, options: {
                    title: title(msg(templateObject_70 || (templateObject_70 = __makeTemplateObject(["Video Feed"], ["Video Feed"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "Bookmarks", getComponent: function () { return BookmarksScreen; }, options: {
                    title: title(msg(templateObject_71 || (templateObject_71 = __makeTemplateObject(["Saved Posts"], ["Saved Posts"])))),
                    requireAuth: true,
                } }), _jsx(Stack.Screen, { name: "FindContactsFlow", getComponent: function () { return FindContactsFlowScreen; }, options: {
                    title: title(msg(templateObject_72 || (templateObject_72 = __makeTemplateObject(["Find Contacts"], ["Find Contacts"])))),
                    requireAuth: true,
                    gestureEnabled: false,
                } })] }));
}
/**
 * The TabsNavigator is used by native mobile to represent the routes
 * in 3 distinct tab-stacks with a different root screen on each.
 */
function TabsNavigator(_a) {
    var layout = _a.layout;
    var tabBar = useCallback(function (props) { return (_jsx(BottomBar, __assign({}, props))); }, []);
    return (_jsxs(Tab.Navigator, { initialRouteName: "HomeTab", backBehavior: "initialRoute", screenOptions: { headerShown: false, lazy: true }, tabBar: tabBar, layout: layout, children: [_jsx(Tab.Screen, { name: "HomeTab", getComponent: function () { return HomeTabNavigator; } }), _jsx(Tab.Screen, { name: "SearchTab", getComponent: function () { return SearchTabNavigator; } }), _jsx(Tab.Screen, { name: "MessagesTab", getComponent: function () { return MessagesTabNavigator; } }), _jsx(Tab.Screen, { name: "NotificationsTab", getComponent: function () { return NotificationsTabNavigator; } }), _jsx(Tab.Screen, { name: "MyProfileTab", getComponent: function () { return MyProfileTabNavigator; } })] }));
}
function screenOptions(t) {
    return {
        fullScreenGestureEnabled: true,
        headerShown: false,
        contentStyle: t.atoms.bg,
    };
}
function HomeTabNavigator() {
    var t = useTheme();
    return (_jsxs(HomeTab.Navigator, { screenOptions: screenOptions(t), initialRouteName: "Home", children: [_jsx(HomeTab.Screen, { name: "Home", getComponent: function () { return HomeScreen; } }), _jsx(HomeTab.Screen, { name: "Start", getComponent: function () { return HomeScreen; } }), commonScreens(HomeTab)] }));
}
function SearchTabNavigator() {
    var t = useTheme();
    return (_jsxs(SearchTab.Navigator, { screenOptions: screenOptions(t), initialRouteName: "Search", children: [_jsx(SearchTab.Screen, { name: "Search", getComponent: function () { return SearchScreen; } }), commonScreens(SearchTab)] }));
}
function NotificationsTabNavigator() {
    var t = useTheme();
    return (_jsxs(NotificationsTab.Navigator, { screenOptions: screenOptions(t), initialRouteName: "Notifications", children: [_jsx(NotificationsTab.Screen, { name: "Notifications", getComponent: function () { return NotificationsScreen; }, options: { requireAuth: true } }), commonScreens(NotificationsTab)] }));
}
function MyProfileTabNavigator() {
    var t = useTheme();
    return (_jsxs(MyProfileTab.Navigator, { screenOptions: screenOptions(t), initialRouteName: "MyProfile", children: [_jsx(MyProfileTab.Screen
            // MyProfile is not in AllNavigationParams - asserting as Profile at least
            // gives us typechecking for initialParams -sfn
            , { 
                // MyProfile is not in AllNavigationParams - asserting as Profile at least
                // gives us typechecking for initialParams -sfn
                name: 'MyProfile', getComponent: function () { return ProfileScreen; }, initialParams: { name: 'me', hideBackButton: true } }), commonScreens(MyProfileTab)] }));
}
function MessagesTabNavigator() {
    var t = useTheme();
    return (_jsxs(MessagesTab.Navigator, { screenOptions: screenOptions(t), initialRouteName: "Messages", children: [_jsx(MessagesTab.Screen, { name: "Messages", getComponent: function () { return MessagesScreen; }, options: function (_a) {
                    var _b, _c;
                    var route = _a.route;
                    return ({
                        requireAuth: true,
                        animationTypeForReplace: (_c = (_b = route.params) === null || _b === void 0 ? void 0 : _b.animation) !== null && _c !== void 0 ? _c : 'push',
                    });
                } }), commonScreens(MessagesTab)] }));
}
/**
 * The FlatNavigator is used by Web to represent the routes
 * in a single ("flat") stack.
 */
var FlatNavigator = function (_a) {
    var layout = _a.layout;
    var t = useTheme();
    var numUnread = useUnreadNotifications();
    var screenListeners = useWebScrollRestoration();
    var title = function (page) { return bskyTitle(i18n._(page), numUnread); };
    return (_jsxs(Flat.Navigator, { layout: layout, screenListeners: screenListeners, screenOptions: screenOptions(t), children: [_jsx(Flat.Screen, { name: "Home", getComponent: function () { return HomeScreen; }, options: { title: title(msg(templateObject_73 || (templateObject_73 = __makeTemplateObject(["Home"], ["Home"])))) } }), _jsx(Flat.Screen, { name: "Search", getComponent: function () { return SearchScreen; }, options: { title: title(msg(templateObject_74 || (templateObject_74 = __makeTemplateObject(["Explore"], ["Explore"])))) } }), _jsx(Flat.Screen, { name: "Notifications", getComponent: function () { return NotificationsScreen; }, options: { title: title(msg(templateObject_75 || (templateObject_75 = __makeTemplateObject(["Notifications"], ["Notifications"])))), requireAuth: true } }), _jsx(Flat.Screen, { name: "Messages", getComponent: function () { return MessagesScreen; }, options: { title: title(msg(templateObject_76 || (templateObject_76 = __makeTemplateObject(["Messages"], ["Messages"])))), requireAuth: true } }), _jsx(Flat.Screen, { name: "Start", getComponent: function () { return HomeScreen; }, options: { title: title(msg(templateObject_77 || (templateObject_77 = __makeTemplateObject(["Home"], ["Home"])))) } }), commonScreens(Flat, numUnread)] }));
};
/**
 * The RoutesContainer should wrap all components which need access
 * to the navigation context.
 */
var LINKING = {
    // TODO figure out what we are going to use
    // note: `bluesky://` is what is used in app.config.js
    prefixes: ['bsky://', 'bluesky://', 'https://bsky.app'],
    getPathFromState: function (state) {
        var _a, _b, _c, _d;
        // find the current node in the navigation tree
        var node = state.routes[state.index || 0];
        while (((_a = node.state) === null || _a === void 0 ? void 0 : _a.routes) && typeof ((_b = node.state) === null || _b === void 0 ? void 0 : _b.index) === 'number') {
            node = (_c = node.state) === null || _c === void 0 ? void 0 : _c.routes[(_d = node.state) === null || _d === void 0 ? void 0 : _d.index];
        }
        // build the path
        var route = router.matchName(node.name);
        if (typeof route === 'undefined') {
            return '/'; // default to home
        }
        return route.build((node.params || {}));
    },
    getStateFromPath: function (path) {
        var _a = router.matchPath(path), name = _a[0], params = _a[1];
        // Any time we receive a url that starts with `intent/` we want to ignore it here. It will be handled in the
        // intent handler hook. We should check for the trailing slash, because if there isn't one then it isn't a valid
        // intent
        // On web, there is no route state that's created by default, so we should initialize it as the home route. On
        // native, since the home tab and the home screen are defined as initial routes, we don't need to return a state
        // since it will be created by react-navigation.
        if (path.includes('intent/')) {
            if (IS_NATIVE)
                return;
            return buildStateObject('Flat', 'Home', params);
        }
        if (IS_NATIVE) {
            if (name === 'Search') {
                return buildStateObject('SearchTab', 'Search', params);
            }
            if (name === 'Notifications') {
                return buildStateObject('NotificationsTab', 'Notifications', params);
            }
            if (name === 'Home') {
                return buildStateObject('HomeTab', 'Home', params);
            }
            if (name === 'Messages') {
                return buildStateObject('MessagesTab', 'Messages', params);
            }
            // if the path is something else, like a post, profile, or even settings, we need to initialize the home tab as pre-existing state otherwise the back button will not work
            return buildStateObject('HomeTab', name, params, [
                {
                    name: 'Home',
                    params: {},
                },
            ]);
        }
        else {
            var res = buildStateObject('Flat', name, params);
            return res;
        }
    },
};
/**
 * Used to ensure we don't handle the same notification twice
 */
var lastHandledNotificationDateDedupe;
function RoutesContainer(_a) {
    var children = _a.children;
    var ax = useAnalytics();
    var notyLogger = ax.logger.useChild(ax.logger.Context.Notifications);
    var theme = useColorSchemeStyle(DefaultTheme, DarkTheme);
    var _b = useSession(), currentAccount = _b.currentAccount, accounts = _b.accounts;
    var onPressSwitchAccount = useAccountSwitcher().onPressSwitchAccount;
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var previousScreen = useRef(undefined);
    var emailDialogControl = useEmailDialogControl();
    var closeAllActiveElements = useCloseAllActiveElements();
    /**
     * Handle navigation to a conversation, or prepares for account switch.
     *
     * Non-reactive because we need the latest data from some hooks
     * after an async call - sfn
     */
    var handleChatMessage = useNonReactiveCallback(function (payload) {
        notyLogger.debug("handleChatMessage", { payload: payload });
        if (payload.recipientDid !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
            // handled in useNotificationHandler after account switch finishes
            storePayloadForAccountSwitch(payload);
            closeAllActiveElements();
            var account = accounts.find(function (a) { return a.did === payload.recipientDid; });
            if (account) {
                onPressSwitchAccount(account, 'Notification');
            }
            else {
                setShowLoggedOut(true);
            }
        }
        else {
            // @ts-expect-error nested navigators aren't typed -sfn
            navigate('MessagesTab', {
                screen: 'Messages',
                params: {
                    pushToConversation: payload.convoId,
                },
            });
        }
    });
    function handlePushNotificationEntry() {
        return __awaiter(this, void 0, void 0, function () {
            var response, payload, path, _a, screen_1, params;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!IS_NATIVE)
                            return [2 /*return*/];
                        return [4 /*yield*/, Linking.getInitialURL()];
                    case 1:
                        // deep links take precedence - on android,
                        // getLastNotificationResponseAsync returns a "notification"
                        // that is actually a deep link. avoid handling it twice -sfn
                        if (_b.sent()) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Notifications.getLastNotificationResponseAsync()];
                    case 2:
                        response = _b.sent();
                        if (response) {
                            notyLogger.debug("handlePushNotificationEntry: response", { response: response });
                            if (response.notification.date === lastHandledNotificationDateDedupe)
                                return [2 /*return*/];
                            lastHandledNotificationDateDedupe = response.notification.date;
                            payload = getNotificationPayload(response.notification);
                            if (payload) {
                                ax.metric('notifications:openApp', {
                                    reason: payload.reason,
                                    causedBoot: true,
                                });
                                if (payload.reason === 'chat-message') {
                                    handleChatMessage(payload);
                                }
                                else {
                                    path = notificationToURL(payload);
                                    if (path === '/notifications') {
                                        resetToTab('NotificationsTab');
                                        notyLogger.debug("handlePushNotificationEntry: default navigate");
                                    }
                                    else if (path) {
                                        _a = router.matchPath(path), screen_1 = _a[0], params = _a[1];
                                        // @ts-expect-error nested navigators aren't typed -sfn
                                        navigate('HomeTab', { screen: screen_1, params: params });
                                        notyLogger.debug("handlePushNotificationEntry: navigate", {
                                            screen: screen_1,
                                            params: params,
                                        });
                                    }
                                }
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    var onNavigationReady = useCallOnce(function () {
        var currentScreen = getCurrentRouteName();
        setNavigationMetadata({
            previousScreen: currentScreen,
            currentScreen: currentScreen,
        });
        previousScreen.current = currentScreen;
        handlePushNotificationEntry();
        ax.metric('router:navigate', {});
        if (currentAccount && shouldRequestEmailConfirmation(currentAccount)) {
            emailDialogControl.open({
                id: EmailDialogScreenID.VerificationReminder,
            });
            snoozeEmailConfirmationPrompt();
        }
        ax.metric('init', {
            initMs: Math.round(
            // @ts-ignore Emitted by Metro in the bundle prelude
            performance.now() - global.__BUNDLE_START_TIME__),
        });
        if (IS_WEB) {
            var referrerInfo = Referrer.getReferrerInfo();
            if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
                ax.metric('deepLink:referrerReceived', {
                    to: window.location.href,
                    referrer: referrerInfo === null || referrerInfo === void 0 ? void 0 : referrerInfo.referrer,
                    hostname: referrerInfo === null || referrerInfo === void 0 ? void 0 : referrerInfo.hostname,
                });
            }
        }
    });
    return (_jsx(NavigationContainer, { ref: navigationRef, linking: LINKING, theme: theme, onStateChange: function () {
            var currentScreen = getCurrentRouteName();
            // do this before metric
            setNavigationMetadata({
                previousScreen: previousScreen.current,
                currentScreen: currentScreen,
            });
            ax.metric('router:navigate', { from: previousScreen.current });
            previousScreen.current = currentScreen;
        }, onReady: onNavigationReady, 
        // WARNING: Implicit navigation to nested navigators is depreciated in React Navigation 7.x
        // However, there's a fair amount of places we do that, especially in when popping to the top of stacks.
        // See BottomBar.tsx for an example of how to handle nested navigators in the tabs correctly.
        // I'm scared of missing a spot (esp. with push notifications etc) so let's enable this legacy behaviour for now.
        // We will need to confirm we handle nested navigators correctly by the time we migrate to React Navigation 8.x
        // -sfn
        navigationInChildEnabled: true, children: children }));
}
function getCurrentRouteName() {
    var _a;
    if (navigationRef.isReady()) {
        return (_a = navigationRef.getCurrentRoute()) === null || _a === void 0 ? void 0 : _a.name;
    }
    else {
        return undefined;
    }
}
/**
 * These helpers can be used from outside of the RoutesContainer
 * (eg in the state models).
 */
function navigate(name, params) {
    if (navigationRef.isReady()) {
        return Promise.race([
            new Promise(function (resolve) {
                var handler = function () {
                    resolve();
                    navigationRef.removeListener('state', handler);
                };
                navigationRef.addListener('state', handler);
                // @ts-ignore I dont know what would make typescript happy but I have a life -prf
                navigationRef.navigate(name, params);
            }),
            timeout(1e3),
        ]);
    }
    return Promise.resolve();
}
function resetToTab(tabName) {
    if (navigationRef.isReady()) {
        navigate(tabName);
        if (navigationRef.canGoBack()) {
            navigationRef.dispatch(StackActions.popToTop()); //we need to check .canGoBack() before calling it
        }
    }
}
// returns a promise that resolves after the state reset is complete
function reset() {
    if (navigationRef.isReady()) {
        navigationRef.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: IS_NATIVE ? 'HomeTab' : 'Home' }],
        }));
        return Promise.race([
            timeout(1e3),
            new Promise(function (resolve) {
                var handler = function () {
                    resolve();
                    navigationRef.removeListener('state', handler);
                };
                navigationRef.addListener('state', handler);
            }),
        ]);
    }
    else {
        return Promise.resolve();
    }
}
export { FlatNavigator, navigate, reset, resetToTab, RoutesContainer, TabsNavigator, };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37, templateObject_38, templateObject_39, templateObject_40, templateObject_41, templateObject_42, templateObject_43, templateObject_44, templateObject_45, templateObject_46, templateObject_47, templateObject_48, templateObject_49, templateObject_50, templateObject_51, templateObject_52, templateObject_53, templateObject_54, templateObject_55, templateObject_56, templateObject_57, templateObject_58, templateObject_59, templateObject_60, templateObject_61, templateObject_62, templateObject_63, templateObject_64, templateObject_65, templateObject_66, templateObject_67, templateObject_68, templateObject_69, templateObject_70, templateObject_71, templateObject_72, templateObject_73, templateObject_74, templateObject_75, templateObject_76, templateObject_77;
