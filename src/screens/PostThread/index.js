import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Trans } from '@lingui/react/macro';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import { useFeedFeedback } from '#/state/feed-feedback';
import { PostThreadContextProvider, usePostThread, } from '#/state/queries/usePostThread';
import { useSession } from '#/state/session';
import { useShellLayout } from '#/state/shell/shell-layout';
import { useUnstablePostSource } from '#/state/unstable-post-source';
import { List } from '#/view/com/util/List';
import { HeaderDropdown } from '#/screens/PostThread/components/HeaderDropdown';
import { ThreadComposePrompt } from '#/screens/PostThread/components/ThreadComposePrompt';
import { ThreadError } from '#/screens/PostThread/components/ThreadError';
import { ThreadItemAnchor, ThreadItemAnchorSkeleton, } from '#/screens/PostThread/components/ThreadItemAnchor';
import { ThreadItemAnchorNoUnauthenticated } from '#/screens/PostThread/components/ThreadItemAnchorNoUnauthenticated';
import { ThreadItemPost, ThreadItemPostSkeleton, } from '#/screens/PostThread/components/ThreadItemPost';
import { ThreadItemPostNoUnauthenticated } from '#/screens/PostThread/components/ThreadItemPostNoUnauthenticated';
import { ThreadItemPostTombstone } from '#/screens/PostThread/components/ThreadItemPostTombstone';
import { ThreadItemReadMore } from '#/screens/PostThread/components/ThreadItemReadMore';
import { ThreadItemReadMoreUp } from '#/screens/PostThread/components/ThreadItemReadMoreUp';
import { ThreadItemReplyComposerSkeleton } from '#/screens/PostThread/components/ThreadItemReplyComposer';
import { ThreadItemShowOtherReplies } from '#/screens/PostThread/components/ThreadItemShowOtherReplies';
import { ThreadItemTreePost, ThreadItemTreePostSkeleton, } from '#/screens/PostThread/components/ThreadItemTreePost';
import { atoms as a, native, platform, useBreakpoints, web } from '#/alf';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
import { useAnalytics } from '#/analytics';
var PARENT_CHUNK_SIZE = 5;
var CHILDREN_CHUNK_SIZE = 50;
export function PostThread(_a) {
    var _b, _c;
    var uri = _a.uri;
    var ax = useAnalytics();
    var gtMobile = useBreakpoints().gtMobile;
    var hasSession = useSession().hasSession;
    var initialNumToRender = useInitialNumToRender();
    var windowHeight = useWindowDimensions().height;
    var anchorPostSource = useUnstablePostSource(uri);
    var feedFeedback = useFeedFeedback(anchorPostSource === null || anchorPostSource === void 0 ? void 0 : anchorPostSource.feedSourceInfo, hasSession);
    /*
     * One query to rule them all
     */
    var thread = usePostThread({ anchor: uri });
    var _d = useMemo(function () {
        var hasParents = false;
        for (var _i = 0, _a = thread.data.items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.type === 'threadPost' && item.depth === 0) {
                return { anchor: item, hasParents: hasParents };
            }
            hasParents = true;
        }
        return { hasParents: hasParents };
    }, [thread.data.items]), anchor = _d.anchor, hasParents = _d.hasParents;
    // Track post:view event when anchor post is viewed
    var seenPostUriRef = useRef(null);
    useEffect(function () {
        if ((anchor === null || anchor === void 0 ? void 0 : anchor.type) === 'threadPost' &&
            anchor.value.post.uri !== seenPostUriRef.current) {
            var post = anchor.value.post;
            seenPostUriRef.current = post.uri;
            ax.metric('post:view', {
                uri: post.uri,
                authorDid: post.author.did,
                logContext: 'Post',
                feedDescriptor: feedFeedback.feedDescriptor,
            });
        }
    }, [ax, anchor, feedFeedback.feedDescriptor]);
    // Track post:view events for parent posts and replies (non-anchor posts)
    var trackThreadItemView = usePostViewTracking('PostThreadItem');
    var openComposer = useOpenComposer().openComposer;
    var optimisticOnPostReply = useCallback(function (payload) {
        if (payload) {
            var replyToUri = payload.replyToUri, posts = payload.posts;
            if (replyToUri && posts.length) {
                thread.actions.insertReplies(replyToUri, posts);
            }
        }
    }, [thread]);
    var onReplyToAnchor = useCallback(function () {
        if ((anchor === null || anchor === void 0 ? void 0 : anchor.type) !== 'threadPost') {
            return;
        }
        var post = anchor.value.post;
        openComposer({
            replyTo: {
                uri: anchor.uri,
                cid: post.cid,
                text: post.record.text,
                author: post.author,
                embed: post.embed,
                moderation: anchor.moderation,
                langs: post.record.langs,
            },
            onPostSuccess: optimisticOnPostReply,
            logContext: 'PostReply',
        });
        if (anchorPostSource) {
            feedFeedback.sendInteraction({
                item: post.uri,
                event: 'app.bsky.feed.defs#interactionReply',
                feedContext: anchorPostSource.post.feedContext,
                reqId: anchorPostSource.post.reqId,
            });
        }
    }, [
        anchor,
        openComposer,
        optimisticOnPostReply,
        anchorPostSource,
        feedFeedback,
    ]);
    var isRoot = !!anchor && anchor.value.post.record.reply === undefined;
    var canReply = !((_c = (_b = anchor === null || anchor === void 0 ? void 0 : anchor.value.post) === null || _b === void 0 ? void 0 : _b.viewer) === null || _c === void 0 ? void 0 : _c.replyDisabled);
    var _e = useState(PARENT_CHUNK_SIZE), maxParentCount = _e[0], setMaxParentCount = _e[1];
    var _f = useState(CHILDREN_CHUNK_SIZE), maxChildrenCount = _f[0], setMaxChildrenCount = _f[1];
    var totalParentCount = useRef(0); // recomputed below
    var totalChildrenCount = useRef(thread.data.items.length); // recomputed below
    var listRef = useRef(null);
    var anchorRef = useRef(null);
    var headerRef = useRef(null);
    /*
     * On a cold load, parents are not prepended until the anchor post has
     * rendered as the first item in the list. This gives us a consistent
     * reference point for which to pin the anchor post to the top of the screen.
     *
     * We simulate a cold load any time the user changes the view or sort params
     * so that this handling is consistent.
     *
     * On native, `maintainVisibleContentPosition={{minIndexForVisible: 0}}` gives
     * us this for free, since the anchor post is the first item in the list.
     *
     * On web, `onContentSizeChange` is used to get ahead of next paint and handle
     * this scrolling.
     */
    var _g = useState(true), deferParents = _g[0], setDeferParents = _g[1];
    /**
     * Used to flag whether we should scroll to the anchor post. On a cold load,
     * this is always true. And when a user changes thread parameters, we also
     * manually set this to true.
     */
    var shouldHandleScroll = useRef(true);
    /**
     * Called any time the content size of the list changes. Could be a fresh
     * render, items being added to the list, or any resize that changes the
     * scrollable size of the content.
     *
     * We want this to fire every time we change params (which will reset
     * `deferParents` via `onLayout` on the anchor post, due to the key change),
     * or click into a new post (which will result in a fresh `deferParents`
     * hook).
     *
     * The result being: any intentional change in view by the user will result
     * in the anchor being pinned as the first item.
     */
    var onContentSizeChangeWebOnly = web(function () {
        var list = listRef.current;
        var anchor = anchorRef.current;
        var header = headerRef.current;
        if (list && anchor && header && shouldHandleScroll.current) {
            var anchorOffsetTop = anchor.getBoundingClientRect().top;
            var headerHeight = header.getBoundingClientRect().height;
            /*
             * `deferParents` is `true` on a cold load, and always reset to
             * `true` when params change via `prepareForParamsUpdate`.
             *
             * On a cold load or a push to a new post, on the first pass of this
             * logic, the anchor post is the first item in the list. Therefore
             * `anchorOffsetTop - headerHeight` will be 0.
             *
             * When a user changes thread params, on the first pass of this logic,
             * the anchor post may not move (if there are no parents above it), or it
             * may have gone off the screen above, because of the sudden lack of
             * parents due to `deferParents === true`. This negative value (minus
             * `headerHeight`) will result in a _negative_ `offset` value, which will
             * scroll the anchor post _down_ to the top of the screen.
             *
             * However, `prepareForParamsUpdate` also resets scroll to `0`, so when a user
             * changes params, the anchor post's offset will actually be equivalent
             * to the `headerHeight` because of how the DOM is stacked on web.
             * Therefore, `anchorOffsetTop - headerHeight` will once again be 0,
             * which means the first pass in this case will result in no scroll.
             *
             * Then, once parents are prepended, this will fire again. Now, the
             * `anchorOffsetTop` will be positive, which minus the header height,
             * will give us a _positive_ offset, which will scroll the anchor post
             * back _up_ to the top of the screen.
             */
            var offset = anchorOffsetTop - headerHeight;
            list.scrollToOffset({ offset: offset });
            /*
             * After we manage to do a positive adjustment, we need to ensure this
             * doesn't run again until scroll handling is requested again via
             * `shouldHandleScroll.current === true` and a params change via
             * `prepareForParamsUpdate`.
             *
             * The `isRoot` here is needed because if we're looking at the anchor
             * post, this handler will not fire after `deferParents` is set to
             * `false`, since there are no parents to render above it. In this case,
             * we want to make sure `shouldHandleScroll` is set to `false` right away
             * so that subsequent size changes unrelated to a params change (like
             * pagination) do not affect scroll.
             */
            if (offset > 0 || isRoot)
                shouldHandleScroll.current = false;
        }
    });
    /**
     * Ditto the above, but for native.
     */
    var onContentSizeChangeNativeOnly = native(function () {
        var list = listRef.current;
        var anchor = anchorRef.current;
        if (list && anchor && shouldHandleScroll.current) {
            /*
             * `prepareForParamsUpdate` is called any time the user changes thread params like
             * `view` or `sort`, which sets `deferParents(true)` and resets the
             * scroll to the top of the list. However, there is a split second
             * where the top of the list is wherever the parents _just were_. So if
             * there were parents, the anchor is not at the top of the list just
             * prior to this handler being called.
             *
             * Once this handler is called, the anchor post is the first item in
             * the list (because of `deferParents` being `true`), and so we can
             * synchronously scroll the list back to the top of the list (which is
             * 0 on native, no need to handle `headerHeight`).
             */
            list.scrollToOffset({
                animated: false,
                offset: 0,
            });
            /*
             * After this first pass, `deferParents` will be `false`, and those
             * will render in. However, the anchor post will retain its position
             * because of `maintainVisibleContentPosition` handling on native. So we
             * don't need to let this handler run again, like we do on web.
             */
            shouldHandleScroll.current = false;
        }
    });
    /**
     * Called any time the user changes thread params, such as `view` or `sort`.
     * Prepares the UI for repositioning of the scroll so that the anchor post is
     * always at the top after a params change.
     *
     * No need to handle max parents here, deferParents will handle that and we
     * want it to re-render with the same items above the anchor.
     */
    var prepareForParamsUpdate = useCallback(function () {
        /**
         * Truncate list so that anchor post is the first item in the list. Manual
         * scroll handling on web is predicated on this, and on native, this allows
         * `maintainVisibleContentPosition` to do its thing.
         */
        setDeferParents(true);
        // reset this to a lower value for faster re-render
        setMaxChildrenCount(CHILDREN_CHUNK_SIZE);
        // set flag
        shouldHandleScroll.current = true;
    }, [setDeferParents, setMaxChildrenCount]);
    var setSortWrapped = useCallback(function (sort) {
        prepareForParamsUpdate();
        thread.actions.setSort(sort);
    }, [thread, prepareForParamsUpdate]);
    var setViewWrapped = useCallback(function (view) {
        prepareForParamsUpdate();
        thread.actions.setView(view);
    }, [thread, prepareForParamsUpdate]);
    var onStartReached = function () {
        if (thread.state.isFetching)
            return;
        // can be true after `prepareForParamsUpdate` is called
        if (deferParents)
            return;
        // prevent any state mutations if we know we're done
        if (maxParentCount >= totalParentCount.current)
            return;
        setMaxParentCount(function (n) { return n + PARENT_CHUNK_SIZE; });
    };
    var onEndReached = function () {
        if (thread.state.isFetching)
            return;
        // can be true after `prepareForParamsUpdate` is called
        if (deferParents)
            return;
        // prevent any state mutations if we know we're done
        if (maxChildrenCount >= totalChildrenCount.current)
            return;
        setMaxChildrenCount(function (prev) { return prev + CHILDREN_CHUNK_SIZE; });
    };
    var slices = useMemo(function () {
        var results = [];
        if (!thread.data.items.length)
            return results;
        /*
         * Pagination hack, tracks the # of items below the anchor post.
         */
        var childrenCount = 0;
        for (var i = 0; i < thread.data.items.length; i++) {
            var item = thread.data.items[i];
            /*
             * Need to check `depth`, since not found or blocked posts are not
             * `threadPost`s, but still have `depth`.
             */
            var hasDepth = 'depth' in item;
            /*
             * Handle anchor post.
             */
            if (hasDepth && item.depth === 0) {
                results.push(item);
                // Recalculate total parents current index.
                totalParentCount.current = i;
                // Recalculate total children using (length - 1) - current index.
                totalChildrenCount.current = thread.data.items.length - 1 - i;
                /*
                 * Walk up the parents, limiting by `maxParentCount`
                 */
                if (!deferParents) {
                    var start = i - 1;
                    if (start >= 0) {
                        var limit = Math.max(0, start - maxParentCount);
                        for (var pi = start; pi >= limit; pi--) {
                            results.unshift(thread.data.items[pi]);
                        }
                    }
                }
            }
            else {
                // ignore any parent items
                if (item.type === 'readMoreUp' || (hasDepth && item.depth < 0))
                    continue;
                // can exit early if we've reached the max children count
                if (childrenCount > maxChildrenCount)
                    break;
                results.push(item);
                childrenCount++;
            }
        }
        return results;
    }, [thread, deferParents, maxParentCount, maxChildrenCount]);
    var isTombstoneView = useMemo(function () {
        if (slices.length > 1)
            return false;
        return slices.every(function (s) { return s.type === 'threadPostBlocked' || s.type === 'threadPostNotFound'; });
    }, [slices]);
    var renderItem = useCallback(function (_a) {
        var _b, _c, _d, _e, _f, _g, _h, _j;
        var item = _a.item, index = _a.index;
        if (item.type === 'threadPost') {
            if (item.depth < 0) {
                return (_jsx(ThreadItemPost, { item: item, threadgateRecord: (_c = (_b = thread.data.threadgate) === null || _b === void 0 ? void 0 : _b.record) !== null && _c !== void 0 ? _c : undefined, overrides: {
                        topBorder: index === 0,
                    }, onPostSuccess: optimisticOnPostReply }));
            }
            else if (item.depth === 0) {
                return (
                /*
                 * Keep this view wrapped so that the anchor post is always index 0
                 * in the list and `maintainVisibleContentPosition` can do its
                 * thing.
                 */
                _jsxs(View, { collapsable: false, children: [_jsx(View
                        /*
                         * IMPORTANT: this is a load-bearing key on all platforms. We
                         * want to force `onLayout` to fire any time the thread params
                         * change so that `deferParents` is always reset to `false` once
                         * the anchor post is rendered.
                         *
                         * If we ever add additional thread params to this screen, they
                         * will need to be added here.
                         */
                        , { ref: anchorRef, onLayout: function () { return setDeferParents(false); } }, item.uri + thread.state.view + thread.state.sort), _jsx(ThreadItemAnchor, { item: item, threadgateRecord: (_e = (_d = thread.data.threadgate) === null || _d === void 0 ? void 0 : _d.record) !== null && _e !== void 0 ? _e : undefined, onPostSuccess: optimisticOnPostReply, postSource: anchorPostSource })] }));
            }
            else {
                if (thread.state.view === 'tree') {
                    return (_jsx(ThreadItemTreePost, { item: item, threadgateRecord: (_g = (_f = thread.data.threadgate) === null || _f === void 0 ? void 0 : _f.record) !== null && _g !== void 0 ? _g : undefined, overrides: {
                            moderation: thread.state.otherItemsVisible && item.depth > 0,
                        }, onPostSuccess: optimisticOnPostReply }));
                }
                else {
                    return (_jsx(ThreadItemPost, { item: item, threadgateRecord: (_j = (_h = thread.data.threadgate) === null || _h === void 0 ? void 0 : _h.record) !== null && _j !== void 0 ? _j : undefined, overrides: {
                            moderation: thread.state.otherItemsVisible && item.depth > 0,
                        }, onPostSuccess: optimisticOnPostReply }));
                }
            }
        }
        else if (item.type === 'threadPostNoUnauthenticated') {
            if (item.depth < 0) {
                return _jsx(ThreadItemPostNoUnauthenticated, { item: item });
            }
            else if (item.depth === 0) {
                return _jsx(ThreadItemAnchorNoUnauthenticated, {});
            }
        }
        else if (item.type === 'readMore') {
            return (_jsx(ThreadItemReadMore, { item: item, view: thread.state.view === 'tree' ? 'tree' : 'linear' }));
        }
        else if (item.type === 'readMoreUp') {
            return _jsx(ThreadItemReadMoreUp, { item: item });
        }
        else if (item.type === 'threadPostBlocked') {
            return _jsx(ThreadItemPostTombstone, { type: "blocked" });
        }
        else if (item.type === 'threadPostNotFound') {
            return _jsx(ThreadItemPostTombstone, { type: "not-found" });
        }
        else if (item.type === 'replyComposer') {
            return (_jsx(View, { children: gtMobile && (_jsx(ThreadComposePrompt, { onPressCompose: onReplyToAnchor })) }));
        }
        else if (item.type === 'showOtherReplies') {
            return _jsx(ThreadItemShowOtherReplies, { onPress: item.onPress });
        }
        else if (item.type === 'skeleton') {
            if (item.item === 'anchor') {
                return _jsx(ThreadItemAnchorSkeleton, {});
            }
            else if (item.item === 'reply') {
                if (thread.state.view === 'linear') {
                    return _jsx(ThreadItemPostSkeleton, { index: index });
                }
                else {
                    return _jsx(ThreadItemTreePostSkeleton, { index: index });
                }
            }
            else if (item.item === 'replyComposer') {
                return _jsx(ThreadItemReplyComposerSkeleton, {});
            }
        }
        return null;
    }, [
        thread,
        optimisticOnPostReply,
        onReplyToAnchor,
        gtMobile,
        anchorPostSource,
    ]);
    var defaultListFooterHeight = hasParents ? windowHeight - 200 : undefined;
    return (_jsxs(PostThreadContextProvider, { context: thread.context, children: [_jsxs(Layout.Header.Outer, { headerRef: headerRef, children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { context: "description", children: "Post" }) }) }), _jsx(Layout.Header.Slot, { children: _jsx(HeaderDropdown, { sort: thread.state.sort, setSort: setSortWrapped, view: thread.state.view, setView: setViewWrapped }) })] }), thread.state.error ? (_jsx(ThreadError, { error: thread.state.error, onRetry: thread.actions.refetch })) : (_jsx(List, { ref: listRef, data: slices, renderItem: renderItem, keyExtractor: keyExtractor, onContentSizeChange: platform({
                    web: onContentSizeChangeWebOnly,
                    default: onContentSizeChangeNativeOnly,
                }), onStartReached: onStartReached, onEndReached: onEndReached, onEndReachedThreshold: 4, onStartReachedThreshold: 1, onItemSeen: function (item) {
                    // Track post:view for parent posts and replies (non-anchor posts)
                    if (item.type === 'threadPost' && item.depth !== 0) {
                        trackThreadItemView(item.value.post);
                    }
                }, 
                /**
                 * NATIVE ONLY
                 * {@link https://reactnative.dev/docs/scrollview#maintainvisiblecontentposition}
                 */
                maintainVisibleContentPosition: { minIndexForVisible: 0 }, desktopFixedHeight: true, sideBorders: false, ListFooterComponent: _jsx(ListFooter
                /*
                 * On native, if `deferParents` is true, we need some extra buffer to
                 * account for the `on*ReachedThreshold` values.
                 *
                 * Otherwise, and on web, this value needs to be the height of
                 * the viewport _minus_ a sensible min-post height e.g. 200, so
                 * that there's enough scroll remaining to get the anchor post
                 * back to the top of the screen when handling scroll.
                 */
                , { 
                    /*
                     * On native, if `deferParents` is true, we need some extra buffer to
                     * account for the `on*ReachedThreshold` values.
                     *
                     * Otherwise, and on web, this value needs to be the height of
                     * the viewport _minus_ a sensible min-post height e.g. 200, so
                     * that there's enough scroll remaining to get the anchor post
                     * back to the top of the screen when handling scroll.
                     */
                    height: platform({
                        web: defaultListFooterHeight,
                        default: deferParents
                            ? windowHeight * 2
                            : defaultListFooterHeight,
                    }), style: isTombstoneView ? { borderTopWidth: 0 } : undefined }), initialNumToRender: initialNumToRender, 
                /**
                 * Default: 21
                 */
                windowSize: 7, 
                /**
                 * Default: 10
                 */
                maxToRenderPerBatch: 5, 
                /**
                 * Default: 50
                 */
                updateCellsBatchingPeriod: 100 })), !gtMobile && canReply && hasSession && (_jsx(MobileComposePrompt, { onPressReply: onReplyToAnchor }))] }));
}
function MobileComposePrompt(_a) {
    var onPressReply = _a.onPressReply;
    var footerHeight = useShellLayout().footerHeight;
    var animatedStyle = useAnimatedStyle(function () {
        return {
            bottom: footerHeight.get(),
        };
    });
    return (_jsx(Animated.View, { style: [a.fixed, a.left_0, a.right_0, animatedStyle], children: _jsx(ThreadComposePrompt, { onPressCompose: onPressReply }) }));
}
var keyExtractor = function (item) {
    return item.key;
};
