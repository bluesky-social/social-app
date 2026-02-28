import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AtUri, RichText as RichTextAPI, } from '@atproto/api';
import { Trans } from '@lingui/react/macro';
import { MAX_POST_LINES } from '#/lib/constants';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import { countLines } from '#/lib/strings/helpers';
import { POST_TOMBSTONE, usePostShadow, } from '#/state/cache/post-shadow';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';
import { PostMeta } from '#/view/com/util/PostMeta';
import { OUTER_SPACE, REPLY_LINE_WIDTH, TREE_AVI_WIDTH, TREE_INDENT, } from '#/screens/PostThread/const';
import { atoms as a, useTheme } from '#/alf';
import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { PostHider } from '#/components/moderation/PostHider';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { ShowMoreTextButton } from '#/components/Post/ShowMoreTextButton';
import { PostControls, PostControlsSkeleton } from '#/components/PostControls';
import { RichText } from '#/components/RichText';
import * as Skele from '#/components/Skeleton';
import { SubtleHover } from '#/components/SubtleHover';
import { Text } from '#/components/Typography';
/**
 * Mimic the space in PostMeta
 */
var TREE_AVI_PLUS_SPACE = TREE_AVI_WIDTH + a.gap_xs.gap;
export function ThreadItemTreePost(_a) {
    var item = _a.item, overrides = _a.overrides, onPostSuccess = _a.onPostSuccess, threadgateRecord = _a.threadgateRecord;
    var postShadow = usePostShadow(item.value.post);
    if (postShadow === POST_TOMBSTONE) {
        return _jsx(ThreadItemTreePostDeleted, { item: item });
    }
    return (_jsx(ThreadItemTreePostInner
    // Safeguard from clobbering per-post state below:
    , { item: item, postShadow: postShadow, threadgateRecord: threadgateRecord, overrides: overrides, onPostSuccess: onPostSuccess }, postShadow.uri));
}
function ThreadItemTreePostDeleted(_a) {
    var item = _a.item;
    var t = useTheme();
    return (_jsx(ThreadItemTreePostOuterWrapper, { item: item, children: _jsxs(ThreadItemTreePostInnerWrapper, { item: item, children: [_jsxs(View, { style: [
                        a.flex_row,
                        a.align_center,
                        a.rounded_sm,
                        t.atoms.bg_contrast_25,
                        {
                            gap: 6,
                            paddingHorizontal: OUTER_SPACE / 2,
                            height: TREE_AVI_WIDTH,
                        },
                    ], children: [_jsx(TrashIcon, { style: [t.atoms.text], width: 14 }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.mt_2xs], children: _jsx(Trans, { children: "Post has been deleted" }) })] }), item.ui.isLastChild && !item.ui.precedesChildReadMore && (_jsx(View, { style: { height: OUTER_SPACE / 2 } }))] }) }));
}
var ThreadItemTreePostOuterWrapper = memo(function ThreadItemTreePostOuterWrapper(_a) {
    var item = _a.item, children = _a.children;
    var t = useTheme();
    var indents = Math.max(0, item.ui.indent - 1);
    return (_jsxs(View, { style: [
            a.flex_row,
            item.ui.indent === 1 &&
                !item.ui.showParentReplyLine && [
                a.border_t,
                t.atoms.border_contrast_low,
            ],
        ], children: [Array.from(Array(indents)).map(function (_, n) {
                var isSkipped = item.ui.skippedIndentIndices.has(n);
                return (_jsx(View, { style: [
                        t.atoms.border_contrast_low,
                        {
                            borderRightWidth: isSkipped ? 0 : REPLY_LINE_WIDTH,
                            width: TREE_INDENT + TREE_AVI_WIDTH / 2,
                            left: 1,
                        },
                    ] }, "".concat(item.value.post.uri, "-padding-").concat(n)));
            }), children] }));
});
var ThreadItemTreePostInnerWrapper = memo(function ThreadItemTreePostInnerWrapper(_a) {
    var item = _a.item, children = _a.children;
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_1, // TODO check on ios
            {
                paddingHorizontal: OUTER_SPACE,
                paddingTop: OUTER_SPACE / 2,
            },
            item.ui.indent === 1 && [
                !item.ui.showParentReplyLine && { paddingTop: OUTER_SPACE / 1.5 },
                !item.ui.showChildReplyLine && a.pb_sm,
            ],
            item.ui.isLastChild &&
                !item.ui.precedesChildReadMore && [
                {
                    paddingBottom: OUTER_SPACE / 2,
                },
            ],
        ], children: [item.ui.indent > 1 && (_jsx(View, { style: [
                    a.absolute,
                    t.atoms.border_contrast_low,
                    {
                        left: -1,
                        top: 0,
                        height: TREE_AVI_WIDTH / 2 + REPLY_LINE_WIDTH / 2 + OUTER_SPACE / 2,
                        width: OUTER_SPACE,
                        borderLeftWidth: REPLY_LINE_WIDTH,
                        borderBottomWidth: REPLY_LINE_WIDTH,
                        borderBottomLeftRadius: a.rounded_sm.borderRadius,
                    },
                ] })), children] }));
});
var ThreadItemTreeReplyChildReplyLine = memo(function ThreadItemTreeReplyChildReplyLine(_a) {
    var item = _a.item;
    var t = useTheme();
    return (_jsx(View, { style: [a.relative, a.pt_2xs, { width: TREE_AVI_PLUS_SPACE }], children: item.ui.showChildReplyLine && (_jsx(View, { style: [
                a.flex_1,
                t.atoms.border_contrast_low,
                { borderRightWidth: 2, width: '50%', left: -1 },
            ] })) }));
});
var ThreadItemTreePostInner = memo(function ThreadItemTreePostInner(_a) {
    var _b, _c;
    var item = _a.item, postShadow = _a.postShadow, overrides = _a.overrides, onPostSuccess = _a.onPostSuccess, threadgateRecord = _a.threadgateRecord;
    var openComposer = useOpenComposer().openComposer;
    var currentAccount = useSession().currentAccount;
    var post = item.value.post;
    var record = item.value.post.record;
    var moderation = item.moderation;
    var richText = useMemo(function () {
        return new RichTextAPI({
            text: record.text,
            facets: record.facets,
        });
    }, [record]);
    var _d = useState(function () { return countLines(richText === null || richText === void 0 ? void 0 : richText.text) >= MAX_POST_LINES; }), limitLines = _d[0], setLimitLines = _d[1];
    var threadRootUri = ((_c = (_b = record.reply) === null || _b === void 0 ? void 0 : _b.root) === null || _c === void 0 ? void 0 : _c.uri) || post.uri;
    var postHref = useMemo(function () {
        var urip = new AtUri(post.uri);
        return makeProfileLink(post.author, 'post', urip.rkey);
    }, [post.uri, post.author]);
    var threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
        threadgateRecord: threadgateRecord,
    });
    var additionalPostAlerts = useMemo(function () {
        var isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri);
        var isControlledByViewer = new AtUri(threadRootUri).host === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
        return isControlledByViewer && isPostHiddenByThreadgate
            ? [
                {
                    type: 'reply-hidden',
                    source: { type: 'user', did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did },
                    priority: 6,
                },
            ]
            : [];
    }, [post, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, threadgateHiddenReplies, threadRootUri]);
    var onPressReply = useCallback(function () {
        openComposer({
            replyTo: {
                uri: post.uri,
                cid: post.cid,
                text: record.text,
                author: post.author,
                embed: post.embed,
                moderation: moderation,
                langs: post.record.langs,
            },
            onPostSuccess: onPostSuccess,
            logContext: 'PostReply',
        });
    }, [openComposer, post, record, onPostSuccess, moderation]);
    var onPressShowMore = useCallback(function () {
        setLimitLines(false);
    }, [setLimitLines]);
    return (_jsx(ThreadItemTreePostOuterWrapper, { item: item, children: _jsx(SubtleHoverWrapper, { children: _jsx(PostHider, { testID: "postThreadItem-by-".concat(post.author.handle), href: postHref, disabled: (overrides === null || overrides === void 0 ? void 0 : overrides.moderation) === true, modui: moderation.ui('contentList'), iconSize: 42, iconStyles: { marginLeft: 2, marginRight: 2 }, profile: post.author, interpretFilterAsBlur: true, children: _jsx(ThreadItemTreePostInnerWrapper, { item: item, children: _jsxs(View, { style: [a.flex_1], children: [_jsx(PostMeta, { author: post.author, moderation: moderation, timestamp: post.indexedAt, postHref: postHref, avatarSize: TREE_AVI_WIDTH, style: [a.pb_0], showAvatar: true }), _jsxs(View, { style: [a.flex_row], children: [_jsx(ThreadItemTreeReplyChildReplyLine, { item: item }), _jsxs(View, { style: [a.flex_1, a.pl_2xs], children: [_jsx(LabelsOnMyPost, { post: post, style: [a.pb_2xs] }), _jsx(PostAlerts, { modui: moderation.ui('contentList'), style: [a.pb_2xs], additionalCauses: additionalPostAlerts }), (richText === null || richText === void 0 ? void 0 : richText.text) ? (_jsxs(View, { style: [a.mb_2xs], children: [_jsx(RichText, { enableTags: true, value: richText, style: [a.flex_1, a.text_md], numberOfLines: limitLines ? MAX_POST_LINES : undefined, authorHandle: post.author.handle, shouldProxyLinks: true }), limitLines && (_jsx(ShowMoreTextButton, { style: [a.text_md], onPress: onPressShowMore }))] })) : null, post.embed && (_jsx(View, { style: [a.pb_xs], children: _jsx(Embed, { embed: post.embed, moderation: moderation, viewContext: PostEmbedViewContext.Feed }) })), _jsx(PostControls, { variant: "compact", post: postShadow, record: record, richText: richText, onPressReply: onPressReply, logContext: "PostThreadItem", threadgateRecord: threadgateRecord }), _jsx(DebugFieldDisplay, { subject: post })] })] })] }) }) }) }) }));
});
function SubtleHoverWrapper(_a) {
    var children = _a.children;
    var _b = useInteractionState(), hover = _b.state, onHoverIn = _b.onIn, onHoverOut = _b.onOut;
    return (_jsxs(View, { onPointerEnter: onHoverIn, onPointerLeave: onHoverOut, style: [a.flex_1, a.pointer], children: [_jsx(SubtleHover, { hover: hover }), children] }));
}
export function ThreadItemTreePostSkeleton(_a) {
    var index = _a.index;
    var t = useTheme();
    var even = index % 2 === 0;
    return (_jsx(View, { style: [
            { paddingHorizontal: OUTER_SPACE, paddingVertical: OUTER_SPACE / 1.5 },
            a.border_t,
            t.atoms.border_contrast_low,
        ], children: _jsxs(Skele.Row, { style: [a.align_start, a.gap_xs], children: [_jsx(Skele.Circle, { size: TREE_AVI_WIDTH }), _jsxs(Skele.Col, { style: [a.gap_xs], children: [_jsxs(Skele.Row, { style: [a.gap_sm], children: [_jsx(Skele.Text, { style: [a.text_md, { width: '20%' }] }), _jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '30%' }] })] }), _jsx(Skele.Col, { children: even ? (_jsxs(_Fragment, { children: [_jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '100%' }] }), _jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '60%' }] })] })) : (_jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '60%' }] })) }), _jsx(PostControlsSkeleton, {})] })] }) }));
}
