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
import { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { moderateProfile, } from '@atproto/api';
import { msg, Plural, plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useHaptics } from '#/lib/haptics';
import { isAppLabeler } from '#/lib/moderation';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useLabelerSubscriptionMutation } from '#/state/queries/labeler';
import { useLikeMutation, useUnlikeMutation } from '#/state/queries/like';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useRequireAuth, useSession } from '#/state/session';
import { ProfileMenu } from '#/view/com/profile/ProfileMenu';
import { atoms as a, tokens, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled, Heart2_Stroke2_Corner0_Rounded as Heart, } from '#/components/icons/Heart2';
import { Link } from '#/components/Link';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_IOS } from '#/env';
import { ProfileHeaderDisplayName } from './DisplayName';
import { EditProfileDialog } from './EditProfileDialog';
import { ProfileHeaderHandle } from './Handle';
import { ProfileHeaderMetrics } from './Metrics';
import { ProfileHeaderShell } from './Shell';
var ProfileHeaderLabeler = function (_a) {
    var _b;
    var profileUnshadowed = _a.profile, labeler = _a.labeler, descriptionRT = _a.descriptionRT, moderationOpts = _a.moderationOpts, _c = _a.hideBackButton, hideBackButton = _c === void 0 ? false : _c, isPlaceholderProfile = _a.isPlaceholderProfile;
    var profile = useProfileShadow(profileUnshadowed);
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var _d = useSession(), currentAccount = _d.currentAccount, hasSession = _d.hasSession;
    var playHaptic = useHaptics();
    var isSelf = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did;
    var moderation = useMemo(function () { return moderateProfile(profile, moderationOpts); }, [profile, moderationOpts]);
    var _e = useLikeMutation(), likeMod = _e.mutateAsync, isLikePending = _e.isPending;
    var _f = useUnlikeMutation(), unlikeMod = _f.mutateAsync, isUnlikePending = _f.isPending;
    var _g = useState(((_b = labeler.viewer) === null || _b === void 0 ? void 0 : _b.like) || ''), likeUri = _g[0], setLikeUri = _g[1];
    var _h = useState(labeler.likeCount || 0), likeCount = _h[0], setLikeCount = _h[1];
    var onToggleLiked = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!labeler) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    playHaptic();
                    if (!likeUri) return [3 /*break*/, 3];
                    return [4 /*yield*/, unlikeMod({ uri: likeUri })];
                case 2:
                    _a.sent();
                    setLikeCount(function (c) { return c - 1; });
                    setLikeUri('');
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, likeMod({ uri: labeler.uri, cid: labeler.cid })];
                case 4:
                    res = _a.sent();
                    setLikeCount(function (c) { return c + 1; });
                    setLikeUri(res.uri);
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue contacting the server, please check your internet connection and try again."], ["There was an issue contacting the server, please check your internet connection and try again."])))), { type: 'error' });
                    ax.logger.error("Failed to toggle labeler like", { message: e_1.message });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [ax, labeler, playHaptic, likeUri, unlikeMod, likeMod, _]);
    return (_jsx(ProfileHeaderShell, { profile: profile, moderation: moderation, hideBackButton: hideBackButton, isPlaceholderProfile: isPlaceholderProfile, children: _jsxs(View, { style: [a.px_lg, a.pt_md, a.pb_sm], pointerEvents: IS_IOS ? 'auto' : 'box-none', children: [_jsx(View, { style: [a.flex_row, a.justify_end, a.align_center, a.gap_xs, a.pb_lg], pointerEvents: IS_IOS ? 'auto' : 'box-none', children: _jsx(HeaderLabelerButtons, { profile: profile }) }), _jsxs(View, { style: [a.flex_col, a.gap_2xs, a.pt_2xs, a.pb_md], children: [_jsx(ProfileHeaderDisplayName, { profile: profile, moderation: moderation }), _jsx(ProfileHeaderHandle, { profile: profile })] }), !isPlaceholderProfile && (_jsxs(_Fragment, { children: [isSelf && _jsx(ProfileHeaderMetrics, { profile: profile }), descriptionRT && !moderation.ui('profileView').blur ? (_jsx(View, { pointerEvents: "auto", children: _jsx(RichText, { testID: "profileHeaderDescription", style: [a.text_md], numberOfLines: 15, value: descriptionRT, enableTags: true, authorHandle: profile.handle }) })) : undefined, !isAppLabeler(profile.did) && (_jsxs(View, { style: [a.flex_row, a.gap_xs, a.align_center, a.pt_lg], children: [_jsx(Button, { testID: "toggleLikeBtn", size: "small", color: "secondary", shape: "round", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Like this labeler"], ["Like this labeler"])))), disabled: !hasSession || isLikePending || isUnlikePending, onPress: onToggleLiked, children: likeUri ? (_jsx(HeartFilled, { fill: t.palette.negative_400 })) : (_jsx(Heart, { fill: t.atoms.text_contrast_medium.color })) }), typeof likeCount === 'number' && (_jsx(Link, { to: {
                                        screen: 'ProfileLabelerLikedBy',
                                        params: {
                                            name: labeler.creator.handle || labeler.creator.did,
                                        },
                                    }, size: "tiny", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Liked by ", ""], ["Liked by ", ""])), plural(likeCount, {
                                        one: '# user',
                                        other: '# users',
                                    }))), children: function (_a) {
                                        var hovered = _a.hovered, focused = _a.focused, pressed = _a.pressed;
                                        return (_jsx(Text, { style: [
                                                a.font_semi_bold,
                                                a.text_sm,
                                                t.atoms.text_contrast_medium,
                                                (hovered || focused || pressed) &&
                                                    t.atoms.text_contrast_high,
                                            ], children: _jsxs(Trans, { children: ["Liked by", ' ', _jsx(Plural, { value: likeCount, one: "# user", other: "# users" })] }) }));
                                    } }))] }))] }))] }) }));
};
ProfileHeaderLabeler = memo(ProfileHeaderLabeler);
export { ProfileHeaderLabeler };
/**
 * Keep this in sync with the value of {@link MAX_LABELERS}
 */
function CantSubscribePrompt(_a) {
    var control = _a.control;
    var _ = useLingui()._;
    return (_jsxs(Prompt.Outer, { control: control, children: [_jsx(Prompt.TitleText, { children: "Unable to subscribe" }), _jsx(Prompt.DescriptionText, { children: _jsx(Trans, { children: "We're sorry! You can only subscribe to twenty labelers, and you've reached your limit of twenty." }) }), _jsx(Prompt.Actions, { children: _jsx(Prompt.Action, { onPress: function () { return control.close(); }, cta: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["OK"], ["OK"])))) }) })] }));
}
export function HeaderLabelerButtons(_a) {
    var _this = this;
    var _b;
    var profile = _a.profile, _c = _a.minimal, minimal = _c === void 0 ? false : _c;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var requireAuth = useRequireAuth();
    var playHaptic = useHaptics();
    var editProfileControl = useDialogControl();
    var preferences = usePreferencesQuery().data;
    var _d = useLabelerSubscriptionMutation(), toggleSubscription = _d.mutateAsync, variables = _d.variables, reset = _d.reset;
    var isSubscribed = (_b = variables === null || variables === void 0 ? void 0 : variables.subscribe) !== null && _b !== void 0 ? _b : preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs.labelers.find(function (l) { return l.did === profile.did; });
    var cantSubscribePrompt = Prompt.usePromptControl();
    var isMe = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did;
    var onPressSubscribe = function () {
        return requireAuth(function () { return __awaiter(_this, void 0, void 0, function () {
            var subscribe, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        playHaptic();
                        subscribe = !isSubscribed;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, toggleSubscription({
                                did: profile.did,
                                subscribe: subscribe,
                            })];
                    case 2:
                        _a.sent();
                        ax.metric(subscribe
                            ? 'moderation:subscribedToLabeler'
                            : 'moderation:unsubscribedFromLabeler', {});
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        reset();
                        if (e_2.message === 'MAX_LABELERS') {
                            cantSubscribePrompt.open();
                            return [2 /*return*/];
                        }
                        ax.logger.error("Failed to subscribe to labeler", { message: e_2.message });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    return (_jsxs(_Fragment, { children: [isMe ? (_jsxs(_Fragment, { children: [_jsx(Button, { testID: "profileHeaderEditProfileButton", size: "small", color: "secondary", onPress: editProfileControl.open, label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Edit profile"], ["Edit profile"])))), style: a.rounded_full, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Edit Profile" }) }) }), _jsx(EditProfileDialog, { profile: profile, control: editProfileControl })] })) : !isAppLabeler(profile.did) && !minimal ? (
            // hidden in the minimal header, because it's not shadowed so the two buttons
            // can get out of sync. if you want to reenable, you'll need to add shadowing
            // to the subscribed state -sfn
            _jsx(Button, { testID: "toggleSubscribeBtn", label: isSubscribed
                    ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Unsubscribe from this labeler"], ["Unsubscribe from this labeler"]))))
                    : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Subscribe to this labeler"], ["Subscribe to this labeler"])))), onPress: onPressSubscribe, children: function (state) { return (_jsx(View, { style: [
                        {
                            paddingVertical: 9,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            gap: 6,
                            backgroundColor: isSubscribed
                                ? state.hovered || state.pressed
                                    ? t.palette.contrast_50
                                    : t.palette.contrast_25
                                : state.hovered || state.pressed
                                    ? tokens.color.temp_purple_dark
                                    : tokens.color.temp_purple,
                        },
                    ], children: _jsx(Text, { style: [
                            {
                                color: isSubscribed
                                    ? t.palette.contrast_700
                                    : t.palette.white,
                            },
                            a.font_semi_bold,
                            a.text_center,
                            a.leading_tight,
                        ], children: isSubscribed ? (_jsx(Trans, { children: "Unsubscribe" })) : (_jsx(Trans, { children: "Subscribe to Labeler" })) }) })); } })) : null, _jsx(ProfileMenu, { profile: profile }), _jsx(CantSubscribePrompt, { control: cantSubscribePrompt })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
