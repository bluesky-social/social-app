var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition, } from 'react-native-reanimated';
import { AtUri } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useGetPopularFeedsQuery } from '#/state/queries/feed';
import { useProfilesQuery } from '#/state/queries/profile';
import { useSuggestedFollowsByActorQuery, useSuggestedFollowsQuery, } from '#/state/queries/suggested-follows';
import { useSession } from '#/state/session';
import * as userActionHistory from '#/state/userActionHistory';
import { BlockDrawerGesture } from '#/view/shell/BlockDrawerGesture';
import { atoms as a, native, useBreakpoints, useTheme, web, } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import * as FeedCard from '#/components/FeedCard';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRight } from '#/components/icons/Arrow';
import { Hashtag_Stroke2_Corner0_Rounded as Hashtag } from '#/components/icons/Hashtag';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { InlineLinkText } from '#/components/Link';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_IOS } from '#/env';
import { FollowDialogWithoutGuide } from './ProgressGuide/FollowDialog';
import { ProgressGuideList } from './ProgressGuide/List';
var DISMISS_ANIMATION_DURATION = 200;
var MOBILE_CARD_WIDTH = 165;
var FINAL_CARD_WIDTH = 120;
function CardOuter(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    return (_jsx(View, { testID: "CardOuter", style: [
            a.flex_1,
            a.w_full,
            a.p_md,
            a.rounded_lg,
            a.border,
            t.atoms.bg,
            t.atoms.shadow_sm,
            t.atoms.border_contrast_low,
            !gtMobile && {
                width: MOBILE_CARD_WIDTH,
            },
            style,
        ], children: children }));
}
export function SuggestedFollowPlaceholder() {
    return (_jsx(CardOuter, { children: _jsxs(ProfileCard.Outer, { children: [_jsxs(View, { style: [a.flex_col, a.align_center, a.gap_sm, a.pb_sm, a.mb_auto], children: [_jsx(ProfileCard.AvatarPlaceholder, { size: 88 }), _jsx(ProfileCard.NamePlaceholder, {}), _jsx(View, { style: [a.w_full], children: _jsx(ProfileCard.DescriptionPlaceholder, { numberOfLines: 2 }) })] }), _jsx(ProfileCard.FollowButtonPlaceholder, {})] }) }));
}
export function SuggestedFeedsCardPlaceholder() {
    return (_jsxs(CardOuter, { style: [a.gap_sm], children: [_jsxs(FeedCard.Header, { children: [_jsx(FeedCard.AvatarPlaceholder, {}), _jsx(FeedCard.TitleAndBylinePlaceholder, { creator: true })] }), _jsx(FeedCard.DescriptionPlaceholder, {})] }));
}
function getRank(seenPost) {
    var _a, _b, _c;
    var tier;
    if (seenPost.feedContext === 'popfriends') {
        tier = 'a';
    }
    else if ((_a = seenPost.feedContext) === null || _a === void 0 ? void 0 : _a.startsWith('cluster')) {
        tier = 'b';
    }
    else if (seenPost.feedContext === 'popcluster') {
        tier = 'c';
    }
    else if ((_b = seenPost.feedContext) === null || _b === void 0 ? void 0 : _b.startsWith('ntpc')) {
        tier = 'd';
    }
    else if ((_c = seenPost.feedContext) === null || _c === void 0 ? void 0 : _c.startsWith('t-')) {
        tier = 'e';
    }
    else if (seenPost.feedContext === 'nettop') {
        tier = 'f';
    }
    else {
        tier = 'g';
    }
    var score = Math.round(Math.log(1 + seenPost.likeCount + seenPost.repostCount + seenPost.replyCount));
    if (seenPost.isFollowedBy || Math.random() > 0.9) {
        score *= 2;
    }
    var rank = 100 - score;
    return "".concat(tier, "-").concat(rank);
}
function sortSeenPosts(postA, postB) {
    var rankA = getRank(postA);
    var rankB = getRank(postB);
    // Yes, we're comparing strings here.
    // The "larger" string means a worse rank.
    if (rankA > rankB) {
        return 1;
    }
    else if (rankA < rankB) {
        return -1;
    }
    else {
        return 0;
    }
}
function useExperimentalSuggestedUsersQuery() {
    var currentAccount = useSession().currentAccount;
    var userActionSnapshot = userActionHistory.useActionHistorySnapshot();
    var dids = useMemo(function () {
        var likes = userActionSnapshot.likes, follows = userActionSnapshot.follows, followSuggestions = userActionSnapshot.followSuggestions, seen = userActionSnapshot.seen;
        var likeDids = likes
            .map(function (l) { return new AtUri(l); })
            .map(function (uri) { return uri.host; })
            .filter(function (did) { return !follows.includes(did); });
        var suggestedDids = [];
        if (followSuggestions.length > 0) {
            suggestedDids = [
                // It's ok if these will pick the same item (weighed by its frequency)
                followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
                followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
                followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
                followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
            ];
        }
        var seenDids = seen
            .sort(sortSeenPosts)
            .map(function (l) { return new AtUri(l.uri); })
            .map(function (uri) { return uri.host; });
        return __spreadArray([], new Set(__spreadArray(__spreadArray(__spreadArray([], suggestedDids, true), likeDids, true), seenDids, true)), true).filter(function (did) { return did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); });
    }, [userActionSnapshot, currentAccount]);
    var _a = useProfilesQuery({
        handles: dids.slice(0, 16),
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error;
    var profiles = data
        ? data.profiles.filter(function (profile) {
            var _a;
            return !((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.following);
        })
        : [];
    return {
        isLoading: isLoading,
        error: error,
        profiles: profiles.slice(0, 6),
    };
}
export function SuggestedFollows(_a) {
    var feed = _a.feed;
    var currentAccount = useSession().currentAccount;
    var _b = feed.split('|'), feedType = _b[0], feedUriOrDid = _b[1];
    if (feedType === 'author') {
        if ((currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === feedUriOrDid) {
            return null;
        }
        else {
            return _jsx(SuggestedFollowsProfile, { did: feedUriOrDid });
        }
    }
    else {
        return _jsx(SuggestedFollowsHome, {});
    }
}
export function SuggestedFollowsProfile(_a) {
    var did = _a.did;
    var gtMobile = useBreakpoints().gtMobile;
    var moderationOpts = useModerationOpts();
    var maxLength = gtMobile ? 4 : 6;
    var _b = useSuggestedFollowsByActorQuery({
        did: did,
    }), isSuggestionsLoading = _b.isLoading, data = _b.data, error = _b.error;
    var _c = useSuggestedFollowsQuery({ limit: 25 }), moreSuggestions = _c.data, fetchNextPage = _c.fetchNextPage, hasNextPage = _c.hasNextPage, isFetchingNextPage = _c.isFetchingNextPage;
    var _d = useState(new Set()), dismissedDids = _d[0], setDismissedDids = _d[1];
    var onDismiss = useCallback(function (dismissedDid) {
        setDismissedDids(function (prev) { return new Set(prev).add(dismissedDid); });
    }, []);
    // Combine profiles from the actor-specific query with fallback suggestions
    var allProfiles = useMemo(function () {
        var _a, _b;
        var actorProfiles = (_a = data === null || data === void 0 ? void 0 : data.suggestions) !== null && _a !== void 0 ? _a : [];
        var fallbackProfiles = (_b = moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages.flatMap(function (page) {
            return page.actors.map(function (actor) { return ({ actor: actor, recId: page.recId }); });
        })) !== null && _b !== void 0 ? _b : [];
        // Dedupe by did, preferring actor-specific profiles
        var seen = new Set();
        var combined = [];
        for (var _i = 0, actorProfiles_1 = actorProfiles; _i < actorProfiles_1.length; _i++) {
            var profile = actorProfiles_1[_i];
            if (!seen.has(profile.did)) {
                seen.add(profile.did);
                combined.push({ actor: profile, recId: data === null || data === void 0 ? void 0 : data.recId });
            }
        }
        for (var _c = 0, fallbackProfiles_1 = fallbackProfiles; _c < fallbackProfiles_1.length; _c++) {
            var profile = fallbackProfiles_1[_c];
            if (!seen.has(profile.actor.did) && profile.actor.did !== did) {
                seen.add(profile.actor.did);
                combined.push(profile);
            }
        }
        return combined;
    }, [data === null || data === void 0 ? void 0 : data.suggestions, moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages, did, data === null || data === void 0 ? void 0 : data.recId]);
    var filteredProfiles = useMemo(function () {
        return allProfiles.filter(function (p) { return !dismissedDids.has(p.actor.did); });
    }, [allProfiles, dismissedDids]);
    // Fetch more when running low
    useEffect(function () {
        if (moderationOpts &&
            filteredProfiles.length < maxLength &&
            hasNextPage &&
            !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [
        filteredProfiles.length,
        maxLength,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        moderationOpts,
    ]);
    return (_jsx(ProfileGrid, { isSuggestionsLoading: isSuggestionsLoading, profiles: filteredProfiles, totalProfileCount: allProfiles.length, error: error, viewContext: "profile", onDismiss: onDismiss }));
}
export function SuggestedFollowsHome() {
    var gtMobile = useBreakpoints().gtMobile;
    var moderationOpts = useModerationOpts();
    var maxLength = gtMobile ? 4 : 6;
    var _a = useExperimentalSuggestedUsersQuery(), isSuggestionsLoading = _a.isLoading, experimentalProfiles = _a.profiles, experimentalError = _a.error;
    var _b = useSuggestedFollowsQuery({ limit: 25 }), moreSuggestions = _b.data, fetchNextPage = _b.fetchNextPage, hasNextPage = _b.hasNextPage, isFetchingNextPage = _b.isFetchingNextPage, suggestionsError = _b.error;
    var _c = useState(new Set()), dismissedDids = _c[0], setDismissedDids = _c[1];
    var onDismiss = useCallback(function (did) {
        setDismissedDids(function (prev) { return new Set(prev).add(did); });
    }, []);
    // Combine profiles from experimental query with paginated suggestions
    var allProfiles = useMemo(function () {
        var _a;
        var fallbackProfiles = (_a = moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages.flatMap(function (page) {
            return page.actors.map(function (actor) { return ({ actor: actor, recId: page.recId }); });
        })) !== null && _a !== void 0 ? _a : [];
        // Dedupe by did, preferring experimental profiles
        var seen = new Set();
        var combined = [];
        for (var _i = 0, experimentalProfiles_1 = experimentalProfiles; _i < experimentalProfiles_1.length; _i++) {
            var profile = experimentalProfiles_1[_i];
            if (!seen.has(profile.did)) {
                seen.add(profile.did);
                combined.push({ actor: profile, recId: undefined });
            }
        }
        for (var _b = 0, fallbackProfiles_2 = fallbackProfiles; _b < fallbackProfiles_2.length; _b++) {
            var profile = fallbackProfiles_2[_b];
            if (!seen.has(profile.actor.did)) {
                seen.add(profile.actor.did);
                combined.push(profile);
            }
        }
        return combined;
    }, [experimentalProfiles, moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages]);
    var filteredProfiles = useMemo(function () {
        return allProfiles.filter(function (p) { return !dismissedDids.has(p.actor.did); });
    }, [allProfiles, dismissedDids]);
    // Fetch more when running low
    useEffect(function () {
        if (moderationOpts &&
            filteredProfiles.length < maxLength &&
            hasNextPage &&
            !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [
        filteredProfiles.length,
        maxLength,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        moderationOpts,
    ]);
    return (_jsx(ProfileGrid, { isSuggestionsLoading: isSuggestionsLoading, profiles: filteredProfiles, totalProfileCount: allProfiles.length, error: experimentalError || suggestionsError, viewContext: "feed", onDismiss: onDismiss }));
}
export function ProfileGrid(_a) {
    var isSuggestionsLoading = _a.isSuggestionsLoading, error = _a.error, profiles = _a.profiles, totalProfileCount = _a.totalProfileCount, _b = _a.viewContext, viewContext = _b === void 0 ? 'feed' : _b, onDismiss = _a.onDismiss, _c = _a.isVisible, isVisible = _c === void 0 ? true : _c;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var moderationOpts = useModerationOpts();
    var gtMobile = useBreakpoints().gtMobile;
    var followDialogControl = useDialogControl();
    var isLoading = isSuggestionsLoading || !moderationOpts;
    var isProfileHeaderContext = viewContext === 'profileHeader';
    var isFeedContext = viewContext === 'feed';
    var maxLength = gtMobile ? 3 : isProfileHeaderContext ? 12 : 6;
    var minLength = gtMobile ? 3 : 4;
    // Track seen profiles
    var seenProfilesRef = useRef(new Set());
    var containerRef = useRef(null);
    var hasTrackedRef = useRef(false);
    var logContext = isFeedContext
        ? 'InterstitialDiscover'
        : isProfileHeaderContext
            ? 'Profile'
            : 'InterstitialProfile';
    // Callback to fire seen events
    var fireSeen = useCallback(function () {
        if (isLoading || error || !profiles.length)
            return;
        if (hasTrackedRef.current)
            return;
        hasTrackedRef.current = true;
        var profilesToShow = profiles.slice(0, maxLength);
        profilesToShow.forEach(function (profile, index) {
            if (!seenProfilesRef.current.has(profile.actor.did)) {
                seenProfilesRef.current.add(profile.actor.did);
                ax.metric('suggestedUser:seen', {
                    logContext: logContext,
                    recId: profile.recId,
                    position: index,
                    suggestedDid: profile.actor.did,
                    category: null,
                });
            }
        });
    }, [ax, isLoading, error, profiles, maxLength, logContext]);
    // For profile header, fire when isVisible becomes true
    useEffect(function () {
        if (isProfileHeaderContext) {
            if (!isVisible) {
                hasTrackedRef.current = false;
                return;
            }
            fireSeen();
        }
    }, [isVisible, isProfileHeaderContext, fireSeen]);
    // For feed interstitials, use IntersectionObserver to detect actual visibility
    useEffect(function () {
        if (isProfileHeaderContext)
            return; // handled above
        if (isLoading || error || !profiles.length)
            return;
        var node = containerRef.current;
        if (!node)
            return;
        // Use IntersectionObserver on web to detect when actually visible
        if (typeof IntersectionObserver !== 'undefined') {
            var observer_1 = new IntersectionObserver(function (entries) {
                var _a;
                if ((_a = entries[0]) === null || _a === void 0 ? void 0 : _a.isIntersecting) {
                    fireSeen();
                    observer_1.disconnect();
                }
            }, { threshold: 0.5 });
            // @ts-ignore - web only
            observer_1.observe(node);
            return function () { return observer_1.disconnect(); };
        }
        else {
            // On native, delay slightly to account for layout shifts during hydration
            var timeout_1 = setTimeout(function () {
                fireSeen();
            }, 500);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [isProfileHeaderContext, isLoading, error, profiles.length, fireSeen]);
    var content = isLoading
        ? Array(maxLength)
            .fill(0)
            .map(function (_, i) { return (_jsx(View, { style: [
                a.flex_1,
                gtMobile &&
                    web([
                        a.flex_0,
                        a.flex_grow,
                        { width: "calc(30% - ".concat(a.gap_md.gap / 2, "px)") },
                    ]),
            ], children: _jsx(SuggestedFollowPlaceholder, {}) }, i)); })
        : error || !profiles.length
            ? null
            : profiles.slice(0, maxLength).map(function (profile, index) { return (_jsx(Animated.View, { layout: native(LinearTransition.delay(DISMISS_ANIMATION_DURATION).easing(Easing.out(Easing.exp))), exiting: FadeOut.duration(DISMISS_ANIMATION_DURATION), 
                // for web, as the cards are static, not in a list
                entering: web(FadeIn.delay(DISMISS_ANIMATION_DURATION * 2)), style: [
                    a.flex_1,
                    gtMobile &&
                        web([
                            a.flex_0,
                            a.flex_grow,
                            { width: "calc(30% - ".concat(a.gap_md.gap / 2, "px)") },
                        ]),
                ], children: _jsx(ProfileCard.Link, { profile: profile.actor, onPress: function () {
                        ax.metric('suggestedUser:press', {
                            logContext: isFeedContext
                                ? 'InterstitialDiscover'
                                : 'InterstitialProfile',
                            recId: profile.recId,
                            position: index,
                            suggestedDid: profile.actor.did,
                            category: null,
                        });
                    }, style: [a.flex_1], children: function (_a) {
                        var hovered = _a.hovered, pressed = _a.pressed;
                        return (_jsx(CardOuter, { style: [
                                (hovered || pressed) && t.atoms.border_contrast_high,
                            ], children: _jsxs(ProfileCard.Outer, { children: [onDismiss && (_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Dismiss this suggestion"], ["Dismiss this suggestion"])))), onPress: function (e) {
                                            e.preventDefault();
                                            onDismiss(profile.actor.did);
                                            ax.metric('suggestedUser:dismiss', {
                                                logContext: isFeedContext
                                                    ? 'InterstitialDiscover'
                                                    : 'InterstitialProfile',
                                                position: index,
                                                suggestedDid: profile.actor.did,
                                                recId: profile.recId,
                                            });
                                        }, style: [
                                            a.absolute,
                                            a.z_10,
                                            a.p_xs,
                                            { top: -4, right: -4 },
                                        ], children: function (_a) {
                                            var dismissHovered = _a.hovered, dismissPressed = _a.pressed;
                                            return (_jsx(X, { size: "xs", fill: dismissHovered || dismissPressed
                                                    ? t.atoms.text.color
                                                    : t.atoms.text_contrast_medium.color }));
                                        } })), _jsxs(View, { style: [
                                            a.flex_col,
                                            a.align_center,
                                            a.gap_sm,
                                            a.pb_sm,
                                            a.mb_auto,
                                        ], children: [_jsx(ProfileCard.Avatar, { profile: profile.actor, moderationOpts: moderationOpts, disabledPreview: true, size: 88 }), _jsxs(View, { style: [a.flex_col, a.align_center, a.max_w_full], children: [_jsx(ProfileCard.Name, { profile: profile.actor, moderationOpts: moderationOpts }), _jsx(ProfileCard.Description, { profile: profile.actor, numberOfLines: 2, style: [
                                                            t.atoms.text_contrast_medium,
                                                            a.text_center,
                                                            a.text_xs,
                                                        ] })] })] }), _jsx(ProfileCard.FollowButton, { profile: profile.actor, moderationOpts: moderationOpts, logContext: "FeedInterstitial", withIcon: false, style: [a.rounded_sm], onFollow: function () {
                                            ax.metric('suggestedUser:follow', {
                                                logContext: isFeedContext
                                                    ? 'InterstitialDiscover'
                                                    : 'InterstitialProfile',
                                                location: 'Card',
                                                recId: profile.recId,
                                                position: index,
                                                suggestedDid: profile.actor.did,
                                                category: null,
                                            });
                                        } })] }) }));
                    } }) }, profile.actor.did)); });
    // Use totalProfileCount (before dismissals) for minLength check on initial render.
    var profileCountForMinCheck = totalProfileCount !== null && totalProfileCount !== void 0 ? totalProfileCount : profiles.length;
    if (error || (!isLoading && profileCountForMinCheck < minLength)) {
        ax.logger.debug("Not enough profiles to show suggested follows");
        return null;
    }
    return (_jsxs(View, { ref: containerRef, style: [
            !isProfileHeaderContext && a.border_t,
            t.atoms.border_contrast_low,
            t.atoms.bg_contrast_25,
        ], pointerEvents: IS_IOS ? 'auto' : 'box-none', children: [_jsxs(View, { style: [
                    a.px_lg,
                    a.pt_md,
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                ], pointerEvents: IS_IOS ? 'auto' : 'box-none', children: [_jsx(Text, { style: [a.text_sm, a.font_semi_bold, t.atoms.text], children: _jsx(Trans, { children: "Suggested for you" }) }), !isProfileHeaderContext && (_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["See more suggested profiles"], ["See more suggested profiles"])))), onPress: function () {
                            followDialogControl.open();
                            ax.metric('suggestedUser:seeMore', {
                                logContext: isFeedContext ? 'Explore' : 'Profile',
                            });
                        }, children: function (_a) {
                            var hovered = _a.hovered;
                            return (_jsx(Text, { style: [
                                    a.text_sm,
                                    { color: t.palette.primary_500 },
                                    hovered &&
                                        web({
                                            textDecorationLine: 'underline',
                                            textDecorationColor: t.palette.primary_500,
                                        }),
                                ], children: _jsx(Trans, { children: "See more" }) }));
                        } }))] }), _jsx(FollowDialogWithoutGuide, { control: followDialogControl }), _jsx(LayoutAnimationConfig, { skipExiting: true, skipEntering: true, children: gtMobile ? (_jsx(View, { style: [a.p_lg, a.pt_md], children: _jsx(View, { style: [a.flex_1, a.flex_row, a.flex_wrap, a.gap_md], children: content }) })) : (_jsx(BlockDrawerGesture, { children: _jsxs(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: [a.p_lg, a.pt_md, a.flex_row, a.gap_md], snapToInterval: MOBILE_CARD_WIDTH + a.gap_md.gap, decelerationRate: "fast", children: [content, !isProfileHeaderContext && (_jsx(SeeMoreSuggestedProfilesCard, { onPress: function () {
                                    followDialogControl.open();
                                    ax.metric('suggestedUser:seeMore', {
                                        logContext: 'Explore',
                                    });
                                } }))] }) })) })] }));
}
function SeeMoreSuggestedProfilesCard(_a) {
    var onPress = _a.onPress;
    var _ = useLingui()._;
    return (_jsxs(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Browse more accounts"], ["Browse more accounts"])))), onPress: onPress, style: [
            a.flex_col,
            a.align_center,
            a.justify_center,
            a.gap_sm,
            a.p_md,
            a.rounded_lg,
            { width: FINAL_CARD_WIDTH },
        ], children: [_jsx(ButtonIcon, { icon: ArrowRight, size: "lg" }), _jsx(ButtonText, { style: [a.text_md, a.font_medium, a.leading_snug, a.text_center], children: _jsx(Trans, { children: "See more" }) })] }));
}
var numFeedsToDisplay = 3;
export function SuggestedFeeds() {
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var _a = useGetPopularFeedsQuery({
        limit: numFeedsToDisplay,
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error;
    var navigation = useNavigation();
    var gtMobile = useBreakpoints().gtMobile;
    var feeds = useMemo(function () {
        var items = [];
        if (!data)
            return items;
        for (var _i = 0, _a = data.pages; _i < _a.length; _i++) {
            var page = _a[_i];
            for (var _b = 0, _c = page.feeds; _b < _c.length; _b++) {
                var feed = _c[_b];
                items.push(feed);
            }
        }
        return items;
    }, [data]);
    var content = isLoading ? (Array(numFeedsToDisplay)
        .fill(0)
        .map(function (_, i) { return _jsx(SuggestedFeedsCardPlaceholder, {}, i); })) : error || !feeds ? null : (_jsx(_Fragment, { children: feeds.slice(0, numFeedsToDisplay).map(function (feed) { return (_jsx(FeedCard.Link, { view: feed, onPress: function () {
                ax.metric('feed:interstitial:feedCard:press', {});
            }, children: function (_a) {
                var hovered = _a.hovered, pressed = _a.pressed;
                return (_jsx(CardOuter, { style: [(hovered || pressed) && t.atoms.border_contrast_high], children: _jsxs(FeedCard.Outer, { children: [_jsxs(FeedCard.Header, { children: [_jsx(FeedCard.Avatar, { src: feed.avatar }), _jsx(FeedCard.TitleAndByline, { title: feed.displayName, creator: feed.creator, uri: feed.uri })] }), _jsx(FeedCard.Description, { description: feed.description, numberOfLines: 3 })] }) }));
            } }, feed.uri)); }) }));
    return error ? null : (_jsxs(View, { style: [a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25], children: [_jsxs(View, { style: [a.pt_2xl, a.px_lg, a.flex_row, a.pb_xs], children: [_jsx(Text, { style: [
                            a.flex_1,
                            a.text_lg,
                            a.font_semi_bold,
                            t.atoms.text_contrast_medium,
                        ], children: _jsx(Trans, { children: "Some other feeds you might like" }) }), _jsx(Hashtag, { fill: t.atoms.text_contrast_low.color })] }), gtMobile ? (_jsxs(View, { style: [a.flex_1, a.px_lg, a.pt_md, a.pb_xl, a.gap_md], children: [content, _jsxs(View, { style: [
                            a.flex_row,
                            a.justify_end,
                            a.align_center,
                            a.pt_xs,
                            a.gap_md,
                        ], children: [_jsx(InlineLinkText, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Browse more suggestions"], ["Browse more suggestions"])))), to: "/search", style: [t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Browse more suggestions" }) }), _jsx(ArrowRight, { size: "sm", fill: t.atoms.text_contrast_medium.color })] })] })) : (_jsx(BlockDrawerGesture, { children: _jsx(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, snapToInterval: MOBILE_CARD_WIDTH + a.gap_md.gap, decelerationRate: "fast", children: _jsxs(View, { style: [a.px_lg, a.pt_md, a.pb_xl, a.flex_row, a.gap_md], children: [content, _jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Browse more feeds on the Explore page"], ["Browse more feeds on the Explore page"])))), onPress: function () {
                                    navigation.navigate('SearchTab');
                                }, style: [a.flex_col], children: _jsx(CardOuter, { children: _jsx(View, { style: [a.flex_1, a.justify_center], children: _jsxs(View, { style: [a.flex_row, a.px_lg], children: [_jsx(Text, { style: [a.pr_xl, a.flex_1, a.leading_snug], children: _jsx(Trans, { children: "Browse more suggestions on the Explore page" }) }), _jsx(ArrowRight, { size: "xl" })] }) }) }) })] }) }) }))] }));
}
export function ProgressGuide() {
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    return (_jsx(View, { style: [
            t.atoms.border_contrast_low,
            a.px_lg,
            a.py_lg,
            !gtMobile && { marginTop: 4 },
        ], children: _jsx(ProgressGuideList, {}) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
