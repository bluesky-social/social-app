import { useMemo } from 'react';
import { useInterestsDisplayNames } from '#/lib/interests';
import { useActorSearch } from '#/state/queries/actor-search';
import { useGetSuggestedUsersQuery } from '#/state/queries/trending/useGetSuggestedUsersQuery';
/**
 * Conditional hook, used in case a user is a non-english speaker, in which
 * case we fall back to searching for users instead of our more curated set.
 */
export function useSuggestedUsers(_a) {
    var _b = _a.category, category = _b === void 0 ? null : _b, _c = _a.search, search = _c === void 0 ? false : _c, overrideInterests = _a.overrideInterests;
    var interestsDisplayNames = useInterestsDisplayNames();
    var curated = useGetSuggestedUsersQuery({
        enabled: !search,
        category: category,
        overrideInterests: overrideInterests,
    });
    var searched = useActorSearch({
        enabled: !!search,
        // use user's app language translation for this value
        query: category ? interestsDisplayNames[category] : '',
        limit: 10,
    });
    return useMemo(function () {
        var _a;
        if (search) {
            return {
                // we're not paginating right now
                data: (searched === null || searched === void 0 ? void 0 : searched.data)
                    ? {
                        actors: (_a = searched.data.pages.flatMap(function (p) { return p.actors; })) !== null && _a !== void 0 ? _a : [],
                    }
                    : undefined,
                isLoading: searched.isLoading,
                error: searched.error,
                isRefetching: searched.isRefetching,
                refetch: searched.refetch,
            };
        }
        else {
            return {
                data: curated.data,
                isLoading: curated.isLoading,
                error: curated.error,
                isRefetching: curated.isRefetching,
                refetch: curated.refetch,
            };
        }
    }, [curated, searched, search]);
}
