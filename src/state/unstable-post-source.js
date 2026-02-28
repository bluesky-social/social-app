import { useEffect, useId, useState } from 'react';
import { AtUri } from '@atproto/api';
import { Logger } from '#/logger';
/**
 * Separate logger for better debugging
 */
var logger = Logger.create(Logger.Context.PostSource);
/**
 * A cache of sources that will be consumed by the post thread view. This is
 * cleaned up any time a source is consumed.
 */
var transientSources = new Map();
/**
 * A cache of sources that have been consumed by the post thread view. This is
 * not cleaned up, but because we use a new ID for each post thread view that
 * consumes a source, this is never reused unless a user navigates back to a
 * post thread view that has not been dropped from memory.
 */
var consumedSources = new Map();
/**
 * For stashing the feed that the user was browsing when they clicked on a post.
 *
 * Used for FeedFeedback and other ephemeral non-critical systems.
 */
export function setUnstablePostSource(key, source) {
    assertValidDevOnly(key, "setUnstablePostSource key should be a URI containing a handle, received ".concat(key, " \u2014\u00A0use buildPostSourceKey"));
    logger.debug('set', { key: key, source: source });
    transientSources.set(key, source);
}
/**
 * This hook is unstable and should only be used for FeedFeedback and other
 * ephemeral non-critical systems. Views that use this hook will continue to
 * return a reference to the same source until those views are dropped from
 * memory.
 */
export function useUnstablePostSource(key) {
    var id = useId();
    var source = useState(function () {
        assertValidDevOnly(key, "consumeUnstablePostSource key should be a URI containing a handle, received ".concat(key, " \u2014\u00A0be sure to use buildPostSourceKey when setting the source"), true);
        var source = consumedSources.get(id) || transientSources.get(key);
        if (source) {
            logger.debug('consume', { id: id, key: key, source: source });
            transientSources.delete(key);
            consumedSources.set(id, source);
        }
        return source;
    })[0];
    useEffect(function () {
        return function () {
            consumedSources.delete(id);
            logger.debug('cleanup', { id: id });
        };
    }, [id]);
    return source;
}
/**
 * Builds a post source key. This (atm) is a URI where the `host` is the post
 * author's handle, not DID.
 */
export function buildPostSourceKey(key, handle) {
    var urip = new AtUri(key);
    // @ts-expect-error TODO new-sdk-migration
    urip.host = handle;
    return urip.toString();
}
/**
 * Just a lil dev helper
 */
function assertValidDevOnly(key, message, beChill) {
    if (beChill === void 0) { beChill = false; }
    if (__DEV__) {
        var urip = new AtUri(key);
        if (urip.host.startsWith('did:')) {
            if (beChill) {
                logger.warn(message);
            }
            else {
                throw new Error(message);
            }
        }
    }
}
