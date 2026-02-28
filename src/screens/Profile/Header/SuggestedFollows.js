import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccordionAnimation } from '#/lib/custom-animations/AccordionAnimation';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSuggestedFollowsByActorQuery, useSuggestedFollowsQuery, } from '#/state/queries/suggested-follows';
import { useBreakpoints } from '#/alf';
import { ProfileGrid } from '#/components/FeedInterstitials';
import { IS_ANDROID } from '#/env';
export function ProfileHeaderSuggestedFollows(_a) {
    var isExpanded = _a.isExpanded, actorDid = _a.actorDid;
    var _b = useProfileHeaderSuggestions(actorDid), allProfiles = _b.allProfiles, filteredProfiles = _b.filteredProfiles, onDismiss = _b.onDismiss, isLoading = _b.isLoading, error = _b.error;
    if (!allProfiles.length && !isLoading)
        return null;
    /* NOTE (caidanw):
     * Android does not work well with this feature yet.
     * This issue stems from Android not allowing dragging on clickable elements in the profile header.
     * Blocking the ability to scroll on Android is too much of a trade-off for now.
     **/
    if (IS_ANDROID)
        return null;
    return (_jsx(AccordionAnimation, { isExpanded: isExpanded, children: _jsx(ProfileGrid, { isSuggestionsLoading: isLoading, profiles: filteredProfiles, totalProfileCount: allProfiles.length, error: error, viewContext: "profileHeader", onDismiss: onDismiss, isVisible: isExpanded }) }));
}
function useProfileHeaderSuggestions(actorDid) {
    var gtMobile = useBreakpoints().gtMobile;
    var moderationOpts = useModerationOpts();
    var maxLength = gtMobile ? 4 : 12;
    var _a = useSuggestedFollowsByActorQuery({
        did: actorDid,
    }), isLoading = _a.isLoading, data = _a.data, error = _a.error;
    var _b = useSuggestedFollowsQuery({ limit: 25 }), moreSuggestions = _b.data, fetchNextPage = _b.fetchNextPage, hasNextPage = _b.hasNextPage, isFetchingNextPage = _b.isFetchingNextPage;
    var _c = useState(new Set()), dismissedDids = _c[0], setDismissedDids = _c[1];
    var onDismiss = useCallback(function (did) {
        setDismissedDids(function (prev) { return new Set(prev).add(did); });
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
            if (!seen.has(profile.actor.did) && profile.actor.did !== actorDid) {
                seen.add(profile.actor.did);
                combined.push(profile);
            }
        }
        return combined;
    }, [data === null || data === void 0 ? void 0 : data.suggestions, moreSuggestions === null || moreSuggestions === void 0 ? void 0 : moreSuggestions.pages, actorDid, data === null || data === void 0 ? void 0 : data.recId]);
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
    return {
        allProfiles: allProfiles,
        filteredProfiles: filteredProfiles,
        onDismiss: onDismiss,
        isLoading: isLoading,
        error: error,
    };
}
