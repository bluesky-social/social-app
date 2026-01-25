import { useMemo } from 'react';
import { useAnalytics } from '#/analytics';
export function useIsBskyTeam() {
    var ax = useAnalytics();
    return useMemo(function () { return ax.features.enabled(ax.features.IsBskyTeam); }, [ax.features]);
}
