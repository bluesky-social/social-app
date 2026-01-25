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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View, } from 'react-native';
import { moderateProfile, RichText as RichTextApi, } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useActorStatus } from '#/lib/actor-status';
import { getModerationCauseKey } from '#/lib/moderation';
import { forceLTR } from '#/lib/strings/bidi';
import { NON_BREAKING_SPACE } from '#/lib/strings/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { PreviewableUserAvatar, UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, platform, useTheme, } from '#/alf';
import { Button, ButtonIcon, ButtonText, } from '#/components/Button';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Link as InternalLink } from '#/components/Link';
import * as Pills from '#/components/Pills';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
export function Default(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, _b = _a.logContext, logContext = _b === void 0 ? 'ProfileCard' : _b, testID = _a.testID, position = _a.position, contextProfileDid = _a.contextProfileDid;
    return (_jsx(Link, { testID: testID, profile: profile, children: _jsx(Card, { profile: profile, moderationOpts: moderationOpts, logContext: logContext, position: position, contextProfileDid: contextProfileDid }) }));
}
export function Card(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, _b = _a.logContext, logContext = _b === void 0 ? 'ProfileCard' : _b, position = _a.position, contextProfileDid = _a.contextProfileDid;
    return (_jsxs(Outer, { children: [_jsxs(Header, { children: [_jsx(Avatar, { profile: profile, moderationOpts: moderationOpts }), _jsx(NameAndHandle, { profile: profile, moderationOpts: moderationOpts }), _jsx(FollowButton, { profile: profile, moderationOpts: moderationOpts, logContext: logContext, position: position, contextProfileDid: contextProfileDid })] }), _jsx(Labels, { profile: profile, moderationOpts: moderationOpts }), _jsx(Description, { profile: profile })] }));
}
export function Outer(_a) {
    var children = _a.children;
    return _jsx(View, { style: [a.w_full, a.flex_1, a.gap_xs], children: children });
}
export function Header(_a) {
    var children = _a.children;
    return _jsx(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: children });
}
export function Link(_a) {
    var profile = _a.profile, children = _a.children, style = _a.style, rest = __rest(_a, ["profile", "children", "style"]);
    var _ = useLingui()._;
    return (_jsx(InternalLink, __assign({ label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View ", "'s profile"], ["View ", "'s profile"])), profile.displayName || sanitizeHandle(profile.handle))), to: {
            screen: 'Profile',
            params: { name: profile.did },
        }, style: [a.flex_col, style] }, rest, { children: children })));
}
export function Avatar(_a) {
    var _b;
    var profile = _a.profile, moderationOpts = _a.moderationOpts, onPress = _a.onPress, disabledPreview = _a.disabledPreview, liveOverride = _a.liveOverride, _c = _a.size, size = _c === void 0 ? 40 : _c;
    var moderation = moderateProfile(profile, moderationOpts);
    var live = useActorStatus(profile).isActive;
    return disabledPreview ? (_jsx(UserAvatar, { size: size, avatar: profile.avatar, type: ((_b = profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', moderation: moderation.ui('avatar'), live: liveOverride !== null && liveOverride !== void 0 ? liveOverride : live })) : (_jsx(PreviewableUserAvatar, { size: size, profile: profile, moderation: moderation.ui('avatar'), onBeforePress: onPress, live: liveOverride !== null && liveOverride !== void 0 ? liveOverride : live }));
}
export function AvatarPlaceholder(_a) {
    var _b = _a.size, size = _b === void 0 ? 40 : _b;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.rounded_full,
            t.atoms.bg_contrast_25,
            {
                width: size,
                height: size,
            },
        ] }));
}
export function NameAndHandle(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, _b = _a.inline, inline = _b === void 0 ? false : _b;
    if (inline) {
        return (_jsx(InlineNameAndHandle, { profile: profile, moderationOpts: moderationOpts }));
    }
    else {
        return (_jsxs(View, { style: [a.flex_1], children: [_jsx(Name, { profile: profile, moderationOpts: moderationOpts }), _jsx(Handle, { profile: profile })] }));
    }
}
function InlineNameAndHandle(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts;
    var t = useTheme();
    var verification = useSimpleVerificationState({ profile: profile });
    var moderation = moderateProfile(profile, moderationOpts);
    var name = sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle), moderation.ui('displayName'));
    var handle = sanitizeHandle(profile.handle, '@');
    return (_jsxs(View, { style: [a.flex_row, a.align_end, a.flex_shrink], children: [_jsx(Text, { emoji: true, style: [
                    a.font_semi_bold,
                    a.leading_tight,
                    a.flex_shrink_0,
                    { maxWidth: '70%' },
                ], numberOfLines: 1, children: forceLTR(name) }), verification.showBadge && (_jsx(View, { style: [
                    a.pl_2xs,
                    a.self_center,
                    { marginTop: platform({ default: 0, android: -1 }) },
                ], children: _jsx(VerificationCheck, { width: platform({ android: 13, default: 12 }), verifier: verification.role === 'verifier' }) })), _jsx(Text, { emoji: true, style: [
                    a.leading_tight,
                    t.atoms.text_contrast_medium,
                    { flexShrink: 10 },
                ], numberOfLines: 1, children: NON_BREAKING_SPACE + handle })] }));
}
export function Name(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, style = _a.style, textStyle = _a.textStyle;
    var moderation = moderateProfile(profile, moderationOpts);
    var name = sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle), moderation.ui('displayName'));
    var verification = useSimpleVerificationState({ profile: profile });
    return (_jsxs(View, { style: [a.flex_row, a.align_center, a.max_w_full, style], children: [_jsx(Text, { emoji: true, style: [
                    a.text_md,
                    a.font_semi_bold,
                    a.leading_snug,
                    a.self_start,
                    a.flex_shrink,
                    textStyle,
                ], numberOfLines: 1, children: name }), verification.showBadge && (_jsx(View, { style: [a.pl_xs], children: _jsx(VerificationCheck, { width: 14, verifier: verification.role === 'verifier' }) }))] }));
}
export function Handle(_a) {
    var profile = _a.profile, textStyle = _a.textStyle;
    var t = useTheme();
    var handle = sanitizeHandle(profile.handle, '@');
    return (_jsx(Text, { emoji: true, style: [a.leading_snug, t.atoms.text_contrast_medium, textStyle], numberOfLines: 1, children: handle }));
}
export function NameAndHandlePlaceholder() {
    var t = useTheme();
    return (_jsxs(View, { style: [a.flex_1, a.gap_xs], children: [_jsx(View, { style: [
                    a.rounded_xs,
                    t.atoms.bg_contrast_25,
                    {
                        width: '60%',
                        height: 14,
                    },
                ] }), _jsx(View, { style: [
                    a.rounded_xs,
                    t.atoms.bg_contrast_25,
                    {
                        width: '40%',
                        height: 10,
                    },
                ] })] }));
}
export function NamePlaceholder(_a) {
    var style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.rounded_xs,
            t.atoms.bg_contrast_25,
            {
                width: '60%',
                height: 14,
            },
            style,
        ] }));
}
export function Description(_a) {
    var profileUnshadowed = _a.profile, _b = _a.numberOfLines, numberOfLines = _b === void 0 ? 3 : _b, style = _a.style;
    var profile = useProfileShadow(profileUnshadowed);
    var rt = useMemo(function () {
        if (!('description' in profile))
            return;
        var rt = new RichTextApi({ text: profile.description || '' });
        rt.detectFacetsWithoutResolution();
        return rt;
    }, [profile]);
    if (!rt)
        return null;
    if (profile.viewer &&
        (profile.viewer.blockedBy ||
            profile.viewer.blocking ||
            profile.viewer.blockingByList))
        return null;
    return (_jsx(View, { style: [a.pt_xs], children: _jsx(RichText, { value: rt, style: style, numberOfLines: numberOfLines, disableLinks: true }) }));
}
export function DescriptionPlaceholder(_a) {
    var _b = _a.numberOfLines, numberOfLines = _b === void 0 ? 3 : _b;
    var t = useTheme();
    return (_jsx(View, { style: [a.pt_2xs, { gap: 6 }], children: Array(numberOfLines)
            .fill(0)
            .map(function (_, i) { return (_jsx(View, { style: [
                a.rounded_xs,
                a.w_full,
                t.atoms.bg_contrast_25,
                { height: 12, width: i + 1 === numberOfLines ? '60%' : '100%' },
            ] }, i)); }) }));
}
export function FollowButton(props) {
    var _a = useSession(), currentAccount = _a.currentAccount, hasSession = _a.hasSession;
    var isMe = props.profile.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    return hasSession && !isMe ? _jsx(FollowButtonInner, __assign({}, props)) : null;
}
export function FollowButtonInner(_a) {
    var _this = this;
    var _b;
    var profileUnshadowed = _a.profile, moderationOpts = _a.moderationOpts, logContext = _a.logContext, onPressProp = _a.onPress, onFollow = _a.onFollow, colorInverted = _a.colorInverted, _c = _a.withIcon, withIcon = _c === void 0 ? true : _c, position = _a.position, contextProfileDid = _a.contextProfileDid, rest = __rest(_a, ["profile", "moderationOpts", "logContext", "onPress", "onFollow", "colorInverted", "withIcon", "position", "contextProfileDid"]);
    var _ = useLingui()._;
    var profile = useProfileShadow(profileUnshadowed);
    var moderation = moderateProfile(profile, moderationOpts);
    var _d = useProfileFollowMutationQueue(profile, logContext, position, contextProfileDid), queueFollow = _d[0], queueUnfollow = _d[1];
    var isRound = Boolean(rest.shape && rest.shape === 'round');
    var onPressFollow = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    e.stopPropagation();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, queueFollow()];
                case 2:
                    _a.sent();
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Following ", ""], ["Following ", ""])), sanitizeDisplayName(profile.displayName || profile.handle, moderation.ui('displayName')))));
                    onPressProp === null || onPressProp === void 0 ? void 0 : onPressProp(e);
                    onFollow === null || onFollow === void 0 ? void 0 : onFollow();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    if ((err_1 === null || err_1 === void 0 ? void 0 : err_1.name) !== 'AbortError') {
                        Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["An issue occurred, please try again."], ["An issue occurred, please try again."])))), 'xmark');
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var onPressUnfollow = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    e.stopPropagation();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, queueUnfollow()];
                case 2:
                    _a.sent();
                    Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["No longer following ", ""], ["No longer following ", ""])), sanitizeDisplayName(profile.displayName || profile.handle, moderation.ui('displayName')))));
                    onPressProp === null || onPressProp === void 0 ? void 0 : onPressProp(e);
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    if ((err_2 === null || err_2 === void 0 ? void 0 : err_2.name) !== 'AbortError') {
                        Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["An issue occurred, please try again."], ["An issue occurred, please try again."])))), 'xmark');
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var unfollowLabel = _(msg({
        message: 'Following',
        comment: 'User is following this account, click to unfollow',
    }));
    var followLabel = ((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.followedBy)
        ? _(msg({
            message: 'Follow back',
            comment: 'User is not following this account, click to follow back',
        }))
        : _(msg({
            message: 'Follow',
            comment: 'User is not following this account, click to follow',
        }));
    if (!profile.viewer)
        return null;
    if (profile.viewer.blockedBy ||
        profile.viewer.blocking ||
        profile.viewer.blockingByList)
        return null;
    return (_jsx(View, { children: profile.viewer.following ? (_jsxs(Button, __assign({ label: unfollowLabel, size: "small", variant: "solid", color: "secondary" }, rest, { onPress: onPressUnfollow, children: [withIcon && (_jsx(ButtonIcon, { icon: Check, position: isRound ? undefined : 'left' })), isRound ? null : _jsx(ButtonText, { children: unfollowLabel })] }))) : (_jsxs(Button, __assign({ label: followLabel, size: "small", variant: "solid", color: colorInverted ? 'secondary_inverted' : 'primary' }, rest, { onPress: onPressFollow, children: [withIcon && (_jsx(ButtonIcon, { icon: Plus, position: isRound ? undefined : 'left' })), isRound ? null : _jsx(ButtonText, { children: followLabel })] }))) }));
}
export function FollowButtonPlaceholder(_a) {
    var style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.rounded_sm,
            t.atoms.bg_contrast_25,
            a.w_full,
            {
                height: 33,
            },
            style,
        ] }));
}
export function Labels(_a) {
    var _b;
    var profile = _a.profile, moderationOpts = _a.moderationOpts;
    var moderation = moderateProfile(profile, moderationOpts);
    var modui = moderation.ui('profileList');
    var followedBy = (_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.followedBy;
    if (!followedBy && !modui.inform && !modui.alert) {
        return null;
    }
    return (_jsxs(Pills.Row, { style: [a.pt_xs], children: [followedBy && _jsx(Pills.FollowsYou, {}), modui.alerts.map(function (alert) { return (_jsx(Pills.Label, { cause: alert }, getModerationCauseKey(alert))); }), modui.informs.map(function (inform) { return (_jsx(Pills.Label, { cause: inform }, getModerationCauseKey(inform))); })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
