var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { AppBskyUnspeccedDefs } from '@atproto/api';
import { getPostRecord, getThreadPostNoUnauthenticatedUI, getThreadPostUI, getTraversalMetadata, storeTraversalMetadata, } from '#/state/queries/usePostThread/utils';
import * as views from '#/state/queries/usePostThread/views';
export function sortAndAnnotateThreadItems(thread, _a) {
    var _b, _c, _d, _e, _f;
    var threadgateHiddenReplies = _a.threadgateHiddenReplies, moderationOpts = _a.moderationOpts, view = _a.view, skipModerationHandling = _a.skipModerationHandling;
    var threadItems = [];
    var otherThreadItems = [];
    var metadatas = new Map();
    traversal: for (var i = 0; i < thread.length; i++) {
        var item = thread[i];
        var parentMetadata = void 0;
        var metadata = void 0;
        if (AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
            parentMetadata = metadatas.get(((_c = (_b = getPostRecord(item.value.post).reply) === null || _b === void 0 ? void 0 : _b.parent) === null || _c === void 0 ? void 0 : _c.uri) || '');
            metadata = getTraversalMetadata({
                item: item,
                parentMetadata: parentMetadata,
                prevItem: thread.at(i - 1),
                nextItem: thread.at(i + 1),
            });
            storeTraversalMetadata(metadatas, metadata);
        }
        if (item.depth < 0) {
            /*
             * Parents are ignored until we find the anchor post, then we walk
             * _up_ from there.
             */
        }
        else if (item.depth === 0) {
            if (AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(item.value)) {
                threadItems.push(views.threadPostNoUnauthenticated(item));
            }
            else if (AppBskyUnspeccedDefs.isThreadItemNotFound(item.value)) {
                threadItems.push(views.threadPostNotFound(item));
            }
            else if (AppBskyUnspeccedDefs.isThreadItemBlocked(item.value)) {
                threadItems.push(views.threadPostBlocked(item));
            }
            else if (AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
                var post = views.threadPost({
                    uri: item.uri,
                    depth: item.depth,
                    value: item.value,
                    moderationOpts: moderationOpts,
                    threadgateHiddenReplies: threadgateHiddenReplies,
                });
                threadItems.push(post);
                parentTraversal: for (var pi = i - 1; pi >= 0; pi--) {
                    var parent_1 = thread[pi];
                    if (AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(parent_1.value)) {
                        var post_1 = views.threadPostNoUnauthenticated(parent_1);
                        post_1.ui = getThreadPostNoUnauthenticatedUI({
                            depth: parent_1.depth,
                            // ignore for now
                            // prevItemDepth: thread[pi - 1]?.depth,
                            nextItemDepth: (_d = thread[pi + 1]) === null || _d === void 0 ? void 0 : _d.depth,
                        });
                        threadItems.unshift(post_1);
                        // for now, break parent traversal at first no-unauthed
                        break parentTraversal;
                    }
                    else if (AppBskyUnspeccedDefs.isThreadItemNotFound(parent_1.value)) {
                        threadItems.unshift(views.threadPostNotFound(parent_1));
                        break parentTraversal;
                    }
                    else if (AppBskyUnspeccedDefs.isThreadItemBlocked(parent_1.value)) {
                        threadItems.unshift(views.threadPostBlocked(parent_1));
                        break parentTraversal;
                    }
                    else if (AppBskyUnspeccedDefs.isThreadItemPost(parent_1.value)) {
                        threadItems.unshift(views.threadPost({
                            uri: parent_1.uri,
                            depth: parent_1.depth,
                            value: parent_1.value,
                            moderationOpts: moderationOpts,
                            threadgateHiddenReplies: threadgateHiddenReplies,
                        }));
                    }
                }
            }
        }
        else if (item.depth > 0) {
            /*
             * The API does not send down any unavailable replies, so this will
             * always be false (for now). If we ever wanted to tombstone them here,
             * we could.
             */
            var shouldBreak = AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(item.value) ||
                AppBskyUnspeccedDefs.isThreadItemNotFound(item.value) ||
                AppBskyUnspeccedDefs.isThreadItemBlocked(item.value);
            if (shouldBreak) {
                var branch = getBranch(thread, i, item.depth);
                // could insert tombstone
                i = branch.end;
                continue traversal;
            }
            else if (AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
                if (parentMetadata) {
                    /*
                     * Set this value before incrementing the `repliesSeenCounter` later
                     * on, since `repliesSeenCounter` is 1-indexed and `replyIndex` is
                     * 0-indexed.
                     */
                    metadata.replyIndex = parentMetadata.repliesSeenCounter;
                }
                var post = views.threadPost({
                    uri: item.uri,
                    depth: item.depth,
                    value: item.value,
                    moderationOpts: moderationOpts,
                    threadgateHiddenReplies: threadgateHiddenReplies,
                });
                if (!post.isBlurred || skipModerationHandling) {
                    /*
                     * Not moderated, need to insert it
                     */
                    threadItems.push(post);
                    /*
                     * Update seen reply count of parent
                     */
                    if (parentMetadata) {
                        parentMetadata.repliesSeenCounter += 1;
                    }
                }
                else {
                    /*
                     * Moderated in some way, we're going to walk children
                     */
                    var parent_2 = post;
                    var parentIsTopLevelReply = parent_2.depth === 1;
                    // get sub tree
                    var branch = getBranch(thread, i, item.depth);
                    if (parentIsTopLevelReply) {
                        // push branch anchor into sorted array
                        otherThreadItems.push(parent_2);
                        // skip branch anchor in branch traversal
                        var startIndex = branch.start + 1;
                        for (var ci = startIndex; ci <= branch.end; ci++) {
                            var child = thread[ci];
                            if (AppBskyUnspeccedDefs.isThreadItemPost(child.value)) {
                                var childParentMetadata = metadatas.get(((_f = (_e = getPostRecord(child.value.post).reply) === null || _e === void 0 ? void 0 : _e.parent) === null || _f === void 0 ? void 0 : _f.uri) || '');
                                var childMetadata = getTraversalMetadata({
                                    item: child,
                                    prevItem: thread[ci - 1],
                                    nextItem: thread[ci + 1],
                                    parentMetadata: childParentMetadata,
                                });
                                storeTraversalMetadata(metadatas, childMetadata);
                                if (childParentMetadata) {
                                    /*
                                     * Set this value before incrementing the
                                     * `repliesSeenCounter` later on, since `repliesSeenCounter`
                                     * is 1-indexed and `replyIndex` is 0-indexed.
                                     */
                                    childMetadata.replyIndex =
                                        childParentMetadata.repliesSeenCounter;
                                }
                                var childPost = views.threadPost({
                                    uri: child.uri,
                                    depth: child.depth,
                                    value: child.value,
                                    moderationOpts: moderationOpts,
                                    threadgateHiddenReplies: threadgateHiddenReplies,
                                });
                                /*
                                 * If a child is moderated in any way, drop it an its sub-branch
                                 * entirely. To reveal these, the user must navigate to the
                                 * parent post directly.
                                 */
                                if (childPost.isBlurred) {
                                    ci = getBranch(thread, ci, child.depth).end;
                                }
                                else {
                                    otherThreadItems.push(childPost);
                                    if (childParentMetadata) {
                                        childParentMetadata.repliesSeenCounter += 1;
                                    }
                                }
                            }
                            else {
                                /*
                                 * Drop the rest of the branch if we hit anything unexpected
                                 */
                                break;
                            }
                        }
                    }
                    /*
                     * Skip to next branch
                     */
                    i = branch.end;
                    continue traversal;
                }
            }
        }
    }
    /*
     * Both `threadItems` and `otherThreadItems` now need to be traversed again to fully compute
     * UI state based on collected metadata. These arrays will be muted in situ.
     */
    for (var _i = 0, _g = [threadItems, otherThreadItems]; _i < _g.length; _i++) {
        var subset = _g[_i];
        for (var i = 0; i < subset.length; i++) {
            var item = subset[i];
            var prevItem = subset.at(i - 1);
            var nextItem = subset.at(i + 1);
            if (item.type === 'threadPost') {
                var metadata = metadatas.get(item.uri);
                if (metadata) {
                    if (metadata.parentMetadata) {
                        /*
                         * Track what's before/after now that we've applied moderation
                         */
                        if ((prevItem === null || prevItem === void 0 ? void 0 : prevItem.type) === 'threadPost')
                            metadata.prevItemDepth = prevItem === null || prevItem === void 0 ? void 0 : prevItem.depth;
                        if ((nextItem === null || nextItem === void 0 ? void 0 : nextItem.type) === 'threadPost')
                            metadata.nextItemDepth = nextItem === null || nextItem === void 0 ? void 0 : nextItem.depth;
                        /**
                         * Item is also the last "sibling" if its index matches the total
                         * number of replies we're actually able to render to the page.
                         */
                        var isLastSiblingDueToMissingReplies = metadata.replyIndex ===
                            metadata.parentMetadata.repliesSeenCounter - 1;
                        /*
                         * Item can also be the last "sibling" if we know we don't have a
                         * next item, OR if that next item's depth is less than this item's
                         * depth (meaning it's a sibling of the parent, not a child of this
                         * item).
                         */
                        var isImplicitlyLastSibling = metadata.nextItemDepth === undefined ||
                            metadata.nextItemDepth < metadata.depth;
                        /*
                         * Ok now we can set the last sibling state.
                         */
                        metadata.isLastSibling =
                            isImplicitlyLastSibling || isLastSiblingDueToMissingReplies;
                        /*
                         * Item is the last "child" in a branch if there is no next item,
                         * or if the next item's depth is less than this item's depth (a
                         * sibling of the parent) or equal to this item's depth (a sibling
                         * of this item)
                         */
                        metadata.isLastChild =
                            metadata.nextItemDepth === undefined ||
                                metadata.nextItemDepth <= metadata.depth;
                        /*
                         * If this is the last sibling, it's implicitly part of the last
                         * branch of this sub-tree.
                         */
                        if (metadata.isLastSibling) {
                            metadata.isPartOfLastBranchFromDepth = metadata.depth;
                            /**
                             * If the parent is part of the last branch of the sub-tree, so
                             * is the child. However, if the child is also a last sibling,
                             * then we need to start tracking `isPartOfLastBranchFromDepth`
                             * from this point onwards, always updating it to the depth of
                             * the last sibling as we go down.
                             */
                            if (!metadata.isLastSibling &&
                                metadata.parentMetadata.isPartOfLastBranchFromDepth) {
                                metadata.isPartOfLastBranchFromDepth =
                                    metadata.parentMetadata.isPartOfLastBranchFromDepth;
                            }
                        }
                        /*
                         * If this is the last sibling, and the parent has unhydrated replies,
                         * at some point down the line we will need to show a "read more".
                         */
                        if (metadata.parentMetadata.repliesUnhydrated > 0 &&
                            metadata.isLastSibling) {
                            metadata.upcomingParentReadMore = metadata.parentMetadata;
                        }
                        /*
                         * Copy in the parent's upcoming read more, if it exists. Once we
                         * reach the bottom, we'll insert a "read more"
                         */
                        if (metadata.parentMetadata.upcomingParentReadMore) {
                            metadata.upcomingParentReadMore =
                                metadata.parentMetadata.upcomingParentReadMore;
                        }
                        /*
                         * Copy in the parent's skipped indents
                         */
                        metadata.skippedIndentIndices = new Set(__spreadArray([], metadata.parentMetadata.skippedIndentIndices, true));
                        /**
                         * If this is the last sibling, and the parent has no unhydrated
                         * replies, then we know we can skip an indent line.
                         */
                        if (metadata.parentMetadata.repliesUnhydrated <= 0 &&
                            metadata.isLastSibling) {
                            /**
                             * Depth is 2 more than the 0-index of the indent calculation
                             * bc of how we render these. So instead of handling that in the
                             * component, we just adjust that back to 0-index here.
                             */
                            metadata.skippedIndentIndices.add(item.depth - 2);
                        }
                    }
                    /*
                     * If this post has unhydrated replies, and it is the last child, then
                     * it itself needs a "read more"
                     */
                    if (metadata.repliesUnhydrated > 0 && metadata.isLastChild) {
                        metadata.precedesChildReadMore = true;
                        subset.splice(i + 1, 0, views.readMore(metadata));
                        i++; // skip next iteration
                    }
                    /*
                     * Tree-view only.
                     *
                     * If there's an upcoming parent read more, this branch is part of a
                     * branch of the sub-tree that is deeper than the
                     * `upcomingParentReadMore`, and the item following the current item
                     * is either undefined or less-or-equal-to the depth of the
                     * `upcomingParentReadMore`, then we know it's time to drop in the
                     * parent read more.
                     */
                    if (view === 'tree' &&
                        metadata.upcomingParentReadMore &&
                        metadata.isPartOfLastBranchFromDepth &&
                        metadata.isPartOfLastBranchFromDepth >=
                            metadata.upcomingParentReadMore.depth &&
                        (metadata.nextItemDepth === undefined ||
                            metadata.nextItemDepth <= metadata.upcomingParentReadMore.depth)) {
                        subset.splice(i + 1, 0, views.readMore(metadata.upcomingParentReadMore));
                        i++;
                    }
                    /**
                     * Only occurs for the first item in the thread, which may have
                     * additional parents not included in this request.
                     */
                    if (item.value.moreParents) {
                        metadata.followsReadMoreUp = true;
                        subset.splice(i, 0, views.readMoreUp(metadata));
                        i++;
                    }
                    /*
                     * Calculate the final UI state for the thread item.
                     */
                    item.ui = getThreadPostUI(metadata);
                }
            }
        }
    }
    return {
        threadItems: threadItems,
        otherThreadItems: otherThreadItems,
    };
}
export function buildThread(_a) {
    var _b, _c, _d;
    var threadItems = _a.threadItems, otherThreadItems = _a.otherThreadItems, serverOtherThreadItems = _a.serverOtherThreadItems, isLoading = _a.isLoading, hasSession = _a.hasSession, otherItemsVisible = _a.otherItemsVisible, hasOtherThreadItems = _a.hasOtherThreadItems, showOtherItems = _a.showOtherItems;
    /**
     * `threadItems` is memoized here, so don't mutate it directly.
     */
    var items = __spreadArray([], threadItems, true);
    if (isLoading) {
        var anchorPost = items.at(0);
        var hasAnchorFromCache = anchorPost && anchorPost.type === 'threadPost';
        var skeletonReplies = hasAnchorFromCache
            ? ((_b = anchorPost.value.post.replyCount) !== null && _b !== void 0 ? _b : 4)
            : 4;
        if (!items.length) {
            items.push(views.skeleton({
                key: 'anchor-skeleton',
                item: 'anchor',
            }));
        }
        if (hasSession) {
            // we might have this from cache
            var replyDisabled = hasAnchorFromCache &&
                ((_c = anchorPost.value.post.viewer) === null || _c === void 0 ? void 0 : _c.replyDisabled) === true;
            if (hasAnchorFromCache) {
                if (!replyDisabled) {
                    items.push({
                        type: 'replyComposer',
                        key: 'replyComposer',
                    });
                }
            }
            else {
                items.push(views.skeleton({
                    key: 'replyComposer',
                    item: 'replyComposer',
                }));
            }
        }
        for (var i = 0; i < skeletonReplies; i++) {
            items.push(views.skeleton({
                key: "anchor-skeleton-reply-".concat(i),
                item: 'reply',
            }));
        }
    }
    else {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.type === 'threadPost' &&
                item.depth === 0 &&
                !((_d = item.value.post.viewer) === null || _d === void 0 ? void 0 : _d.replyDisabled) &&
                hasSession) {
                items.splice(i + 1, 0, {
                    type: 'replyComposer',
                    key: 'replyComposer',
                });
                break;
            }
        }
        if (otherThreadItems.length || hasOtherThreadItems) {
            if (otherItemsVisible) {
                items.push.apply(items, otherThreadItems);
                items.push.apply(items, serverOtherThreadItems);
            }
            else {
                items.push({
                    type: 'showOtherReplies',
                    key: 'showOtherReplies',
                    onPress: showOtherItems,
                });
            }
        }
    }
    return items;
}
/**
 * Get the start and end index of a "branch" of the thread. A "branch" is a
 * parent and it's children (not siblings). Returned indices are inclusive of
 * the parent and its last child.
 *
 *   items[]               (index, depth)
 *     └─┬ anchor ──────── (0, 0)
 *       ├─── branch ───── (1, 1)
 *       ├──┬ branch ───── (2, 1) (start)
 *       │  ├──┬ leaf ──── (3, 2)
 *       │  │  └── leaf ── (4, 3)
 *       │  └─── leaf ──── (5, 2) (end)
 *       ├─── branch ───── (6, 1)
 *       └─── branch ───── (7, 1)
 *
 *   const { start: 2, end: 5, length: 3 } = getBranch(items, 2, 1)
 */
export function getBranch(thread, branchStartIndex, branchStartDepth) {
    var end = branchStartIndex;
    for (var ci = branchStartIndex + 1; ci < thread.length; ci++) {
        var next = thread[ci];
        if (next.depth > branchStartDepth) {
            end = ci;
        }
        else {
            end = ci - 1;
            break;
        }
    }
    return {
        start: branchStartIndex,
        end: end,
        length: end - branchStartIndex,
    };
}
