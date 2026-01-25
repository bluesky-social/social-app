import { useMemo } from 'react';
import { BSKY_SERVICE } from '#/lib/constants';
/**
 * Thin `useMemo` wrapper that marks the metadata as memoized and provides a
 * type guard.
 */
export function useMeta(metadata) {
    var m = useMemo(function () { return metadata; }, [metadata]);
    if (!m)
        return;
    // @ts-ignore
    m.__meta = true;
    return m;
}
export function accountToSessionMetadata(account) {
    if (!account) {
        return;
    }
    else {
        return {
            did: account.did,
            isBskyPds: account.service.startsWith(BSKY_SERVICE),
        };
    }
}
