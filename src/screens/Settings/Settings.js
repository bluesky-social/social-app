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
import { useState } from 'react';
import { Alert, LayoutAnimation, Linking, Pressable, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { moderateProfile } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { HELP_DESK_URL } from '#/lib/constants';
import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { useApplyPullRequestOTAUpdate } from '#/lib/hooks/useOTAUpdates';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import * as persisted from '#/state/persisted';
import { clearStorage } from '#/state/persisted';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useDeleteActorDeclaration } from '#/state/queries/messages/actor-declaration';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { useAgent } from '#/state/session';
import { useSession, useSessionApi } from '#/state/session';
import { useOnboardingDispatch } from '#/state/shell';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useCloseAllActiveElements } from '#/state/util';
import * as Toast from '#/view/com/util/Toast';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import * as SettingsList from '#/screens/Settings/components/SettingsList';
import { atoms as a, platform, tokens, useBreakpoints, useTheme } from '#/alf';
import { AgeAssuranceDismissibleNotice } from '#/components/ageAssurance/AgeAssuranceDismissibleNotice';
import { AvatarStackWithFetch } from '#/components/AvatarStack';
import { Button, ButtonText } from '#/components/Button';
import { useIsFindContactsFeatureEnabledBasedOnGeolocation } from '#/components/contacts/country-allowlist';
import { useDialogControl } from '#/components/Dialog';
import { SwitchAccountDialog } from '#/components/dialogs/SwitchAccount';
import { Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon } from '#/components/icons/Accessibility';
import { Bell_Stroke2_Corner0_Rounded as NotificationIcon } from '#/components/icons/Bell';
import { BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon } from '#/components/icons/BubbleInfo';
import { ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon } from '#/components/icons/Chevron';
import { CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon } from '#/components/icons/CircleQuestion';
import { CodeBrackets_Stroke2_Corner2_Rounded as CodeBracketsIcon } from '#/components/icons/CodeBrackets';
import { Contacts_Stroke2_Corner2_Rounded as ContactsIcon } from '#/components/icons/Contacts';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Lock_Stroke2_Corner2_Rounded as LockIcon } from '#/components/icons/Lock';
import { PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon } from '#/components/icons/PaintRoller';
import { Person_Stroke2_Corner2_Rounded as PersonIcon, PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon, PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon, PersonX_Stroke2_Corner0_Rounded as PersonXIcon, } from '#/components/icons/Person';
import { RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon } from '#/components/icons/RaisingHand';
import { Window_Stroke2_Corner2_Rounded as WindowIcon } from '#/components/icons/Window';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
import * as Menu from '#/components/Menu';
import { ID as PolicyUpdate202508 } from '#/components/PolicyUpdateOverlay/updates/202508/config';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { useFullVerificationState } from '#/components/verification';
import { shouldShowVerificationCheckButton, VerificationCheckButton, } from '#/components/verification/VerificationCheckButton';
import { useAnalytics } from '#/analytics';
import { IS_INTERNAL, IS_IOS, IS_NATIVE } from '#/env';
import { useActorStatus } from '#/features/liveNow';
import { device, useStorage } from '#/storage';
import { useActivitySubscriptionsNudged } from '#/storage/hooks/activity-subscriptions-nudged';
export function SettingsScreen(_a) {
    var ax = useAnalytics();
    var _ = useLingui()._;
    var reducedMotion = useReducedMotion();
    var logoutEveryAccount = useSessionApi().logoutEveryAccount;
    var _b = useSession(), accounts = _b.accounts, currentAccount = _b.currentAccount;
    var switchAccountControl = useDialogControl();
    var signOutPromptControl = Prompt.usePromptControl();
    var profile = useProfileQuery({ did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did }).data;
    var otherProfiles = useProfilesQuery({
        handles: accounts
            .filter(function (acc) { return acc.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); })
            .map(function (acc) { return acc.handle; }),
    }).data;
    var _c = useAccountSwitcher(), pendingDid = _c.pendingDid, onPressSwitchAccount = _c.onPressSwitchAccount;
    var _d = useState(false), showAccounts = _d[0], setShowAccounts = _d[1];
    var _e = useState(false), showDevOptions = _e[0], setShowDevOptions = _e[1];
    var findContactsEnabled = useIsFindContactsFeatureEnabledBasedOnGeolocation();
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Settings" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsx(AgeAssuranceDismissibleNotice, { style: [a.px_lg, a.pt_xs, a.pb_xl] }), _jsx(View, { style: [
                                a.px_xl,
                                a.pt_md,
                                a.pb_md,
                                a.w_full,
                                a.gap_2xs,
                                a.align_center,
                                { minHeight: 160 },
                            ], children: profile && _jsx(ProfilePreview, { profile: profile }) }), accounts.length > 1 ? (_jsxs(_Fragment, { children: [_jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Switch account"], ["Switch account"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Shows other accounts you can switch to"], ["Shows other accounts you can switch to"])))), onPress: function () {
                                        if (!reducedMotion) {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        }
                                        setShowAccounts(function (s) { return !s; });
                                    }, children: [_jsx(SettingsList.ItemIcon, { icon: PersonGroupIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Switch account" }) }), showAccounts ? (_jsx(SettingsList.ItemIcon, { icon: ChevronUpIcon, size: "md" })) : (_jsx(AvatarStackWithFetch, { profiles: accounts
                                                .map(function (acc) { return acc.did; })
                                                .filter(function (did) { return did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); })
                                                .slice(0, 5) }))] }), showAccounts && (_jsxs(_Fragment, { children: [_jsx(SettingsList.Divider, {}), accounts
                                            .filter(function (acc) { return acc.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); })
                                            .map(function (account) {
                                            var _a;
                                            return (_jsx(AccountRow, { account: account, profile: (_a = otherProfiles === null || otherProfiles === void 0 ? void 0 : otherProfiles.profiles) === null || _a === void 0 ? void 0 : _a.find(function (p) { return p.did === account.did; }), pendingDid: pendingDid, onPressSwitchAccount: onPressSwitchAccount }, account.did));
                                        }), _jsx(AddAccountRow, {})] }))] })) : (_jsx(AddAccountRow, {})), _jsx(SettingsList.Divider, {}), _jsxs(SettingsList.LinkItem, { to: "/settings/account", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Account"], ["Account"])))), children: [_jsx(SettingsList.ItemIcon, { icon: PersonIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Account" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/privacy-and-security", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Privacy and security"], ["Privacy and security"])))), children: [_jsx(SettingsList.ItemIcon, { icon: LockIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Privacy and security" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/moderation", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Moderation"], ["Moderation"])))), children: [_jsx(SettingsList.ItemIcon, { icon: HandIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Moderation" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/notifications", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Notifications"], ["Notifications"])))), children: [_jsx(SettingsList.ItemIcon, { icon: NotificationIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Notifications" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/content-and-media", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Content and media"], ["Content and media"])))), children: [_jsx(SettingsList.ItemIcon, { icon: WindowIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Content and media" }) })] }), IS_NATIVE &&
                            findContactsEnabled &&
                            !ax.features.enabled(ax.features.ImportContactsSettingsDisable) && (_jsxs(SettingsList.LinkItem, { to: "/settings/find-contacts", label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Find friends from contacts"], ["Find friends from contacts"])))), children: [_jsx(SettingsList.ItemIcon, { icon: ContactsIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Find friends from contacts" }) })] })), _jsxs(SettingsList.LinkItem, { to: "/settings/appearance", label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Appearance"], ["Appearance"])))), children: [_jsx(SettingsList.ItemIcon, { icon: PaintRollerIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Appearance" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/accessibility", label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Accessibility"], ["Accessibility"])))), children: [_jsx(SettingsList.ItemIcon, { icon: AccessibilityIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Accessibility" }) })] }), _jsxs(SettingsList.LinkItem, { to: "/settings/language", label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Languages"], ["Languages"])))), children: [_jsx(SettingsList.ItemIcon, { icon: EarthIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Languages" }) })] }), _jsxs(SettingsList.PressableItem, { onPress: function () { return Linking.openURL(HELP_DESK_URL); }, label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Help"], ["Help"])))), accessibilityHint: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Opens helpdesk in browser"], ["Opens helpdesk in browser"])))), children: [_jsx(SettingsList.ItemIcon, { icon: CircleQuestionIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Help" }) }), _jsx(SettingsList.Chevron, {})] }), _jsxs(SettingsList.LinkItem, { to: "/settings/about", label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["About"], ["About"])))), children: [_jsx(SettingsList.ItemIcon, { icon: BubbleInfoIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "About" }) })] }), _jsx(SettingsList.Divider, {}), _jsx(SettingsList.PressableItem, { destructive: true, onPress: function () { return signOutPromptControl.open(); }, label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Sign out"], ["Sign out"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Sign out" }) }) }), IS_INTERNAL && (_jsxs(_Fragment, { children: [_jsx(SettingsList.Divider, {}), _jsxs(SettingsList.PressableItem, { onPress: function () {
                                        if (!reducedMotion) {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        }
                                        setShowDevOptions(function (d) { return !d; });
                                    }, label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Developer options"], ["Developer options"])))), children: [_jsx(SettingsList.ItemIcon, { icon: CodeBracketsIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Developer options" }) })] }), showDevOptions && _jsx(DevOptions, {})] }))] }) }), _jsx(Prompt.Basic, { control: signOutPromptControl, title: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Sign out?"], ["Sign out?"])))), description: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["You will be signed out of all your accounts."], ["You will be signed out of all your accounts."])))), onConfirm: function () { return logoutEveryAccount('Settings'); }, confirmButtonCta: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Sign out"], ["Sign out"])))), cancelButtonCta: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Cancel"], ["Cancel"])))), confirmButtonColor: "negative" }), _jsx(SwitchAccountDialog, { control: switchAccountControl })] }));
}
function ProfilePreview(_a) {
    var _b;
    var profile = _a.profile;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var shadow = useProfileShadow(profile);
    var moderationOpts = useModerationOpts();
    var verificationState = useFullVerificationState({
        profile: shadow,
    });
    var live = useActorStatus(profile).isActive;
    if (!moderationOpts)
        return null;
    var moderation = moderateProfile(profile, moderationOpts);
    var displayName = sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle), moderation.ui('displayName'));
    return (_jsxs(_Fragment, { children: [_jsx(UserAvatar, { size: 80, avatar: shadow.avatar, moderation: moderation.ui('avatar'), type: ((_b = shadow.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', live: live }), _jsxs(View, { style: [
                    a.flex_row,
                    a.gap_xs,
                    a.align_center,
                    a.justify_center,
                    a.w_full,
                ], children: [_jsx(Text, { emoji: true, testID: "profileHeaderDisplayName", numberOfLines: 1, style: [
                            a.pt_sm,
                            t.atoms.text,
                            gtMobile ? a.text_4xl : a.text_3xl,
                            a.font_bold,
                        ], children: displayName }), shouldShowVerificationCheckButton(verificationState) && (_jsx(View, { style: [
                            {
                                marginTop: platform({ web: 8, ios: 8, android: 10 }),
                            },
                        ], children: _jsx(VerificationCheckButton, { profile: shadow, size: "lg" }) }))] }), _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_medium], children: sanitizeHandle(profile.handle, '@') })] }));
}
function DevOptions() {
    var _this = this;
    var _ = useLingui()._;
    var agent = useAgent();
    var _a = useStorage(device, [
        'policyUpdateDebugOverride',
    ]), override = _a[0], setOverride = _a[1];
    var onboardingDispatch = useOnboardingDispatch();
    var navigation = useNavigation();
    var deleteChatDeclarationRecord = useDeleteActorDeclaration().mutate;
    var _b = useApplyPullRequestOTAUpdate(), tryApplyUpdate = _b.tryApplyUpdate, revertToEmbedded = _b.revertToEmbedded, isCurrentlyRunningPullRequestDeployment = _b.isCurrentlyRunningPullRequestDeployment, currentChannel = _b.currentChannel;
    var _c = useActivitySubscriptionsNudged(), actyNotifNudged = _c[0], setActyNotifNudged = _c[1];
    var resetOnboarding = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            navigation.navigate('Home');
            onboardingDispatch({ type: 'start' });
            Toast.show(_(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Onboarding reset"], ["Onboarding reset"])))));
            return [2 /*return*/];
        });
    }); };
    var clearAllStorage = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, clearStorage()];
                case 1:
                    _a.sent();
                    Toast.show(_(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Storage cleared, you need to restart the app now."], ["Storage cleared, you need to restart the app now."])))));
                    return [2 /*return*/];
            }
        });
    }); };
    var onPressUnsnoozeReminder = function () {
        var lastEmailConfirm = new Date();
        // wind back 3 days
        lastEmailConfirm.setDate(lastEmailConfirm.getDate() - 3);
        persisted.write('reminders', __assign(__assign({}, persisted.get('reminders')), { lastEmailConfirm: lastEmailConfirm.toISOString() }));
        Toast.show(_(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["You probably want to restart the app now."], ["You probably want to restart the app now."])))));
    };
    var onPressActySubsUnNudge = function () {
        setActyNotifNudged(false);
    };
    var onPressApplyOta = function () {
        Alert.prompt('Apply OTA', 'Enter the channel for the OTA you wish to apply.', [
            {
                style: 'cancel',
                text: 'Cancel',
            },
            {
                style: 'default',
                text: 'Apply',
                onPress: function (channel) {
                    tryApplyUpdate(channel !== null && channel !== void 0 ? channel : '');
                },
            },
        ], 'plain-text', isCurrentlyRunningPullRequestDeployment
            ? currentChannel
            : 'pull-request-');
    };
    return (_jsxs(_Fragment, { children: [_jsx(SettingsList.PressableItem, { onPress: function () { return navigation.navigate('Log'); }, label: _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Open system log"], ["Open system log"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "System log" }) }) }), _jsx(SettingsList.PressableItem, { onPress: function () { return navigation.navigate('Debug'); }, label: _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Open storybook page"], ["Open storybook page"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Storybook" }) }) }), _jsx(SettingsList.PressableItem, { onPress: function () { return navigation.navigate('DebugMod'); }, label: _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Open moderation debug page"], ["Open moderation debug page"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Debug Moderation" }) }) }), _jsx(SettingsList.PressableItem, { onPress: function () { return deleteChatDeclarationRecord(); }, label: _(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Open storybook page"], ["Open storybook page"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Delete chat declaration record" }) }) }), _jsx(SettingsList.PressableItem, { onPress: function () { return resetOnboarding(); }, label: _(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Reset onboarding state"], ["Reset onboarding state"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Reset onboarding state" }) }) }), _jsx(SettingsList.PressableItem, { onPress: onPressUnsnoozeReminder, label: _(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["Unsnooze email reminder"], ["Unsnooze email reminder"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Unsnooze email reminder" }) }) }), actyNotifNudged && (_jsx(SettingsList.PressableItem, { onPress: onPressActySubsUnNudge, label: _(msg(templateObject_30 || (templateObject_30 = __makeTemplateObject(["Reset activity subscription nudge"], ["Reset activity subscription nudge"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Reset activity subscription nudge" }) }) })), _jsx(SettingsList.PressableItem, { onPress: function () { return clearAllStorage(); }, label: _(msg(templateObject_31 || (templateObject_31 = __makeTemplateObject(["Clear all storage data"], ["Clear all storage data"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Clear all storage data (restart after this)" }) }) }), IS_IOS ? (_jsx(SettingsList.PressableItem, { onPress: onPressApplyOta, label: _(msg(templateObject_32 || (templateObject_32 = __makeTemplateObject(["Apply Pull Request"], ["Apply Pull Request"])))), children: _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Apply Pull Request" }) }) })) : null, IS_NATIVE && isCurrentlyRunningPullRequestDeployment ? (_jsx(SettingsList.PressableItem, { onPress: revertToEmbedded, label: _(msg(templateObject_33 || (templateObject_33 = __makeTemplateObject(["Unapply Pull Request"], ["Unapply Pull Request"])))), children: _jsx(SettingsList.ItemText, { children: _jsxs(Trans, { children: ["Unapply Pull Request ", currentChannel] }) }) })) : null, _jsx(SettingsList.Divider, {}), _jsxs(View, { style: [a.p_xl, a.gap_md], children: [_jsx(Text, { style: [a.text_lg, a.font_semi_bold], children: "PolicyUpdate202508 Debug" }), _jsxs(View, { style: [a.flex_row, a.align_center, a.justify_between, a.gap_md], children: [_jsx(Button, { onPress: function () {
                                    setOverride(!override);
                                }, label: "Toggle", color: override ? 'primary' : 'secondary', size: "small", style: [a.flex_1], children: _jsx(ButtonText, { children: override ? 'Disable debug mode' : 'Enable debug mode' }) }), _jsx(Button, { onPress: function () {
                                    device.set([PolicyUpdate202508], false);
                                    agent.bskyAppRemoveNuxs([PolicyUpdate202508]);
                                    Toast.show("Done", 'info');
                                }, label: "Reset policy update nux", color: "secondary", size: "small", disabled: !override, children: _jsx(ButtonText, { children: "Reset state" }) })] })] }), _jsx(SettingsList.Divider, {})] }));
}
function AddAccountRow() {
    var _ = useLingui()._;
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var closeEverything = useCloseAllActiveElements();
    var onAddAnotherAccount = function () {
        setShowLoggedOut(true);
        closeEverything();
    };
    return (_jsxs(SettingsList.PressableItem, { onPress: onAddAnotherAccount, label: _(msg(templateObject_34 || (templateObject_34 = __makeTemplateObject(["Add another account"], ["Add another account"])))), children: [_jsx(SettingsList.ItemIcon, { icon: PersonPlusIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Add another account" }) })] }));
}
function AccountRow(_a) {
    var _b;
    var profile = _a.profile, account = _a.account, pendingDid = _a.pendingDid, onPressSwitchAccount = _a.onPressSwitchAccount;
    var _ = useLingui()._;
    var t = useTheme();
    var moderationOpts = useModerationOpts();
    var removePromptControl = Prompt.usePromptControl();
    var removeAccount = useSessionApi().removeAccount;
    var live = useActorStatus(profile).isActive;
    var onSwitchAccount = function () {
        if (pendingDid)
            return;
        onPressSwitchAccount(account, 'Settings');
    };
    return (_jsxs(View, { style: [a.relative], children: [_jsxs(SettingsList.PressableItem, { onPress: onSwitchAccount, label: _(msg(templateObject_35 || (templateObject_35 = __makeTemplateObject(["Switch account"], ["Switch account"])))), children: [moderationOpts && profile ? (_jsx(UserAvatar, { size: 28, avatar: profile.avatar, moderation: moderateProfile(profile, moderationOpts).ui('avatar'), type: ((_b = profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', live: live, hideLiveBadge: true })) : (_jsx(View, { style: [{ width: 28 }] })), _jsx(SettingsList.ItemText, { numberOfLines: 1, style: [a.pr_2xl, a.leading_snug], children: sanitizeHandle(account.handle, '@') }), pendingDid === account.did && _jsx(SettingsList.ItemIcon, { icon: Loader })] }), !pendingDid && (_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_36 || (templateObject_36 = __makeTemplateObject(["Account options"], ["Account options"])))), children: function (_a) {
                            var props = _a.props, state = _a.state;
                            return (_jsx(Pressable, __assign({}, props, { style: [
                                    a.absolute,
                                    { top: 10, right: tokens.space.lg },
                                    a.p_xs,
                                    a.rounded_full,
                                    (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                                ], children: _jsx(DotsHorizontal, { size: "md", style: t.atoms.text }) })));
                        } }), _jsx(Menu.Outer, { showCancel: true, children: _jsxs(Menu.Item, { label: _(msg(templateObject_37 || (templateObject_37 = __makeTemplateObject(["Remove account"], ["Remove account"])))), onPress: function () { return removePromptControl.open(); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Remove account" }) }), _jsx(Menu.ItemIcon, { icon: PersonXIcon })] }) })] })), _jsx(Prompt.Basic, { control: removePromptControl, title: _(msg(templateObject_38 || (templateObject_38 = __makeTemplateObject(["Remove from quick access?"], ["Remove from quick access?"])))), description: _(msg(templateObject_39 || (templateObject_39 = __makeTemplateObject(["This will remove @", " from the quick access list."], ["This will remove @", " from the quick access list."])), account.handle)), onConfirm: function () {
                    removeAccount(account);
                    Toast.show(_(msg(templateObject_40 || (templateObject_40 = __makeTemplateObject(["Account removed from quick access"], ["Account removed from quick access"])))));
                }, confirmButtonCta: _(msg(templateObject_41 || (templateObject_41 = __makeTemplateObject(["Remove"], ["Remove"])))), confirmButtonColor: "negative" })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37, templateObject_38, templateObject_39, templateObject_40, templateObject_41;
