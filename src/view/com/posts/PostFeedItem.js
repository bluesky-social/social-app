import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBskyFeedDefs, AppBskyFeedPost, AppBskyFeedThreadgate, AtUri, RichText as RichTextAPI, } from '@atproto/api';
import { useQueryClient } from '@tanstack/react-query';
import { MAX_POST_LINES } from '#/lib/constants';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { usePalette } from '#/lib/hooks/usePalette';
import { makeProfileLink } from '#/lib/routes/links';
import { countLines } from '#/lib/strings/helpers';
import { POST_TOMBSTONE, usePostShadow, } from '#/state/cache/post-shadow';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { unstableCacheProfileView } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';
import { buildPostSourceKey, setUnstablePostSource, } from '#/state/unstable-post-source';
import { Link } from '#/view/com/util/Link';
import { PostMeta } from '#/view/com/util/PostMeta';
import { PreviewableUserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a } from '#/alf';
import { ContentHider } from '#/components/moderation/ContentHider';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { Embed } from '#/components/Post/Embed';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';
import { PostRepliedTo } from '#/components/Post/PostRepliedTo';
import { ShowMoreTextButton } from '#/components/Post/ShowMoreTextButton';
import { PostControls } from '#/components/PostControls';
import { DiscoverDebug } from '#/components/PostControls/DiscoverDebug';
import { RichText } from '#/components/RichText';
import { SubtleHover } from '#/components/SubtleHover';
import { useAnalytics } from '#/analytics';
import { useActorStatus } from '#/features/liveNow';
import * as bsky from '#/types/bsky';
import { PostFeedReason } from './PostFeedReason';
export function PostFeedItem(_a) {
    var post = _a.post, record = _a.record, reason = _a.reason, feedContext = _a.feedContext, reqId = _a.reqId, moderation = _a.moderation, parentAuthor = _a.parentAuthor, showReplyTo = _a.showReplyTo, isThreadChild = _a.isThreadChild, isThreadLastChild = _a.isThreadLastChild, isThreadParent = _a.isThreadParent, hideTopBorder = _a.hideTopBorder, isParentBlocked = _a.isParentBlocked, isParentNotFound = _a.isParentNotFound, rootPost = _a.rootPost, onShowLess = _a.onShowLess;
    var postShadowed = usePostShadow(post);
    var richText = useMemo(function () {
        return new RichTextAPI({
            text: record.text,
            facets: record.facets,
        });
    }, [record]);
    if (postShadowed === POST_TOMBSTONE) {
        return null;
    }
    if (richText && moderation) {
        return (_jsx(FeedItemInner
        // Safeguard from clobbering per-post state below:
        , { post: postShadowed, record: record, reason: reason, feedContext: feedContext, reqId: reqId, richText: richText, parentAuthor: parentAuthor, showReplyTo: showReplyTo, moderation: moderation, isThreadChild: isThreadChild, isThreadLastChild: isThreadLastChild, isThreadParent: isThreadParent, hideTopBorder: hideTopBorder, isParentBlocked: isParentBlocked, isParentNotFound: isParentNotFound, rootPost: rootPost, onShowLess: onShowLess }, postShadowed.uri));
    }
    return null;
}
var FeedItemInner = function (_a) {
    var _b, _c;
    var post = _a.post, record = _a.record, reason = _a.reason, feedContext = _a.feedContext, reqId = _a.reqId, richText = _a.richText, moderation = _a.moderation, parentAuthor = _a.parentAuthor, showReplyTo = _a.showReplyTo, isThreadChild = _a.isThreadChild, isThreadLastChild = _a.isThreadLastChild, isThreadParent = _a.isThreadParent, hideTopBorder = _a.hideTopBorder, isParentBlocked = _a.isParentBlocked, isParentNotFound = _a.isParentNotFound, rootPost = _a.rootPost, onShowLess = _a.onShowLess;
    var ax = useAnalytics();
    var queryClient = useQueryClient();
    var openComposer = useOpenComposer().openComposer;
    var pal = usePalette('default');
    var _d = useState(false), hover = _d[0], setHover = _d[1];
    var href = useMemo(function () {
        var urip = new AtUri(post.uri);
        return [makeProfileLink(post.author, 'post', urip.rkey), urip.rkey];
    }, [post.uri, post.author])[0];
    var _e = useFeedFeedbackContext(), sendInteraction = _e.sendInteraction, feedSourceInfo = _e.feedSourceInfo, feedDescriptor = _e.feedDescriptor;
    var onPressReply = function () {
        sendInteraction({
            item: post.uri,
            event: 'app.bsky.feed.defs#interactionReply',
            feedContext: feedContext,
            reqId: reqId,
        });
        openComposer({
            replyTo: {
                uri: post.uri,
                cid: post.cid,
                text: record.text || '',
                author: post.author,
                embed: post.embed,
                moderation: moderation,
                langs: record.langs,
            },
            logContext: 'PostReply',
        });
    };
    var onOpenAuthor = function () {
        sendInteraction({
            item: post.uri,
            event: 'app.bsky.feed.defs#clickthroughAuthor',
            feedContext: feedContext,
            reqId: reqId,
        });
        ax.metric('post:clickthroughAuthor', {
            uri: post.uri,
            authorDid: post.author.did,
            logContext: 'FeedItem',
            feedDescriptor: feedDescriptor,
        });
    };
    var onOpenReposter = function () {
        sendInteraction({
            item: post.uri,
            event: 'app.bsky.feed.defs#clickthroughReposter',
            feedContext: feedContext,
            reqId: reqId,
        });
    };
    var onOpenEmbed = function () {
        sendInteraction({
            item: post.uri,
            event: 'app.bsky.feed.defs#clickthroughEmbed',
            feedContext: feedContext,
            reqId: reqId,
        });
        ax.metric('post:clickthroughEmbed', {
            uri: post.uri,
            authorDid: post.author.did,
            logContext: 'FeedItem',
            feedDescriptor: feedDescriptor,
        });
    };
    var onBeforePress = function () {
        sendInteraction({
            item: post.uri,
            event: 'app.bsky.feed.defs#clickthroughItem',
            feedContext: feedContext,
            reqId: reqId,
        });
        ax.metric('post:clickthroughItem', {
            uri: post.uri,
            authorDid: post.author.did,
            logContext: 'FeedItem',
            feedDescriptor: feedDescriptor,
        });
        unstableCacheProfileView(queryClient, post.author);
        setUnstablePostSource(buildPostSourceKey(post.uri, post.author.handle), {
            feedSourceInfo: feedSourceInfo,
            post: {
                post: post,
                reason: AppBskyFeedDefs.isReasonRepost(reason) ? reason : undefined,
                feedContext: feedContext,
                reqId: reqId,
            },
        });
    };
    var outerStyles = [
        styles.outer,
        {
            borderColor: pal.colors.border,
            paddingBottom: isThreadLastChild || (!isThreadChild && !isThreadParent)
                ? 8
                : undefined,
            borderTopWidth: hideTopBorder || isThreadChild ? 0 : StyleSheet.hairlineWidth,
        },
    ];
    /**
     * If `post[0]` in this slice is the actual root post (not an orphan thread),
     * then we may have a threadgate record to reference
     */
    var threadgateRecord = bsky.dangerousIsType((_b = rootPost.threadgate) === null || _b === void 0 ? void 0 : _b.record, AppBskyFeedThreadgate.isRecord)
        ? rootPost.threadgate.record
        : undefined;
    var live = useActorStatus(post.author).isActive;
    var viaRepost = useMemo(function () {
        if (AppBskyFeedDefs.isReasonRepost(reason) && reason.uri && reason.cid) {
            return {
                uri: reason.uri,
                cid: reason.cid,
            };
        }
    }, [reason]);
    return (_jsxs(Link, { testID: "feedItem-by-".concat(post.author.handle), style: outerStyles, href: href, noFeedback: true, accessible: false, onBeforePress: onBeforePress, dataSet: { feedContext: feedContext }, onPointerEnter: function () {
            setHover(true);
        }, onPointerLeave: function () {
            setHover(false);
        }, children: [_jsx(SubtleHover, { hover: hover }), _jsxs(View, { style: { flexDirection: 'row', gap: 10, paddingLeft: 8 }, children: [_jsx(View, { style: { width: 42 }, children: isThreadChild && (_jsx(View, { style: [
                                styles.replyLine,
                                {
                                    flexGrow: 1,
                                    backgroundColor: pal.colors.replyLine,
                                    marginBottom: 4,
                                },
                            ] })) }), _jsx(View, { style: [a.pt_sm, a.flex_shrink], children: reason && (_jsx(PostFeedReason, { reason: reason, moderation: moderation, onOpenReposter: onOpenReposter })) })] }), _jsxs(View, { style: styles.layout, children: [_jsxs(View, { style: styles.layoutAvi, children: [_jsx(PreviewableUserAvatar, { size: 42, profile: post.author, moderation: moderation.ui('avatar'), type: ((_c = post.author.associated) === null || _c === void 0 ? void 0 : _c.labeler) ? 'labeler' : 'user', onBeforePress: onOpenAuthor, live: live }), isThreadParent && (_jsx(View, { style: [
                                    styles.replyLine,
                                    {
                                        flexGrow: 1,
                                        backgroundColor: pal.colors.replyLine,
                                        marginTop: live ? 8 : 4,
                                    },
                                ] }))] }), _jsxs(View, { style: styles.layoutContent, children: [_jsx(PostMeta, { author: post.author, moderation: moderation, timestamp: post.indexedAt, postHref: href, onOpenAuthor: onOpenAuthor }), showReplyTo &&
                                (parentAuthor || isParentBlocked || isParentNotFound) && (_jsx(PostRepliedTo, { parentAuthor: parentAuthor, isParentBlocked: isParentBlocked, isParentNotFound: isParentNotFound })), _jsx(LabelsOnMyPost, { post: post }), _jsx(PostContent, { moderation: moderation, richText: richText, postEmbed: post.embed, postAuthor: post.author, onOpenEmbed: onOpenEmbed, post: post, threadgateRecord: threadgateRecord }), _jsx(PostControls, { post: post, record: record, richText: richText, onPressReply: onPressReply, logContext: "FeedItem", feedContext: feedContext, reqId: reqId, threadgateRecord: threadgateRecord, onShowLess: onShowLess, viaRepost: viaRepost })] }), _jsx(DiscoverDebug, { feedContext: feedContext })] })] }));
};
FeedItemInner = memo(FeedItemInner);
var PostContent = function (_a) {
    var post = _a.post, moderation = _a.moderation, richText = _a.richText, postEmbed = _a.postEmbed, postAuthor = _a.postAuthor, onOpenEmbed = _a.onOpenEmbed, threadgateRecord = _a.threadgateRecord;
    var currentAccount = useSession().currentAccount;
    var _b = useState(function () { return countLines(richText.text) >= MAX_POST_LINES; }), limitLines = _b[0], setLimitLines = _b[1];
    var threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
        threadgateRecord: threadgateRecord,
    });
    var additionalPostAlerts = useMemo(function () {
        var _a, _b, _c;
        var isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri);
        var rootPostUri = bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord)
            ? ((_c = (_b = (_a = post.record) === null || _a === void 0 ? void 0 : _a.reply) === null || _b === void 0 ? void 0 : _b.root) === null || _c === void 0 ? void 0 : _c.uri) || post.uri
            : undefined;
        var isControlledByViewer = rootPostUri && new AtUri(rootPostUri).host === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
        return isControlledByViewer && isPostHiddenByThreadgate
            ? [
                {
                    type: 'reply-hidden',
                    source: { type: 'user', did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did },
                    priority: 6,
                },
            ]
            : [];
    }, [post, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, threadgateHiddenReplies]);
    var onPressShowMore = useCallback(function () {
        setLimitLines(false);
    }, [setLimitLines]);
    return (_jsxs(ContentHider, { testID: "contentHider-post", modui: moderation.ui('contentList'), ignoreMute: true, childContainerStyle: styles.contentHiderChild, children: [_jsx(PostAlerts, { modui: moderation.ui('contentList'), style: [a.pb_xs], additionalCauses: additionalPostAlerts }), richText.text ? (_jsxs(View, { style: [a.mb_2xs], children: [_jsx(RichText, { enableTags: true, testID: "postText", value: richText, numberOfLines: limitLines ? MAX_POST_LINES : undefined, style: [a.flex_1, a.text_md], authorHandle: postAuthor.handle, shouldProxyLinks: true }), limitLines && (_jsx(ShowMoreTextButton, { style: [a.text_md], onPress: onPressShowMore }))] })) : undefined, postEmbed ? (_jsx(View, { style: [a.pb_xs], children: _jsx(Embed, { embed: postEmbed, moderation: moderation, onOpen: onOpenEmbed, viewContext: PostEmbedViewContext.Feed }) })) : null] }));
};
PostContent = memo(PostContent);
var styles = StyleSheet.create({
    outer: {
        paddingLeft: 10,
        paddingRight: 15,
        cursor: 'pointer',
    },
    replyLine: {
        width: 2,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    layout: {
        flexDirection: 'row',
        marginTop: 1,
    },
    layoutAvi: {
        paddingLeft: 8,
        paddingRight: 10,
        position: 'relative',
        zIndex: 999,
    },
    layoutContent: {
        position: 'relative',
        flex: 1,
        zIndex: 0,
    },
    alert: {
        marginTop: 6,
        marginBottom: 6,
    },
    contentHiderChild: {
        marginTop: 6,
    },
    embed: {
        marginBottom: 6,
    },
    translateLink: {
        marginBottom: 6,
    },
});
