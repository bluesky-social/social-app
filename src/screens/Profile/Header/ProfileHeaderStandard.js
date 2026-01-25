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
import { memo, useMemo, useState } from 'react';
import { View } from 'react-native';
import { moderateProfile, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useActorStatus } from '#/lib/actor-status';
import { useHaptics } from '#/lib/haptics';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileBlockMutationQueue, useProfileFollowMutationQueue, } from '#/state/queries/profile';
import { useRequireAuth, useSession } from '#/state/session';
import { ProfileMenu } from '#/view/com/profile/ProfileMenu';
import { atoms as a, platform, useBreakpoints, useTheme } from '#/alf';
import { SubscribeProfileButton } from '#/components/activity-notifications/SubscribeProfileButton';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { useDialogControl } from '#/components/Dialog';
import { MessageProfileButton } from '#/components/dms/MessageProfileButton';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { KnownFollowers, shouldShowKnownFollowers, } from '#/components/KnownFollowers';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { VerificationCheckButton } from '#/components/verification/VerificationCheckButton';
import { IS_IOS } from '#/env';
import { EditProfileDialog } from './EditProfileDialog';
import { ProfileHeaderHandle } from './Handle';
import { ProfileHeaderMetrics } from './Metrics';
import { ProfileHeaderShell } from './Shell';
import { AnimatedProfileHeaderSuggestedFollows } from './SuggestedFollows';
var ProfileHeaderStandard = function (_a) {
    var _b, _c, _d, _e, _f;
    var profileUnshadowed = _a.profile, descriptionRT = _a.descriptionRT, moderationOpts = _a.moderationOpts, _g = _a.hideBackButton, hideBackButton = _g === void 0 ? false : _g, isPlaceholderProfile = _a.isPlaceholderProfile;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var profile = useProfileShadow(profileUnshadowed);
    var currentAccount = useSession().currentAccount;
    var _ = useLingui()._;
    var moderation = useMemo(function () { return moderateProfile(profile, moderationOpts); }, [profile, moderationOpts]);
    var _h = useProfileBlockMutationQueue(profile), queueUnblock = _h[1];
    var unblockPromptControl = Prompt.usePromptControl();
    var _j = useState(false), showSuggestedFollows = _j[0], setShowSuggestedFollows = _j[1];
    var isBlockedUser = ((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.blocking) ||
        ((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.blockedBy) ||
        ((_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.blockingByList);
    var unblockAccount = function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, queueUnblock()];
                case 1:
                    _a.sent();
                    Toast.show(_(msg({ message: 'Account unblocked', context: 'toast' })));
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    if ((e_1 === null || e_1 === void 0 ? void 0 : e_1.name) !== 'AbortError') {
                        logger.error('Failed to unblock account', { message: e_1 });
                        Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_1.toString())), { type: 'error' });
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var isMe = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did;
    var live = useActorStatus(profile).isActive;
    return (_jsxs(_Fragment, { children: [_jsxs(ProfileHeaderShell, { profile: profile, moderation: moderation, hideBackButton: hideBackButton, isPlaceholderProfile: isPlaceholderProfile, children: [_jsxs(View, { style: [a.px_lg, a.pt_md, a.pb_sm, a.overflow_hidden], pointerEvents: IS_IOS ? 'auto' : 'box-none', children: [_jsx(View, { style: [
                                    { paddingLeft: 90 },
                                    a.flex_row,
                                    a.align_center,
                                    a.justify_end,
                                    a.gap_xs,
                                    a.pb_sm,
                                    a.flex_wrap,
                                ], pointerEvents: IS_IOS ? 'auto' : 'box-none', children: _jsx(HeaderStandardButtons, { profile: profile, moderation: moderation, moderationOpts: moderationOpts, onFollow: function () { return setShowSuggestedFollows(true); }, onUnfollow: function () { return setShowSuggestedFollows(false); } }) }), _jsxs(View, { style: [a.flex_col, a.gap_xs, a.pb_sm, live ? a.pt_sm : a.pt_2xs], children: [_jsx(View, { style: [a.flex_row, a.align_center, a.gap_xs, a.flex_1], children: _jsxs(Text, { emoji: true, testID: "profileHeaderDisplayName", style: [
                                                t.atoms.text,
                                                gtMobile ? a.text_4xl : a.text_3xl,
                                                a.self_start,
                                                a.font_bold,
                                                a.leading_tight,
                                            ], children: [sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle), moderation.ui('displayName')), _jsx(View, { style: [a.pl_xs, { marginTop: platform({ ios: 2 }) }], children: _jsx(VerificationCheckButton, { profile: profile, size: "lg" }) })] }) }), _jsx(ProfileHeaderHandle, { profile: profile })] }), !isPlaceholderProfile && !isBlockedUser && (_jsxs(View, { style: a.gap_md, children: [_jsx(ProfileHeaderMetrics, { profile: profile }), descriptionRT && !moderation.ui('profileView').blur ? (_jsx(View, { pointerEvents: "auto", children: _jsx(RichText, { testID: "profileHeaderDescription", style: [a.text_md], numberOfLines: 15, value: descriptionRT, enableTags: true, authorHandle: profile.handle }) })) : undefined, !isMe &&
                                        !isBlockedUser &&
                                        shouldShowKnownFollowers((_e = profile.viewer) === null || _e === void 0 ? void 0 : _e.knownFollowers) && (_jsx(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: _jsx(KnownFollowers, { profile: profile, moderationOpts: moderationOpts }) }))] })), _jsx(DebugFieldDisplay, { subject: profile })] }), _jsx(Prompt.Basic, { control: unblockPromptControl, title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Unblock Account?"], ["Unblock Account?"])))), description: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["The account will be able to interact with you after unblocking."], ["The account will be able to interact with you after unblocking."])))), onConfirm: unblockAccount, confirmButtonCta: ((_f = profile.viewer) === null || _f === void 0 ? void 0 : _f.blocking) ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Unblock"], ["Unblock"])))) : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Block"], ["Block"])))), confirmButtonColor: "negative" })] }), _jsx(AnimatedProfileHeaderSuggestedFollows, { isExpanded: showSuggestedFollows, actorDid: profile.did })] }));
};
ProfileHeaderStandard = memo(ProfileHeaderStandard);
export { ProfileHeaderStandard };
export function HeaderStandardButtons(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var profile = _a.profile, moderation = _a.moderation, moderationOpts = _a.moderationOpts, onFollow = _a.onFollow, onUnfollow = _a.onUnfollow, minimal = _a.minimal;
    var _ = useLingui()._;
    var _p = useSession(), hasSession = _p.hasSession, currentAccount = _p.currentAccount;
    var playHaptic = useHaptics();
    var requireAuth = useRequireAuth();
    var _q = useProfileFollowMutationQueue(profile, 'ProfileHeader'), queueFollow = _q[0], queueUnfollow = _q[1];
    var _r = useProfileBlockMutationQueue(profile), queueUnblock = _r[1];
    var editProfileControl = useDialogControl();
    var unblockPromptControl = Prompt.usePromptControl();
    var isMe = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did;
    var onPressFollow = function () {
        playHaptic();
        requireAuth(function () { return __awaiter(_this, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, queueFollow()];
                    case 1:
                        _a.sent();
                        onFollow === null || onFollow === void 0 ? void 0 : onFollow();
                        Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Following ", ""], ["Following ", ""])), sanitizeDisplayName(profile.displayName || profile.handle, moderation.ui('displayName')))));
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        if ((e_2 === null || e_2 === void 0 ? void 0 : e_2.name) !== 'AbortError') {
                            logger.error('Failed to follow', { message: String(e_2) });
                            Toast.show(_(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_2.toString())), {
                                type: 'error',
                            });
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    var onPressUnfollow = function () {
        playHaptic();
        requireAuth(function () { return __awaiter(_this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, queueUnfollow()];
                    case 1:
                        _a.sent();
                        onUnfollow === null || onUnfollow === void 0 ? void 0 : onUnfollow();
                        Toast.show(_(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["No longer following ", ""], ["No longer following ", ""])), sanitizeDisplayName(profile.displayName || profile.handle, moderation.ui('displayName')))), { type: 'default' });
                        return [3 /*break*/, 3];
                    case 2:
                        e_3 = _a.sent();
                        if ((e_3 === null || e_3 === void 0 ? void 0 : e_3.name) !== 'AbortError') {
                            logger.error('Failed to unfollow', { message: String(e_3) });
                            Toast.show(_(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_3.toString())), {
                                type: 'error',
                            });
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    var unblockAccount = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, queueUnblock()];
                case 1:
                    _a.sent();
                    Toast.show(_(msg({ message: 'Account unblocked', context: 'toast' })));
                    return [3 /*break*/, 3];
                case 2:
                    e_4 = _a.sent();
                    if ((e_4 === null || e_4 === void 0 ? void 0 : e_4.name) !== 'AbortError') {
                        logger.error('Failed to unblock account', { message: e_4 });
                        Toast.show(_(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_4.toString())), { type: 'error' });
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var subscriptionsAllowed = useMemo(function () {
        var _a, _b, _c, _d;
        switch ((_b = (_a = profile.associated) === null || _a === void 0 ? void 0 : _a.activitySubscription) === null || _b === void 0 ? void 0 : _b.allowSubscriptions) {
            case 'followers':
            case undefined:
                return !!((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.following);
            case 'mutuals':
                return !!((_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.following) && !!profile.viewer.followedBy;
            case 'none':
            default:
                return false;
        }
    }, [profile]);
    return (_jsxs(_Fragment, { children: [isMe ? (_jsxs(_Fragment, { children: [_jsx(Button, { testID: "profileHeaderEditProfileButton", size: "small", color: "secondary", onPress: editProfileControl.open, label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Edit profile"], ["Edit profile"])))), children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Edit Profile" }) }) }), _jsx(EditProfileDialog, { profile: profile, control: editProfileControl })] })) : ((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.blocking) ? (((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.blockingByList) ? null : (_jsx(Button, { testID: "unblockBtn", size: "small", color: "secondary", label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Unblock"], ["Unblock"])))), disabled: !hasSession, onPress: function () { return unblockPromptControl.open(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { context: "action", children: "Unblock" }) }) }))) : !((_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.blockedBy) ? (_jsxs(_Fragment, { children: [hasSession && (!minimal || ((_e = profile.viewer) === null || _e === void 0 ? void 0 : _e.following)) && (_jsxs(_Fragment, { children: [subscriptionsAllowed && (_jsx(SubscribeProfileButton, { profile: profile, moderationOpts: moderationOpts, disableHint: minimal })), _jsx(MessageProfileButton, { profile: profile })] })), (!minimal || !((_f = profile.viewer) === null || _f === void 0 ? void 0 : _f.following)) && (_jsxs(Button, { testID: ((_g = profile.viewer) === null || _g === void 0 ? void 0 : _g.following) ? 'unfollowBtn' : 'followBtn', size: "small", color: ((_h = profile.viewer) === null || _h === void 0 ? void 0 : _h.following) ? 'secondary' : 'primary', label: ((_j = profile.viewer) === null || _j === void 0 ? void 0 : _j.following)
                            ? _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Unfollow ", ""], ["Unfollow ", ""])), profile.handle))
                            : _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Follow ", ""], ["Follow ", ""])), profile.handle)), onPress: ((_k = profile.viewer) === null || _k === void 0 ? void 0 : _k.following) ? onPressUnfollow : onPressFollow, children: [!((_l = profile.viewer) === null || _l === void 0 ? void 0 : _l.following) && _jsx(ButtonIcon, { icon: Plus }), _jsx(ButtonText, { children: ((_m = profile.viewer) === null || _m === void 0 ? void 0 : _m.following) ? (_jsx(Trans, { children: "Following" })) : ((_o = profile.viewer) === null || _o === void 0 ? void 0 : _o.followedBy) ? (_jsx(Trans, { children: "Follow back" })) : (_jsx(Trans, { children: "Follow" })) })] }))] })) : null, _jsx(ProfileMenu, { profile: profile }), _jsx(Prompt.Basic, { control: unblockPromptControl, title: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Unblock Account?"], ["Unblock Account?"])))), description: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["The account will be able to interact with you after unblocking."], ["The account will be able to interact with you after unblocking."])))), onConfirm: unblockAccount, confirmButtonCta: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Unblock"], ["Unblock"])))), confirmButtonColor: "negative" })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17;
