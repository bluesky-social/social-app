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
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { moderateProfile, } from '@atproto/api';
import { flip, offset, shift, size, useFloating } from '@floating-ui/react-dom';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { getModerationCauseKey } from '#/lib/moderation';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePrefetchProfileQuery, useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { formatCount } from '#/view/com/util/numeric/format';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { ProfileHeaderHandle } from '#/screens/Profile/Header/Handle';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useFollowMethods } from '#/components/hooks/useFollowMethods';
import { useRichText } from '#/components/hooks/useRichText';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { KnownFollowers, shouldShowKnownFollowers, } from '#/components/KnownFollowers';
import { InlineLinkText, Link } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Pills from '#/components/Pills';
import { Portal } from '#/components/Portal';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { IS_WEB_TOUCH_DEVICE } from '#/env';
import { useActorStatus } from '#/features/liveNow';
import { LiveStatus } from '#/features/liveNow/components/LiveStatusDialog';
var floatingMiddlewares = [
    offset(4),
    flip({ padding: 16 }),
    shift({ padding: 16 }),
    size({
        padding: 16,
        apply: function (_a) {
            var availableWidth = _a.availableWidth, availableHeight = _a.availableHeight, elements = _a.elements;
            Object.assign(elements.floating.style, {
                maxWidth: "".concat(availableWidth, "px"),
                maxHeight: "".concat(availableHeight, "px"),
            });
        },
    }),
];
export function ProfileHoverCard(props) {
    var prefetchProfileQuery = usePrefetchProfileQuery();
    var prefetchedProfile = React.useRef(false);
    var onPointerMove = function () {
        if (!prefetchedProfile.current) {
            prefetchedProfile.current = true;
            prefetchProfileQuery(props.did);
        }
    };
    if (props.disable || IS_WEB_TOUCH_DEVICE) {
        return props.children;
    }
    else {
        return (_jsx(View, { onPointerMove: onPointerMove, style: [a.flex_shrink, props.inline && a.inline, props.style], children: _jsx(ProfileHoverCardInner, __assign({}, props)) }));
    }
}
var SHOW_DELAY = 500;
var SHOW_DURATION = 300;
var HIDE_DELAY = 150;
var HIDE_DURATION = 200;
export function ProfileHoverCardInner(props) {
    var _this = this;
    var navigation = useNavigation();
    var _a = useFloating({
        middleware: floatingMiddlewares,
    }), refs = _a.refs, floatingStyles = _a.floatingStyles;
    var _b = React.useReducer(
    // Tip: console.log(state, action) when debugging.
    function (state, action) {
        // Pressing within a card should always hide it.
        // No matter which stage we're in.
        if (action === 'pressed') {
            return hidden();
        }
        // --- Hidden ---
        // In the beginning, the card is not displayed.
        function hidden() {
            return { stage: 'hidden' };
        }
        if (state.stage === 'hidden') {
            // The user can kick things off by hovering a target.
            if (action === 'hovered-target') {
                return mightShow({
                    reason: action,
                });
            }
        }
        // --- Might Show ---
        // The card is not visible yet but we're considering showing it.
        function mightShow(_a) {
            var _b = _a.waitMs, waitMs = _b === void 0 ? SHOW_DELAY : _b, reason = _a.reason;
            return {
                stage: 'might-show',
                reason: reason,
                effect: function () {
                    var id = setTimeout(function () { return dispatch('hovered-long-enough'); }, waitMs);
                    return function () {
                        clearTimeout(id);
                    };
                },
            };
        }
        if (state.stage === 'might-show') {
            // We'll make a decision at the end of a grace period timeout.
            if (action === 'unhovered-target' || action === 'unhovered-card') {
                return hidden();
            }
            if (action === 'hovered-long-enough') {
                return showing({
                    reason: state.reason,
                });
            }
        }
        // --- Showing ---
        // The card is beginning to show up and then will remain visible.
        function showing(_a) {
            var reason = _a.reason;
            return {
                stage: 'showing',
                reason: reason,
                effect: function () {
                    function onScroll() {
                        dispatch('scrolled-while-showing');
                    }
                    window.addEventListener('scroll', onScroll);
                    return function () { return window.removeEventListener('scroll', onScroll); };
                },
            };
        }
        if (state.stage === 'showing') {
            // If the user moves the pointer away, we'll begin to consider hiding it.
            if (action === 'unhovered-target' || action === 'unhovered-card') {
                return mightHide();
            }
            // Scrolling away if the hover is on the target instantly hides without a delay.
            // If the hover is already on the card, we won't this.
            if (state.reason === 'hovered-target' &&
                action === 'scrolled-while-showing') {
                return hiding();
            }
        }
        // --- Might Hide ---
        // The user has moved hover away from a visible card.
        function mightHide(_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.waitMs, waitMs = _c === void 0 ? HIDE_DELAY : _c;
            return {
                stage: 'might-hide',
                effect: function () {
                    var id = setTimeout(function () { return dispatch('unhovered-long-enough'); }, waitMs);
                    return function () { return clearTimeout(id); };
                },
            };
        }
        if (state.stage === 'might-hide') {
            // We'll make a decision based on whether it received hover again in time.
            if (action === 'hovered-target' || action === 'hovered-card') {
                return showing({
                    reason: action,
                });
            }
            if (action === 'unhovered-long-enough') {
                return hiding();
            }
        }
        // --- Hiding ---
        // The user waited enough outside that we're hiding the card.
        function hiding(_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.animationDurationMs, animationDurationMs = _c === void 0 ? HIDE_DURATION : _c;
            return {
                stage: 'hiding',
                effect: function () {
                    var id = setTimeout(function () { return dispatch('finished-animating-hide'); }, animationDurationMs);
                    return function () { return clearTimeout(id); };
                },
            };
        }
        if (state.stage === 'hiding') {
            // While hiding, we don't want to be interrupted by anything else.
            // When the animation finishes, we loop back to the initial hidden state.
            if (action === 'finished-animating-hide') {
                return hidden();
            }
        }
        return state;
    }, { stage: 'hidden' }), currentState = _b[0], dispatch = _b[1];
    React.useEffect(function () {
        if (currentState.effect) {
            var effect = currentState.effect;
            return effect();
        }
    }, [currentState]);
    var prefetchProfileQuery = usePrefetchProfileQuery();
    var prefetchedProfile = React.useRef(false);
    var prefetchIfNeeded = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!prefetchedProfile.current) {
                prefetchedProfile.current = true;
                prefetchProfileQuery(props.did);
            }
            return [2 /*return*/];
        });
    }); }, [prefetchProfileQuery, props.did]);
    var didFireHover = React.useRef(false);
    var onPointerMoveTarget = React.useCallback(function () {
        prefetchIfNeeded();
        // Conceptually we want something like onPointerEnter,
        // but we want to ignore entering only due to scrolling.
        // So instead we hover on the first onPointerMove.
        if (!didFireHover.current) {
            didFireHover.current = true;
            dispatch('hovered-target');
        }
    }, [prefetchIfNeeded]);
    var onPointerLeaveTarget = React.useCallback(function () {
        didFireHover.current = false;
        dispatch('unhovered-target');
    }, []);
    var onPointerEnterCard = React.useCallback(function () {
        dispatch('hovered-card');
    }, []);
    var onPointerLeaveCard = React.useCallback(function () {
        dispatch('unhovered-card');
    }, []);
    var onPress = React.useCallback(function () {
        dispatch('pressed');
    }, []);
    var isVisible = currentState.stage === 'showing' ||
        currentState.stage === 'might-hide' ||
        currentState.stage === 'hiding';
    var animationStyle = {
        animation: currentState.stage === 'hiding'
            ? "fadeOut ".concat(HIDE_DURATION, "ms both")
            : "fadeIn ".concat(SHOW_DURATION, "ms both"),
    };
    return (_jsxs(View
    // @ts-ignore View is being used as div
    , { 
        // @ts-ignore View is being used as div
        ref: refs.setReference, onPointerMove: onPointerMoveTarget, onPointerLeave: onPointerLeaveTarget, 
        // @ts-ignore web only prop
        onMouseUp: onPress, style: [a.flex_shrink, props.inline && a.inline], children: [props.children, isVisible && (_jsx(Portal, { children: _jsx("div", { ref: refs.setFloating, style: floatingStyles, onPointerEnter: onPointerEnterCard, onPointerLeave: onPointerLeaveCard, children: _jsx("div", { style: __assign({ willChange: 'transform' }, animationStyle), children: _jsx(Card, { did: props.did, hide: onPress, navigation: navigation }) }) }) }))] }));
}
var Card = function (_a) {
    var did = _a.did, hide = _a.hide, navigation = _a.navigation;
    var t = useTheme();
    var profile = useProfileQuery({ did: did });
    var moderationOpts = useModerationOpts();
    var data = profile.data;
    var status = useActorStatus(data);
    var onPressOpenProfile = useCallback(function () {
        if (!status.isActive || !data)
            return;
        hide();
        navigation.push('Profile', {
            name: data.handle,
        });
    }, [hide, navigation, status, data]);
    return (_jsx(View, { style: [
            !status.isActive && a.p_lg,
            a.border,
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg,
            t.atoms.border_contrast_low,
            t.atoms.shadow_lg,
            { width: status.isActive ? 350 : 300 },
            a.max_w_full,
        ], children: data && moderationOpts ? (status.isActive ? (_jsx(LiveStatus, { status: status, profile: data, embed: status.embed, padding: "lg", onPressOpenProfile: onPressOpenProfile })) : (_jsx(Inner, { profile: data, moderationOpts: moderationOpts, hide: hide }))) : (_jsx(View, { style: [
                a.justify_center,
                a.align_center,
                { minHeight: 200 },
                a.w_full,
            ], children: _jsx(Loader, { size: "xl" }) })) }));
};
Card = React.memo(Card);
function Inner(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var profile = _a.profile, moderationOpts = _a.moderationOpts, hide = _a.hide;
    var t = useTheme();
    var _p = useLingui(), _ = _p._, i18n = _p.i18n;
    var currentAccount = useSession().currentAccount;
    var moderation = React.useMemo(function () { return moderateProfile(profile, moderationOpts); }, [profile, moderationOpts]);
    var descriptionRT = useRichText((_b = profile.description) !== null && _b !== void 0 ? _b : '')[0];
    var profileShadow = useProfileShadow(profile);
    var _q = useFollowMethods({
        profile: profileShadow,
        logContext: 'ProfileHoverCard',
    }), follow = _q.follow, unfollow = _q.unfollow;
    var isBlockedUser = ((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.blocking) ||
        ((_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.blockedBy) ||
        ((_e = profile.viewer) === null || _e === void 0 ? void 0 : _e.blockingByList);
    var following = formatCount(i18n, profile.followsCount || 0);
    var followers = formatCount(i18n, profile.followersCount || 0);
    var pluralizedFollowers = plural(profile.followersCount || 0, {
        one: 'follower',
        other: 'followers',
    });
    var pluralizedFollowings = plural(profile.followsCount || 0, {
        one: 'following',
        other: 'following',
    });
    var profileURL = makeProfileLink({
        did: profile.did,
        handle: profile.handle,
    });
    var isMe = React.useMemo(function () { return (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did; }, [currentAccount, profile]);
    var isLabeler = (_f = profile.associated) === null || _f === void 0 ? void 0 : _f.labeler;
    var verification = useSimpleVerificationState({ profile: profile });
    return (_jsxs(View, { children: [_jsxs(View, { style: [a.flex_row, a.justify_between, a.align_start], children: [_jsx(Link, { to: profileURL, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View profile"], ["View profile"])))), onPress: hide, children: _jsx(UserAvatar, { size: 64, avatar: profile.avatar, type: isLabeler ? 'labeler' : 'user', moderation: moderation.ui('avatar') }) }), !isMe &&
                        !isLabeler &&
                        (isBlockedUser ? (_jsx(Link, { to: profileURL, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["View blocked user's profile"], ["View blocked user's profile"])))), onPress: hide, size: "small", color: "secondary", variant: "solid", style: [a.rounded_full], children: _jsx(ButtonText, { children: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["View profile"], ["View profile"])))) }) })) : (_jsxs(Button, { size: "small", color: ((_g = profileShadow.viewer) === null || _g === void 0 ? void 0 : _g.following) ? 'secondary' : 'primary', variant: "solid", label: ((_h = profileShadow.viewer) === null || _h === void 0 ? void 0 : _h.following)
                                ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Following"], ["Following"]))))
                                : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Follow"], ["Follow"])))), style: [a.rounded_full], onPress: ((_j = profileShadow.viewer) === null || _j === void 0 ? void 0 : _j.following) ? unfollow : follow, children: [_jsx(ButtonIcon, { position: "left", icon: ((_k = profileShadow.viewer) === null || _k === void 0 ? void 0 : _k.following) ? Check : Plus }), _jsx(ButtonText, { children: ((_l = profileShadow.viewer) === null || _l === void 0 ? void 0 : _l.following)
                                        ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Following"], ["Following"]))))
                                        : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Follow"], ["Follow"])))) })] })))] }), _jsx(Link, { to: profileURL, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["View profile"], ["View profile"])))), onPress: hide, children: _jsxs(View, { style: [a.pb_sm, a.flex_1], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.pt_md, a.pb_xs], children: [_jsx(Text, { numberOfLines: 1, style: [
                                        a.text_lg,
                                        a.leading_snug,
                                        a.font_semi_bold,
                                        a.self_start,
                                    ], children: sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle), moderation.ui('displayName')) }), verification.showBadge && (_jsx(View, { style: [
                                        a.pl_xs,
                                        {
                                            marginTop: -2,
                                        },
                                    ], children: _jsx(VerificationCheck, { width: 16, verifier: verification.role === 'verifier' }) }))] }), _jsx(ProfileHeaderHandle, { profile: profileShadow, disableTaps: true })] }) }), isBlockedUser && (_jsx(View, { style: [a.flex_row, a.flex_wrap, a.gap_xs], children: moderation.ui('profileView').alerts.map(function (cause) { return (_jsx(Pills.Label, { size: "lg", cause: cause, disableDetailsDialog: true }, getModerationCauseKey(cause))); }) })), !isBlockedUser && (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.flex_row, a.flex_wrap, a.gap_md, a.pt_xs], children: [_jsxs(InlineLinkText, { to: makeProfileLink(profile, 'followers'), label: "".concat(followers, " ").concat(pluralizedFollowers), style: [t.atoms.text], onPress: hide, children: [_jsxs(Text, { style: [a.text_md, a.font_semi_bold], children: [followers, " "] }), _jsx(Text, { style: [t.atoms.text_contrast_medium], children: pluralizedFollowers })] }), _jsxs(InlineLinkText, { to: makeProfileLink(profile, 'follows'), label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", " following"], ["", " following"])), following)), style: [t.atoms.text], onPress: hide, children: [_jsxs(Text, { style: [a.text_md, a.font_semi_bold], children: [following, " "] }), _jsx(Text, { style: [t.atoms.text_contrast_medium], children: pluralizedFollowings })] })] }), ((_m = profile.description) === null || _m === void 0 ? void 0 : _m.trim()) && !moderation.ui('profileView').blur ? (_jsx(View, { style: [a.pt_md], children: _jsx(RichText, { numberOfLines: 8, value: descriptionRT, onLinkPress: hide }) })) : undefined, !isMe &&
                        shouldShowKnownFollowers((_o = profile.viewer) === null || _o === void 0 ? void 0 : _o.knownFollowers) && (_jsx(View, { style: [a.flex_row, a.align_center, a.gap_sm, a.pt_md], children: _jsx(KnownFollowers, { profile: profile, moderationOpts: moderationOpts, onLinkPress: hide }) }))] }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
