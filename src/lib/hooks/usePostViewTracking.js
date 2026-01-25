import { useCallback, useRef } from 'react';
import { useAnalytics } from '#/analytics';
/**
 * Hook that returns a callback to track post:view events.
 * Handles deduplication so the same post URI is only tracked once per mount.
 *
 * @param logContext - The context where the post is being viewed
 * @returns A callback that accepts a post and logs the view event
 */
export function usePostViewTracking(logContext) {
    var ax = useAnalytics();
    var seenUrisRef = useRef(new Set());
    var trackPostView = useCallback(function (post) {
        if (seenUrisRef.current.has(post.uri))
            return;
        seenUrisRef.current.add(post.uri);
        ax.metric('post:view', {
            uri: post.uri,
            authorDid: post.author.did,
            logContext: logContext,
        });
    }, [ax, logContext]);
    return trackPostView;
}
