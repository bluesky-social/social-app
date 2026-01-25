import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBskyFeedPost, AtUri, moderatePost, RichText as RichTextAPI, } from '@atproto/api';
import { useQueryClient } from '@tanstack/react-query';
import { MAX_POST_LINES } from '#/lib/constants';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { usePalette } from '#/lib/hooks/usePalette';
import { makeProfileLink } from '#/lib/routes/links';
import { countLines } from '#/lib/strings/helpers';
import { colors } from '#/lib/styles';
import { POST_TOMBSTONE, usePostShadow, } from '#/state/cache/post-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { unstableCacheProfileView } from '#/state/queries/profile';
import { Link } from '#/view/com/util/Link';
import { PostMeta } from '#/view/com/util/PostMeta';
import { PreviewableUserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a } from '#/alf';
import { ContentHider } from '#/components/moderation/ContentHider';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { PostRepliedTo } from '#/components/Post/PostRepliedTo';
import { ShowMoreTextButton } from '#/components/Post/ShowMoreTextButton';
import { PostControls } from '#/components/PostControls';
import { RichText } from '#/components/RichText';
import { SubtleHover } from '#/components/SubtleHover';
import * as bsky from '#/types/bsky';
export function Post(_a) {
    var post = _a.post, showReplyLine = _a.showReplyLine, hideTopBorder = _a.hideTopBorder, style = _a.style, onBeforePress = _a.onBeforePress;
    var moderationOpts = useModerationOpts();
    var record = useMemo(function () {
        return bsky.validate(post.record, AppBskyFeedPost.validateRecord)
            ? post.record
            : undefined;
    }, [post]);
    var postShadowed = usePostShadow(post);
    var richText = useMemo(function () {
        return record
            ? new RichTextAPI({
                text: record.text,
                facets: record.facets,
            })
            : undefined;
    }, [record]);
    var moderation = useMemo(function () { return (moderationOpts ? moderatePost(post, moderationOpts) : undefined); }, [moderationOpts, post]);
    if (postShadowed === POST_TOMBSTONE) {
        return null;
    }
    if (record && richText && moderation) {
        return (_jsx(PostInner, { post: postShadowed, record: record, richText: richText, moderation: moderation, showReplyLine: showReplyLine, hideTopBorder: hideTopBorder, style: style, onBeforePress: onBeforePress }));
    }
    return null;
}
function PostInner(_a) {
    var _b, _c;
    var post = _a.post, record = _a.record, richText = _a.richText, moderation = _a.moderation, showReplyLine = _a.showReplyLine, hideTopBorder = _a.hideTopBorder, style = _a.style, outerOnBeforePress = _a.onBeforePress;
    var queryClient = useQueryClient();
    var pal = usePalette('default');
    var openComposer = useOpenComposer().openComposer;
    var _d = useState(function () { return countLines(richText === null || richText === void 0 ? void 0 : richText.text) >= MAX_POST_LINES; }), limitLines = _d[0], setLimitLines = _d[1];
    var itemUrip = new AtUri(post.uri);
    var itemHref = makeProfileLink(post.author, 'post', itemUrip.rkey);
    var replyAuthorDid = '';
    if (record.reply) {
        var urip = new AtUri(((_b = record.reply.parent) === null || _b === void 0 ? void 0 : _b.uri) || record.reply.root.uri);
        replyAuthorDid = urip.hostname;
    }
    var onPressReply = useCallback(function () {
        openComposer({
            replyTo: {
                uri: post.uri,
                cid: post.cid,
                text: record.text,
                author: post.author,
                embed: post.embed,
                moderation: moderation,
                langs: record.langs,
            },
        });
    }, [openComposer, post, record, moderation]);
    var onPressShowMore = useCallback(function () {
        setLimitLines(false);
    }, [setLimitLines]);
    var onBeforePress = useCallback(function () {
        unstableCacheProfileView(queryClient, post.author);
        outerOnBeforePress === null || outerOnBeforePress === void 0 ? void 0 : outerOnBeforePress();
    }, [queryClient, post.author, outerOnBeforePress]);
    var _e = useState(false), hover = _e[0], setHover = _e[1];
    return (_jsxs(Link, { href: itemHref, style: [
            styles.outer,
            pal.border,
            !hideTopBorder && { borderTopWidth: StyleSheet.hairlineWidth },
            style,
        ], onBeforePress: onBeforePress, onPointerEnter: function () {
            setHover(true);
        }, onPointerLeave: function () {
            setHover(false);
        }, children: [_jsx(SubtleHover, { hover: hover }), showReplyLine && _jsx(View, { style: styles.replyLine }), _jsxs(View, { style: styles.layout, children: [_jsx(View, { style: styles.layoutAvi, children: _jsx(PreviewableUserAvatar, { size: 42, profile: post.author, moderation: moderation.ui('avatar'), type: ((_c = post.author.associated) === null || _c === void 0 ? void 0 : _c.labeler) ? 'labeler' : 'user' }) }), _jsxs(View, { style: styles.layoutContent, children: [_jsx(PostMeta, { author: post.author, moderation: moderation, timestamp: post.indexedAt, postHref: itemHref }), replyAuthorDid !== '' && (_jsx(PostRepliedTo, { parentAuthor: replyAuthorDid })), _jsx(LabelsOnMyPost, { post: post }), _jsxs(ContentHider, { modui: moderation.ui('contentView'), style: styles.contentHider, childContainerStyle: styles.contentHiderChild, children: [_jsx(PostAlerts, { modui: moderation.ui('contentView'), style: [a.pb_xs] }), richText.text ? (_jsxs(View, { children: [_jsx(RichText, { enableTags: true, testID: "postText", value: richText, numberOfLines: limitLines ? MAX_POST_LINES : undefined, style: [a.flex_1, a.text_md], authorHandle: post.author.handle, shouldProxyLinks: true }), limitLines && (_jsx(ShowMoreTextButton, { style: [a.text_md], onPress: onPressShowMore }))] })) : undefined, post.embed ? (_jsx(Embed, { embed: post.embed, moderation: moderation, viewContext: PostEmbedViewContext.Feed })) : null] }), _jsx(PostControls, { post: post, record: record, richText: richText, onPressReply: onPressReply, logContext: "Post" })] })] })] }));
}
var styles = StyleSheet.create({
    outer: {
        paddingTop: 10,
        paddingRight: 15,
        paddingBottom: 5,
        paddingLeft: 10,
        // @ts-ignore web only -prf
        cursor: 'pointer',
    },
    layout: {
        flexDirection: 'row',
        gap: 10,
    },
    layoutAvi: {
        paddingLeft: 8,
    },
    layoutContent: {
        flex: 1,
    },
    alert: {
        marginBottom: 6,
    },
    replyLine: {
        position: 'absolute',
        left: 36,
        top: 70,
        bottom: 0,
        borderLeftWidth: 2,
        borderLeftColor: colors.gray2,
    },
    contentHider: {
        marginBottom: 2,
    },
    contentHiderChild: {
        marginTop: 6,
    },
});
