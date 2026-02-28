import { AppBskyFeedPost, AppBskyFeedThreadgate, AppBskyUnspeccedDefs, AtUri, } from '@atproto/api';
import { isDevMode } from '#/storage/hooks/dev-mode';
import * as bsky from '#/types/bsky';
export function getThreadgateRecord(view) {
    return bsky.dangerousIsType(view === null || view === void 0 ? void 0 : view.record, AppBskyFeedThreadgate.isRecord)
        ? view === null || view === void 0 ? void 0 : view.record
        : undefined;
}
export function getRootPostAtUri(post) {
    var _a, _b;
    if (bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord)) {
        /**
         * If the record has no `reply` field, it is a root post.
         */
        if (!post.record.reply) {
            return new AtUri(post.uri);
        }
        if ((_b = (_a = post.record.reply) === null || _a === void 0 ? void 0 : _a.root) === null || _b === void 0 ? void 0 : _b.uri) {
            return new AtUri(post.record.reply.root.uri);
        }
    }
}
export function getPostRecord(post) {
    return post.record;
}
export function getTraversalMetadata(_a) {
    var item = _a.item, prevItem = _a.prevItem, nextItem = _a.nextItem, parentMetadata = _a.parentMetadata;
    if (!AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
        throw new Error("Expected thread item to be a post");
    }
    var repliesCount = item.value.post.replyCount || 0;
    var repliesUnhydrated = item.value.moreReplies || 0;
    var metadata = {
        depth: item.depth,
        /*
         * Unknown until after traversal
         */
        isLastChild: false,
        /*
         * Unknown until after traversal
         */
        isLastSibling: false,
        /*
         * If it's a top level reply, bc we render each top-level branch as a
         * separate tree, it's implicitly part of the last branch. For subsequent
         * replies, we'll override this after traversal.
         */
        isPartOfLastBranchFromDepth: item.depth === 1 ? 1 : undefined,
        nextItemDepth: nextItem === null || nextItem === void 0 ? void 0 : nextItem.depth,
        parentMetadata: parentMetadata,
        prevItemDepth: prevItem === null || prevItem === void 0 ? void 0 : prevItem.depth,
        /*
         * Unknown until after traversal
         */
        precedesChildReadMore: false,
        /*
         * Unknown until after traversal
         */
        followsReadMoreUp: false,
        postData: {
            uri: item.uri,
            authorHandle: item.value.post.author.handle,
        },
        repliesCount: repliesCount,
        repliesUnhydrated: repliesUnhydrated,
        repliesSeenCounter: 0,
        replyIndex: 0,
        skippedIndentIndices: new Set(),
    };
    if (isDevMode()) {
        // @ts-ignore dev only for debugging
        metadata.postData.text = getPostRecord(item.value.post).text;
    }
    return metadata;
}
export function storeTraversalMetadata(metadatas, metadata) {
    metadatas.set(metadata.postData.uri, metadata);
    if (isDevMode()) {
        // @ts-ignore dev only for debugging
        metadatas.set(metadata.postData.text, metadata);
        // @ts-ignore
        window.__thread = metadatas;
    }
}
export function getThreadPostUI(_a) {
    var depth = _a.depth, repliesCount = _a.repliesCount, prevItemDepth = _a.prevItemDepth, isLastChild = _a.isLastChild, skippedIndentIndices = _a.skippedIndentIndices, repliesSeenCounter = _a.repliesSeenCounter, repliesUnhydrated = _a.repliesUnhydrated, precedesChildReadMore = _a.precedesChildReadMore, followsReadMoreUp = _a.followsReadMoreUp;
    var isReplyAndHasReplies = depth > 0 &&
        repliesCount > 0 &&
        (repliesCount - repliesUnhydrated === repliesSeenCounter ||
            repliesSeenCounter > 0);
    return {
        isAnchor: depth === 0,
        showParentReplyLine: followsReadMoreUp ||
            (!!prevItemDepth && prevItemDepth !== 0 && prevItemDepth < depth),
        showChildReplyLine: depth < 0 || isReplyAndHasReplies,
        indent: depth,
        /*
         * If there are no slices below this one, or the next slice has a depth <=
         * than the depth of this post, it's the last child of the reply tree. It
         * is not necessarily the last leaf in the parent branch, since it could
         * have another sibling.
         */
        isLastChild: isLastChild,
        skippedIndentIndices: skippedIndentIndices,
        precedesChildReadMore: precedesChildReadMore !== null && precedesChildReadMore !== void 0 ? precedesChildReadMore : false,
    };
}
export function getThreadPostNoUnauthenticatedUI(_a) {
    var depth = _a.depth, prevItemDepth = _a.prevItemDepth;
    return {
        showChildReplyLine: depth < 0,
        showParentReplyLine: Boolean(prevItemDepth && prevItemDepth < depth),
    };
}
