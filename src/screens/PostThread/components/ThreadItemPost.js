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
import { PreviewableUserAvatar } from '#/view/com/util/UserAvatar';
import { LINEAR_AVI_WIDTH, OUTER_SPACE, REPLY_LINE_WIDTH, } from '#/screens/PostThread/const';
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
import { useActorStatus } from '#/features/liveNow';
export function ThreadItemPost(_a) {
    var item = _a.item, overrides = _a.overrides, onPostSuccess = _a.onPostSuccess, threadgateRecord = _a.threadgateRecord;
    var postShadow = usePostShadow(item.value.post);
    if (postShadow === POST_TOMBSTONE) {
        return _jsx(ThreadItemPostDeleted, { item: item, overrides: overrides });
    }
    return (_jsx(ThreadItemPostInner, { item: item, postShadow: postShadow, threadgateRecord: threadgateRecord, overrides: overrides, onPostSuccess: onPostSuccess }));
}
function ThreadItemPostDeleted(_a) {
    var item = _a.item, overrides = _a.overrides;
    var t = useTheme();
    return (_jsxs(ThreadItemPostOuterWrapper, { item: item, overrides: overrides, children: [_jsx(ThreadItemPostParentReplyLine, { item: item }), _jsxs(View, { style: [
                    a.flex_row,
                    a.align_center,
                    a.py_md,
                    a.rounded_sm,
                    t.atoms.bg_contrast_25,
                ], children: [_jsx(View, { style: [
                            a.flex_row,
                            a.align_center,
                            a.justify_center,
                            {
                                width: LINEAR_AVI_WIDTH,
                            },
                        ], children: _jsx(TrashIcon, { style: [t.atoms.text_contrast_medium] }) }), _jsx(Text, { style: [a.text_md, a.font_semi_bold, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Post has been deleted" }) })] }), _jsx(View, { style: [{ height: 4 }] })] }));
}
var ThreadItemPostOuterWrapper = memo(function ThreadItemPostOuterWrapper(_a) {
    var item = _a.item, overrides = _a.overrides, children = _a.children;
    var t = useTheme();
    var showTopBorder = !item.ui.showParentReplyLine && (overrides === null || overrides === void 0 ? void 0 : overrides.topBorder) !== true;
    return (_jsx(View, { style: [
            showTopBorder && [a.border_t, t.atoms.border_contrast_low],
            { paddingHorizontal: OUTER_SPACE },
            // If there's no next child, add a little padding to bottom
            !item.ui.showChildReplyLine &&
                !item.ui.precedesChildReadMore && {
                paddingBottom: OUTER_SPACE / 2,
            },
        ], children: children }));
});
/**
 * Provides some space between posts as well as contains the reply line
 */
var ThreadItemPostParentReplyLine = memo(function ThreadItemPostParentReplyLine(_a) {
    var item = _a.item;
    var t = useTheme();
    return (_jsx(View, { style: [a.flex_row, { height: 12 }], children: _jsx(View, { style: { width: LINEAR_AVI_WIDTH }, children: item.ui.showParentReplyLine && (_jsx(View, { style: [
                    a.mx_auto,
                    a.flex_1,
                    a.mb_xs,
                    {
                        width: REPLY_LINE_WIDTH,
                        backgroundColor: t.atoms.border_contrast_low.borderColor,
                    },
                ] })) }) }));
});
var ThreadItemPostInner = memo(function ThreadItemPostInner(_a) {
    var _b, _c, _d;
    var item = _a.item, postShadow = _a.postShadow, overrides = _a.overrides, onPostSuccess = _a.onPostSuccess, threadgateRecord = _a.threadgateRecord;
    var t = useTheme();
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
    var _e = useState(function () { return countLines(richText === null || richText === void 0 ? void 0 : richText.text) >= MAX_POST_LINES; }), limitLines = _e[0], setLimitLines = _e[1];
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
    var live = useActorStatus(post.author).isActive;
    return (_jsx(SubtleHoverWrapper, { children: _jsx(ThreadItemPostOuterWrapper, { item: item, overrides: overrides, children: _jsxs(PostHider, { testID: "postThreadItem-by-".concat(post.author.handle), href: postHref, disabled: (overrides === null || overrides === void 0 ? void 0 : overrides.moderation) === true, modui: moderation.ui('contentList'), hiderStyle: [a.pl_0, a.pr_2xs, a.bg_transparent], iconSize: LINEAR_AVI_WIDTH, iconStyles: [a.mr_xs], profile: post.author, interpretFilterAsBlur: true, children: [_jsx(ThreadItemPostParentReplyLine, { item: item }), _jsxs(View, { style: [a.flex_row, a.gap_md], children: [_jsxs(View, { children: [_jsx(PreviewableUserAvatar, { size: LINEAR_AVI_WIDTH, profile: post.author, moderation: moderation.ui('avatar'), type: ((_d = post.author.associated) === null || _d === void 0 ? void 0 : _d.labeler) ? 'labeler' : 'user', live: live }), (item.ui.showChildReplyLine ||
                                        item.ui.precedesChildReadMore) && (_jsx(View, { style: [
                                            a.mx_auto,
                                            a.mt_xs,
                                            a.flex_1,
                                            {
                                                width: REPLY_LINE_WIDTH,
                                                backgroundColor: t.atoms.border_contrast_low.borderColor,
                                            },
                                        ] }))] }), _jsxs(View, { style: [a.flex_1], children: [_jsx(PostMeta, { author: post.author, moderation: moderation, timestamp: post.indexedAt, postHref: postHref, style: [a.pb_xs] }), _jsx(LabelsOnMyPost, { post: post, style: [a.pb_xs] }), _jsx(PostAlerts, { modui: moderation.ui('contentList'), style: [a.pb_2xs], additionalCauses: additionalPostAlerts }), (richText === null || richText === void 0 ? void 0 : richText.text) ? (_jsxs(View, { style: [a.mb_2xs], children: [_jsx(RichText, { enableTags: true, value: richText, style: [a.flex_1, a.text_md], numberOfLines: limitLines ? MAX_POST_LINES : undefined, authorHandle: post.author.handle, shouldProxyLinks: true }), limitLines && (_jsx(ShowMoreTextButton, { style: [a.text_md], onPress: onPressShowMore }))] })) : undefined, post.embed && (_jsx(View, { style: [a.pb_xs], children: _jsx(Embed, { embed: post.embed, moderation: moderation, viewContext: PostEmbedViewContext.Feed }) })), _jsx(PostControls, { post: postShadow, record: record, richText: richText, onPressReply: onPressReply, logContext: "PostThreadItem", threadgateRecord: threadgateRecord }), _jsx(DebugFieldDisplay, { subject: post })] })] })] }) }) }));
});
function SubtleHoverWrapper(_a) {
    var children = _a.children;
    var _b = useInteractionState(), hover = _b.state, onHoverIn = _b.onIn, onHoverOut = _b.onOut;
    return (_jsxs(View, { onPointerEnter: onHoverIn, onPointerLeave: onHoverOut, style: a.pointer, children: [_jsx(SubtleHover, { hover: hover }), children] }));
}
export function ThreadItemPostSkeleton(_a) {
    var index = _a.index;
    var even = index % 2 === 0;
    return (_jsx(View, { style: [
            { paddingHorizontal: OUTER_SPACE, paddingVertical: OUTER_SPACE / 1.5 },
            a.gap_md,
        ], children: _jsxs(Skele.Row, { style: [a.align_start, a.gap_md], children: [_jsx(Skele.Circle, { size: LINEAR_AVI_WIDTH }), _jsxs(Skele.Col, { style: [a.gap_xs], children: [_jsxs(Skele.Row, { style: [a.gap_sm], children: [_jsx(Skele.Text, { style: [a.text_md, { width: '20%' }] }), _jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '30%' }] })] }), _jsx(Skele.Col, { children: even ? (_jsxs(_Fragment, { children: [_jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '100%' }] }), _jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '60%' }] })] })) : (_jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '60%' }] })) }), _jsx(PostControlsSkeleton, {})] })] }) }));
}
