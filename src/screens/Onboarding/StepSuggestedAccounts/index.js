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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as bcp47Match from 'bcp-47-match';
import { wait } from '#/lib/async/wait';
import { popularInterests, useInterestsDisplayNames } from '#/lib/interests';
import { isBlockedOrBlocking, isMuted } from '#/lib/moderation/blocked-and-muted';
import { logger } from '#/logger';
import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { useLanguagePrefs } from '#/state/preferences';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useAgent, useSession } from '#/state/session';
import { OnboardingControls, OnboardingPosition, OnboardingTitleText, } from '#/screens/Onboarding/Layout';
import { useOnboardingInternalState } from '#/screens/Onboarding/state';
import { useSuggestedOnboardingUsers } from '#/screens/Search/util/useSuggestedOnboardingUsers';
import { atoms as a, tokens, useBreakpoints, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon } from '#/components/icons/ArrowRotate';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { boostInterests, InterestTabs } from '#/components/InterestTabs';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import * as toast from '#/components/Toast';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import { bulkWriteFollows } from '../util';
export function StepSuggestedAccounts() {
    var _this = this;
    var _a;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var moderationOpts = useModerationOpts();
    var agent = useAgent();
    var currentAccount = useSession().currentAccount;
    var queryClient = useQueryClient();
    var _b = useOnboardingInternalState(), state = _b.state, dispatch = _b.dispatch;
    var _c = useState(null), selectedInterest = _c[0], setSelectedInterest = _c[1];
    // keeping track of who was followed via the follow all button
    // so we can enable/disable the button without having to dig through the shadow cache
    var _d = useState([]), followedUsers = _d[0], setFollowedUsers = _d[1];
    /*
     * Special language handling copied wholesale from the Explore screen
     */
    var contentLanguages = useLanguagePrefs().contentLanguages;
    var useFullExperience = useMemo(function () {
        if (contentLanguages.length === 0)
            return true;
        return bcp47Match.basicFilter('en', contentLanguages).length > 0;
    }, [contentLanguages]);
    var interestsDisplayNames = useInterestsDisplayNames();
    var interests = Object.keys(interestsDisplayNames)
        .sort(boostInterests(popularInterests))
        .sort(boostInterests(state.interestsStepResults.selectedInterests));
    var _e = useSuggestedOnboardingUsers({
        category: selectedInterest || (useFullExperience ? null : interests[0]),
        search: !useFullExperience,
        overrideInterests: state.interestsStepResults.selectedInterests,
    }), suggestedUsers = _e.data, isLoading = _e.isLoading, error = _e.error, isRefetching = _e.isRefetching, refetch = _e.refetch;
    var isError = !!error;
    var isEmpty = !isLoading && suggestedUsers && suggestedUsers.actors.length === 0;
    var followableDids = (_a = suggestedUsers === null || suggestedUsers === void 0 ? void 0 : suggestedUsers.actors.filter(function (user) {
        var _a;
        return user.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) &&
            !isBlockedOrBlocking(user) &&
            !isMuted(user) &&
            !((_a = user.viewer) === null || _a === void 0 ? void 0 : _a.following) &&
            !followedUsers.includes(user.did);
    }).map(function (user) { return user.did; })) !== null && _a !== void 0 ? _a : [];
    var _f = useMutation({
        onMutate: function () {
            ax.metric('onboarding:suggestedAccounts:followAllPressed', {
                tab: selectedInterest !== null && selectedInterest !== void 0 ? selectedInterest : 'all',
                numAccounts: followableDids.length,
            });
            for (var i = 0; i < followableDids.length; i++) {
                var did = followableDids[i];
                ax.metric('suggestedUser:follow', {
                    logContext: 'Onboarding',
                    location: 'FollowAll',
                    recId: suggestedUsers === null || suggestedUsers === void 0 ? void 0 : suggestedUsers.recId,
                    position: i,
                    suggestedDid: did,
                    category: selectedInterest,
                });
            }
        },
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var _i, followableDids_1, did, uris, _a, followableDids_2, did, uri;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        for (_i = 0, followableDids_1 = followableDids; _i < followableDids_1.length; _i++) {
                            did = followableDids_1[_i];
                            updateProfileShadow(queryClient, did, {
                                followingUri: 'pending',
                            });
                        }
                        return [4 /*yield*/, wait(1e3, bulkWriteFollows(agent, followableDids))];
                    case 1:
                        uris = _b.sent();
                        for (_a = 0, followableDids_2 = followableDids; _a < followableDids_2.length; _a++) {
                            did = followableDids_2[_a];
                            uri = uris.get(did);
                            updateProfileShadow(queryClient, did, {
                                followingUri: uri,
                            });
                        }
                        return [2 /*return*/, followableDids];
                }
            });
        }); },
        onSuccess: function (newlyFollowed) {
            toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Followed all accounts!"], ["Followed all accounts!"])))), { type: 'success' });
            setFollowedUsers(function (followed) { return __spreadArray(__spreadArray([], followed, true), newlyFollowed, true); });
        },
        onError: function (e) {
            logger.error('Failed to follow all suggested accounts during onboarding', {
                safeMessage: e,
            });
            toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Failed to follow all suggested accounts, please try again"], ["Failed to follow all suggested accounts, please try again"])))), { type: 'error' });
        },
    }), followAll = _f.mutate, isFollowingAll = _f.isPending;
    var canFollowAll = followableDids.length > 0 && !isFollowingAll;
    // Track seen profiles - shared ref across all cards
    var seenProfilesRef = useRef(new Set());
    var onProfileSeen = useCallback(function (did, position) {
        if (!seenProfilesRef.current.has(did)) {
            seenProfilesRef.current.add(did);
            ax.metric('suggestedUser:seen', {
                logContext: 'Onboarding',
                recId: suggestedUsers === null || suggestedUsers === void 0 ? void 0 : suggestedUsers.recId,
                position: position,
                suggestedDid: did,
                category: selectedInterest,
            });
        }
    }, [ax, selectedInterest, suggestedUsers === null || suggestedUsers === void 0 ? void 0 : suggestedUsers.recId]);
    useEffect(function () {
        if (error) {
            logger.error('Failed to fetch suggested accounts during onboarding', {
                safeMessage: error,
            });
        }
    }, [error]);
    return (_jsxs(View, { style: [a.align_start, a.gap_sm], testID: "onboardingInterests", children: [_jsx(OnboardingPosition, {}), _jsx(OnboardingTitleText, { children: _jsx(Trans, { comment: "Accounts suggested to the user for them to follow", children: "Suggested for you" }) }), _jsxs(View, { style: [
                    a.overflow_hidden,
                    a.mt_sm,
                    IS_WEB
                        ? [a.max_w_full, web({ minHeight: '100vh' })]
                        : { marginHorizontal: tokens.space.xl * -1 },
                    a.flex_1,
                    a.justify_start,
                ], children: [_jsx(TabBar, { selectedInterest: selectedInterest, onSelectInterest: setSelectedInterest, defaultTabLabel: _(msg({
                            message: 'All',
                            comment: 'the default tab in the interests tab bar',
                        })), selectedInterests: state.interestsStepResults.selectedInterests }), isLoading || !moderationOpts ? (_jsx(View, { style: [
                            a.flex_1,
                            a.mt_md,
                            a.align_center,
                            a.justify_center,
                            { minHeight: 400 },
                        ], children: _jsx(Loader, { size: "xl" }) })) : isError ? (_jsx(View, { style: [a.flex_1, a.px_xl, a.pt_2xl], children: _jsx(Admonition, { type: "error", children: _jsx(Trans, { children: "An error occurred while fetching suggested accounts." }) }) })) : isEmpty ? (_jsx(View, { style: [a.flex_1, a.px_xl, a.pt_2xl], children: _jsx(Admonition, { type: "apology", children: _jsx(Trans, { children: "Sorry, we're unable to load account suggestions at this time." }) }) })) : (_jsx(View, { style: [
                            a.flex_1,
                            a.mt_md,
                            a.border_y,
                            t.atoms.border_contrast_low,
                            IS_WEB && [a.border_x, a.rounded_sm, a.overflow_hidden],
                        ], children: suggestedUsers === null || suggestedUsers === void 0 ? void 0 : suggestedUsers.actors.map(function (user, index) { return (_jsx(SuggestedProfileCard, { profile: user, moderationOpts: moderationOpts, position: index, category: selectedInterest, onSeen: onProfileSeen, recId: suggestedUsers.recId }, user.did)); }) }))] }), _jsx(OnboardingControls.Portal, { children: isError ? (_jsxs(View, { style: [a.gap_md, gtMobile ? a.flex_row : a.flex_col], children: [_jsxs(Button, { disabled: isRefetching, color: "secondary", size: "large", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Retry"], ["Retry"])))), onPress: function () { return void refetch(); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), _jsx(ButtonIcon, { icon: ArrowRotateCounterClockwiseIcon })] }), _jsx(Button, { color: "secondary", size: "large", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Skip to next step"], ["Skip to next step"])))), onPress: function () { return dispatch({ type: 'next' }); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Skip" }) }) })] })) : (_jsxs(View, { style: [a.gap_md, gtMobile ? a.flex_row : a.flex_col], children: [_jsxs(Button, { disabled: !canFollowAll, color: "secondary", size: "large", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Follow all accounts"], ["Follow all accounts"])))), onPress: function () { return followAll(); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Follow all" }) }), _jsx(ButtonIcon, { icon: isFollowingAll ? Loader : PlusIcon })] }), _jsx(Button, { disabled: isFollowingAll, color: "primary", size: "large", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Continue to next step"], ["Continue to next step"])))), onPress: function () { return dispatch({ type: 'next' }); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Continue" }) }) })] })) })] }));
}
function TabBar(_a) {
    var selectedInterest = _a.selectedInterest, onSelectInterest = _a.onSelectInterest, selectedInterests = _a.selectedInterests, hideDefaultTab = _a.hideDefaultTab, defaultTabLabel = _a.defaultTabLabel;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var interestsDisplayNames = useInterestsDisplayNames();
    var interests = Object.keys(interestsDisplayNames)
        .sort(boostInterests(popularInterests))
        .sort(boostInterests(selectedInterests));
    return (_jsx(InterestTabs, { interests: hideDefaultTab ? interests : __spreadArray(['all'], interests, true), selectedInterest: selectedInterest || (hideDefaultTab ? interests[0] : 'all'), onSelectTab: function (tab) {
            ax.metric('onboarding:suggestedAccounts:tabPressed', { tab: tab });
            onSelectInterest(tab === 'all' ? null : tab);
        }, interestsDisplayNames: hideDefaultTab
            ? interestsDisplayNames
            : __assign({ all: defaultTabLabel || _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["For You"], ["For You"])))) }, interestsDisplayNames), gutterWidth: IS_WEB ? 0 : tokens.space.xl }));
}
function SuggestedProfileCard(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, position = _a.position, category = _a.category, onSeen = _a.onSeen, recId = _a.recId;
    var t = useTheme();
    var ax = useAnalytics();
    var cardRef = useRef(null);
    var hasTrackedRef = useRef(false);
    useEffect(function () {
        var node = cardRef.current;
        if (!node || hasTrackedRef.current)
            return;
        if (IS_WEB && typeof IntersectionObserver !== 'undefined') {
            var observer_1 = new IntersectionObserver(function (entries) {
                var _a;
                if (((_a = entries[0]) === null || _a === void 0 ? void 0 : _a.isIntersecting) && !hasTrackedRef.current) {
                    hasTrackedRef.current = true;
                    onSeen(profile.did, position);
                    observer_1.disconnect();
                }
            }, { threshold: 0.5 });
            // @ts-ignore - web only
            observer_1.observe(node);
            return function () { return observer_1.disconnect(); };
        }
        else {
            // Native: use a short delay to account for initial layout
            var timeout_1 = setTimeout(function () {
                if (!hasTrackedRef.current) {
                    hasTrackedRef.current = true;
                    onSeen(profile.did, position);
                }
            }, 500);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [onSeen, profile.did, position]);
    return (_jsx(View, { ref: cardRef, style: [
            a.w_full,
            a.py_lg,
            a.px_xl,
            position !== 0 && a.border_t,
            t.atoms.border_contrast_low,
        ], children: _jsxs(ProfileCard.Outer, { children: [_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, disabledPreview: true }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.FollowButton, { profile: profile, moderationOpts: moderationOpts, withIcon: false, logContext: "OnboardingSuggestedAccounts", onFollow: function () {
                                ax.metric('suggestedUser:follow', {
                                    logContext: 'Onboarding',
                                    location: 'Card',
                                    recId: recId,
                                    position: position,
                                    suggestedDid: profile.did,
                                    category: category,
                                });
                            } })] }), _jsx(ProfileCard.Description, { profile: profile, numberOfLines: 3 })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
