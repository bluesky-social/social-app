import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { AccordionAnimation } from '#/lib/custom-animations/AccordionAnimation';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSuggestedFollowsByActorQuery, useSuggestedFollowsQuery, } from '#/state/queries/suggested-follows';
import { useBreakpoints } from '#/alf';
import { ProfileGrid } from '#/components/FeedInterstitials';
import { IS_ANDROID } from '#/env';
var DISMISS_ANIMATION_DURATION = 200;
export function ProfileHeaderSuggestedFollows(_a) {
    var actorDid = _a.actorDid;
    var gtMobile = useBreakpoints().gtMobile;
    var moderationOpts = useModerationOpts();
    var maxLength = gtMobile ? 4 : 12;
    var _b = useSuggestedFollowsByActorQuery({
        did: actorDid,
    }), isLoading = _b.isLoading, data = _b.data, error = _b.error;
    var _c = useSuggestedFollowsQuery({ limit: 25 }), moreSuggestions = _c.data, fetchNextPage = _c.fetchNextPage, hasNextPage = _c.hasNextPage, isFetchingNextPage = _c.isFetchingNextPage;
    var _d = React.useState(new Set()), dismissedDids = _d[0], setDismissedDids = _d[1];
    var _e = React.useState(new Set()), dismissingDids = _e[0], setDismissingDids = _e[1];
    var onDismiss = React.useCallback(function (did) {
        // Start the fade animation
        setDismissingDids(function (prev) { return new Set(prev).add(did); });
        // After animation completes, actually remove from list
        setTimeout(function () {
            setDismissedDids(function (prev) { return new Set(prev).add(did); });
            setDismissingDids(function (prev) {
                var next = new Set(prev);
                next.delete(did);
                return next;
            });
        }, DISMISS_ANIMATION_DURATION);
    }, []);
    // Combine profiles from the actor-specific query with fallback suggestions
    var allProfiles = React.useMemo(function () {
        var _a, _b;
        var actorProfiles = (_a = data === null || data === void 0 ? void 0 : data.suggestions) !== null && _a !== void 0 ? _a : [];
        var fallbackProfiles = (_b = moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages.flatMap(function (page) { return page.actors; })) !== null && _b !== void 0 ? _b : [];
        // Dedupe by did, preferring actor-specific profiles
        var seen = new Set();
        var combined = [];
        for (var _i = 0, actorProfiles_1 = actorProfiles; _i < actorProfiles_1.length; _i++) {
            var profile = actorProfiles_1[_i];
            if (!seen.has(profile.did)) {
                seen.add(profile.did);
                combined.push(profile);
            }
        }
        for (var _c = 0, fallbackProfiles_1 = fallbackProfiles; _c < fallbackProfiles_1.length; _c++) {
            var profile = fallbackProfiles_1[_c];
            if (!seen.has(profile.did) && profile.did !== actorDid) {
                seen.add(profile.did);
                combined.push(profile);
            }
        }
        return combined;
    }, [data === null || data === void 0 ? void 0 : data.suggestions, moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages, actorDid]);
    var filteredProfiles = React.useMemo(function () {
        return allProfiles.filter(function (p) { return !dismissedDids.has(p.did); });
    }, [allProfiles, dismissedDids]);
    // Fetch more when running low
    React.useEffect(function () {
        if (moderationOpts &&
            filteredProfiles.length < maxLength &&
            hasNextPage &&
            !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [
        filteredProfiles.length,
        maxLength,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        moderationOpts,
    ]);
    return (_jsx(ProfileGrid, { isSuggestionsLoading: isLoading, profiles: filteredProfiles, totalProfileCount: allProfiles.length, recId: data === null || data === void 0 ? void 0 : data.recId, error: error, viewContext: "profileHeader", onDismiss: onDismiss, dismissingDids: dismissingDids }));
}
export function AnimatedProfileHeaderSuggestedFollows(_a) {
    var isExpanded = _a.isExpanded, actorDid = _a.actorDid;
    var gtMobile = useBreakpoints().gtMobile;
    var moderationOpts = useModerationOpts();
    var maxLength = gtMobile ? 4 : 12;
    var _b = useSuggestedFollowsByActorQuery({
        did: actorDid,
    }), isLoading = _b.isLoading, data = _b.data, error = _b.error;
    var _c = useSuggestedFollowsQuery({ limit: 25 }), moreSuggestions = _c.data, fetchNextPage = _c.fetchNextPage, hasNextPage = _c.hasNextPage, isFetchingNextPage = _c.isFetchingNextPage;
    var _d = React.useState(new Set()), dismissedDids = _d[0], setDismissedDids = _d[1];
    var _e = React.useState(new Set()), dismissingDids = _e[0], setDismissingDids = _e[1];
    var onDismiss = React.useCallback(function (did) {
        // Start the fade animation
        setDismissingDids(function (prev) { return new Set(prev).add(did); });
        // After animation completes, actually remove from list
        setTimeout(function () {
            setDismissedDids(function (prev) { return new Set(prev).add(did); });
            setDismissingDids(function (prev) {
                var next = new Set(prev);
                next.delete(did);
                return next;
            });
        }, DISMISS_ANIMATION_DURATION);
    }, []);
    // Combine profiles from the actor-specific query with fallback suggestions
    var allProfiles = React.useMemo(function () {
        var _a, _b;
        var actorProfiles = (_a = data === null || data === void 0 ? void 0 : data.suggestions) !== null && _a !== void 0 ? _a : [];
        var fallbackProfiles = (_b = moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages.flatMap(function (page) { return page.actors; })) !== null && _b !== void 0 ? _b : [];
        // Dedupe by did, preferring actor-specific profiles
        var seen = new Set();
        var combined = [];
        for (var _i = 0, actorProfiles_2 = actorProfiles; _i < actorProfiles_2.length; _i++) {
            var profile = actorProfiles_2[_i];
            if (!seen.has(profile.did)) {
                seen.add(profile.did);
                combined.push(profile);
            }
        }
        for (var _c = 0, fallbackProfiles_2 = fallbackProfiles; _c < fallbackProfiles_2.length; _c++) {
            var profile = fallbackProfiles_2[_c];
            if (!seen.has(profile.did) && profile.did !== actorDid) {
                seen.add(profile.did);
                combined.push(profile);
            }
        }
        return combined;
    }, [data === null || data === void 0 ? void 0 : data.suggestions, moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages, actorDid]);
    var filteredProfiles = React.useMemo(function () {
        return allProfiles.filter(function (p) { return !dismissedDids.has(p.did); });
    }, [allProfiles, dismissedDids]);
    // Fetch more when running low
    React.useEffect(function () {
        if (moderationOpts &&
            filteredProfiles.length < maxLength &&
            hasNextPage &&
            !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [
        filteredProfiles.length,
        maxLength,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        moderationOpts,
    ]);
    if (!allProfiles.length && !isLoading)
        return null;
    /* NOTE (caidanw):
     * Android does not work well with this feature yet.
     * This issue stems from Android not allowing dragging on clickable elements in the profile header.
     * Blocking the ability to scroll on Android is too much of a trade-off for now.
     **/
    if (IS_ANDROID)
        return null;
    return (_jsx(AccordionAnimation, { isExpanded: isExpanded, children: _jsx(ProfileGrid, { isSuggestionsLoading: isLoading, profiles: filteredProfiles, totalProfileCount: allProfiles.length, recId: data === null || data === void 0 ? void 0 : data.recId, error: error, viewContext: "profileHeader", onDismiss: onDismiss, dismissingDids: dismissingDids, isVisible: isExpanded }) }));
}
