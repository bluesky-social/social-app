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
import { memo, useEffect } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { popularInterests, useInterestsDisplayNames } from '#/lib/interests';
import { logger } from '#/logger';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { BlockDrawerGesture } from '#/view/shell/BlockDrawerGesture';
import { atoms as a, useTheme } from '#/alf';
import { boostInterests, InterestTabs } from '#/components/InterestTabs';
import * as ProfileCard from '#/components/ProfileCard';
import { SubtleHover } from '#/components/SubtleHover';
import { useAnalytics } from '#/analytics';
export function useLoadEnoughProfiles(_a) {
    var interest = _a.interest, data = _a.data, isLoading = _a.isLoading, isFetchingNextPage = _a.isFetchingNextPage, hasNextPage = _a.hasNextPage, fetchNextPage = _a.fetchNextPage;
    var profileCount = (data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) {
        return page.actors.filter(function (actor) { var _a; return !((_a = actor.viewer) === null || _a === void 0 ? void 0 : _a.following); });
    }).length) || 0;
    var isAnyLoading = isLoading || isFetchingNextPage;
    var isEnoughProfiles = profileCount > 3;
    var shouldFetchMore = !isEnoughProfiles && hasNextPage && !!interest;
    useEffect(function () {
        if (shouldFetchMore && !isAnyLoading) {
            logger.info('Not enough suggested accounts - fetching more');
            fetchNextPage();
        }
    }, [shouldFetchMore, fetchNextPage, isAnyLoading, interest]);
    return {
        isReady: !shouldFetchMore,
    };
}
export function SuggestedAccountsTabBar(_a) {
    var _b;
    var selectedInterest = _a.selectedInterest, onSelectInterest = _a.onSelectInterest, hideDefaultTab = _a.hideDefaultTab, defaultTabLabel = _a.defaultTabLabel;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var interestsDisplayNames = useInterestsDisplayNames();
    var preferences = usePreferencesQuery().data;
    var personalizedInterests = (_b = preferences === null || preferences === void 0 ? void 0 : preferences.interests) === null || _b === void 0 ? void 0 : _b.tags;
    var interests = Object.keys(interestsDisplayNames)
        .sort(boostInterests(popularInterests))
        .sort(boostInterests(personalizedInterests));
    return (_jsx(BlockDrawerGesture, { children: _jsx(InterestTabs, { interests: hideDefaultTab ? interests : __spreadArray(['all'], interests, true), selectedInterest: selectedInterest || (hideDefaultTab ? interests[0] : 'all'), onSelectTab: function (tab) {
                ax.metric('explore:suggestedAccounts:tabPressed', { tab: tab });
                onSelectInterest(tab === 'all' ? null : tab);
            }, interestsDisplayNames: hideDefaultTab
                ? interestsDisplayNames
                : __assign({ all: defaultTabLabel || _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["For You"], ["For You"])))) }, interestsDisplayNames) }) }));
}
/**
 * Profile card for suggested accounts. Note: border is on the bottom edge
 */
var SuggestedProfileCard = function (_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, recId = _a.recId, position = _a.position;
    var t = useTheme();
    var ax = useAnalytics();
    return (_jsx(ProfileCard.Link, { profile: profile, style: [a.flex_1], onPress: function () {
            ax.metric('suggestedUser:press', {
                logContext: 'Explore',
                recId: recId,
                position: position,
                suggestedDid: profile.did,
                category: null,
            });
        }, children: function (s) { return (_jsxs(_Fragment, { children: [_jsx(SubtleHover, { hover: s.hovered || s.pressed }), _jsx(View, { style: [
                        a.flex_1,
                        a.w_full,
                        a.py_lg,
                        a.px_lg,
                        a.border_t,
                        t.atoms.border_contrast_low,
                    ], children: _jsxs(ProfileCard.Outer, { children: [_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.FollowButton, { profile: profile, moderationOpts: moderationOpts, withIcon: false, logContext: "ExploreSuggestedAccounts", onFollow: function () {
                                            ax.metric('suggestedUser:follow', {
                                                logContext: 'Explore',
                                                location: 'Card',
                                                recId: recId,
                                                position: position,
                                                suggestedDid: profile.did,
                                                category: null,
                                            });
                                        } })] }), _jsx(ProfileCard.Description, { profile: profile, numberOfLines: 2 })] }) })] })); } }));
};
SuggestedProfileCard = memo(SuggestedProfileCard);
export { SuggestedProfileCard };
var templateObject_1;
