var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useMemo } from 'react';
import { Text as RNText, View } from 'react-native';
import { AppBskyFeedDefs, AppBskyFeedPost, AtUri, RichText as RichTextAPI, } from '@atproto/api';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { niceDate } from '#/lib/strings/time';
import { getPostLanguage, getTranslatorLink, isPostInLanguage, } from '#/locale/helpers';
import { POST_TOMBSTONE, usePostShadow, } from '#/state/cache/post-shadow';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { FeedFeedbackProvider, useFeedFeedback } from '#/state/feed-feedback';
import { useLanguagePrefs } from '#/state/preferences';
import { useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';
import { PreviewableUserAvatar } from '#/view/com/util/UserAvatar';
import { ThreadItemAnchorFollowButton } from '#/screens/PostThread/components/ThreadItemAnchorFollowButton';
import { LINEAR_AVI_WIDTH, OUTER_SPACE, REPLY_LINE_WIDTH, } from '#/screens/PostThread/const';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { DebugFieldDisplay } from '#/components/DebugFieldDisplay';
import { CalendarClock_Stroke2_Corner0_Rounded as CalendarClockIcon } from '#/components/icons/CalendarClock';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { InlineLinkText, Link } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { ContentHider } from '#/components/moderation/ContentHider';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { TranslatedPost } from '#/components/Post/Translated';
import { PostControls, PostControlsSkeleton } from '#/components/PostControls';
import { useFormatPostStatCount } from '#/components/PostControls/util';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import * as Skele from '#/components/Skeleton';
import { Text } from '#/components/Typography';
import { VerificationCheckButton } from '#/components/verification/VerificationCheckButton';
import { WhoCanReply } from '#/components/WhoCanReply';
import { useAnalytics } from '#/analytics';
import { useActorStatus } from '#/features/liveNow';
import { Provider as TranslateOnDeviceProvider, useTranslateOnDevice, } from '#/translation';
import * as bsky from '#/types/bsky';
export function ThreadItemAnchor(_a) {
    var _b, _c;
    var item = _a.item, onPostSuccess = _a.onPostSuccess, threadgateRecord = _a.threadgateRecord, postSource = _a.postSource;
    var postShadow = usePostShadow(item.value.post);
    var threadRootUri = ((_c = (_b = item.value.post.record.reply) === null || _b === void 0 ? void 0 : _b.root) === null || _c === void 0 ? void 0 : _c.uri) || item.uri;
    var isRoot = threadRootUri === item.uri;
    if (postShadow === POST_TOMBSTONE) {
        return _jsx(ThreadItemAnchorDeleted, { isRoot: isRoot });
    }
    return (_jsx(TranslateOnDeviceProvider, { children: _jsx(ThreadItemAnchorInner
        // Safeguard from clobbering per-post state below:
        , { item: item, isRoot: isRoot, postShadow: postShadow, onPostSuccess: onPostSuccess, threadgateRecord: threadgateRecord, postSource: postSource }, postShadow.uri) }));
}
function ThreadItemAnchorDeleted(_a) {
    var isRoot = _a.isRoot;
    var t = useTheme();
    return (_jsxs(_Fragment, { children: [_jsx(ThreadItemAnchorParentReplyLine, { isRoot: isRoot }), _jsx(View, { style: [
                    {
                        paddingHorizontal: OUTER_SPACE,
                        paddingBottom: OUTER_SPACE,
                    },
                    isRoot && [a.pt_lg],
                ], children: _jsxs(View, { style: [
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
                            ], children: _jsx(TrashIcon, { style: [t.atoms.text_contrast_medium] }) }), _jsx(Text, { style: [a.text_md, a.font_semi_bold, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Post has been deleted" }) })] }) })] }));
}
function ThreadItemAnchorParentReplyLine(_a) {
    var isRoot = _a.isRoot;
    var t = useTheme();
    return !isRoot ? (_jsx(View, { style: [a.pl_lg, a.flex_row, a.pb_xs, { height: a.pt_lg.paddingTop }], children: _jsx(View, { style: { width: 42 }, children: _jsx(View, { style: [
                    {
                        width: REPLY_LINE_WIDTH,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        flexGrow: 1,
                        backgroundColor: t.atoms.border_contrast_low.borderColor,
                    },
                ] }) }) })) : null;
}
var ThreadItemAnchorInner = memo(function ThreadItemAnchorInner(_a) {
    var _b, _c, _d, _e, _f, _g, _h;
    var item = _a.item, isRoot = _a.isRoot, postShadow = _a.postShadow, onPostSuccess = _a.onPostSuccess, threadgateRecord = _a.threadgateRecord, postSource = _a.postSource;
    var t = useTheme();
    var ax = useAnalytics();
    var l = useLingui().t;
    var openComposer = useOpenComposer().openComposer;
    var _j = useSession(), currentAccount = _j.currentAccount, hasSession = _j.hasSession;
    var feedFeedback = useFeedFeedback(postSource === null || postSource === void 0 ? void 0 : postSource.feedSourceInfo, hasSession);
    var formatPostStatCount = useFormatPostStatCount();
    var post = postShadow;
    var record = item.value.post.record;
    var moderation = item.moderation;
    var authorShadow = useProfileShadow(post.author);
    var live = useActorStatus(post.author).isActive;
    var richText = useMemo(function () {
        return new RichTextAPI({
            text: record.text,
            facets: record.facets,
        });
    }, [record]);
    var threadRootUri = ((_c = (_b = record.reply) === null || _b === void 0 ? void 0 : _b.root) === null || _c === void 0 ? void 0 : _c.uri) || post.uri;
    var authorHref = makeProfileLink(post.author);
    var isThreadAuthor = getThreadAuthor(post, record) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var likesHref = useMemo(function () {
        var urip = new AtUri(post.uri);
        return makeProfileLink(post.author, 'post', urip.rkey, 'liked-by');
    }, [post.uri, post.author]);
    var repostsHref = useMemo(function () {
        var urip = new AtUri(post.uri);
        return makeProfileLink(post.author, 'post', urip.rkey, 'reposted-by');
    }, [post.uri, post.author]);
    var quotesHref = useMemo(function () {
        var urip = new AtUri(post.uri);
        return makeProfileLink(post.author, 'post', urip.rkey, 'quotes');
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
    var onlyFollowersCanReply = !!((_d = threadgateRecord === null || threadgateRecord === void 0 ? void 0 : threadgateRecord.allow) === null || _d === void 0 ? void 0 : _d.find(function (rule) { return rule.$type === 'app.bsky.feed.threadgate#followerRule'; }));
    var showFollowButton = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) !== post.author.did && !onlyFollowersCanReply;
    var viaRepost = useMemo(function () {
        var reason = postSource === null || postSource === void 0 ? void 0 : postSource.post.reason;
        if (AppBskyFeedDefs.isReasonRepost(reason) && reason.uri && reason.cid) {
            return {
                uri: reason.uri,
                cid: reason.cid,
            };
        }
    }, [postSource]);
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
            onPostSuccess: onPostSuccess,
            logContext: 'PostReply',
        });
        if (postSource) {
            feedFeedback.sendInteraction({
                item: post.uri,
                event: 'app.bsky.feed.defs#interactionReply',
                feedContext: postSource.post.feedContext,
                reqId: postSource.post.reqId,
            });
        }
    }, [
        openComposer,
        post,
        record,
        onPostSuccess,
        moderation,
        postSource,
        feedFeedback,
    ]);
    var onOpenAuthor = function () {
        ax.metric('post:clickthroughAuthor', {
            uri: post.uri,
            authorDid: post.author.did,
            logContext: 'PostThreadItem',
            feedDescriptor: feedFeedback.feedDescriptor,
        });
        if (postSource) {
            feedFeedback.sendInteraction({
                item: post.uri,
                event: 'app.bsky.feed.defs#clickthroughAuthor',
                feedContext: postSource.post.feedContext,
                reqId: postSource.post.reqId,
            });
        }
    };
    var onOpenEmbed = function () {
        ax.metric('post:clickthroughEmbed', {
            uri: post.uri,
            authorDid: post.author.did,
            logContext: 'PostThreadItem',
            feedDescriptor: feedFeedback.feedDescriptor,
        });
        if (postSource) {
            feedFeedback.sendInteraction({
                item: post.uri,
                event: 'app.bsky.feed.defs#clickthroughEmbed',
                feedContext: postSource.post.feedContext,
                reqId: postSource.post.reqId,
            });
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(ThreadItemAnchorParentReplyLine, { isRoot: isRoot }), _jsxs(View, { testID: "postThreadItem-by-".concat(post.author.handle), style: [
                    {
                        paddingHorizontal: OUTER_SPACE,
                    },
                    isRoot && [a.pt_lg],
                ], children: [_jsxs(View, { style: [a.flex_row, a.gap_md, a.pb_md], children: [_jsx(View, { collapsable: false, children: _jsx(PreviewableUserAvatar, { size: 42, profile: post.author, moderation: moderation.ui('avatar'), type: ((_e = post.author.associated) === null || _e === void 0 ? void 0 : _e.labeler) ? 'labeler' : 'user', live: live, onBeforePress: onOpenAuthor }) }), _jsx(Link, { to: authorHref, style: [a.flex_1], label: sanitizeDisplayName(post.author.displayName || sanitizeHandle(post.author.handle), moderation.ui('displayName')), onPress: onOpenAuthor, children: _jsx(View, { style: [a.flex_1, a.align_start], children: _jsxs(ProfileHoverCard, { did: post.author.did, style: [a.w_full], children: [_jsxs(View, { style: [a.flex_row, a.align_center], children: [_jsx(Text, { emoji: true, style: [
                                                            a.flex_shrink,
                                                            a.text_lg,
                                                            a.font_semi_bold,
                                                            a.leading_snug,
                                                        ], numberOfLines: 1, children: sanitizeDisplayName(post.author.displayName ||
                                                            sanitizeHandle(post.author.handle), moderation.ui('displayName')) }), _jsx(View, { style: [a.pl_xs], children: _jsx(VerificationCheckButton, { profile: authorShadow, size: "md" }) })] }), _jsx(Text, { style: [
                                                    a.text_md,
                                                    a.leading_snug,
                                                    t.atoms.text_contrast_medium,
                                                ], numberOfLines: 1, children: sanitizeHandle(post.author.handle, '@') })] }) }) }), _jsx(View, { collapsable: false, style: [a.self_center], children: _jsx(ThreadItemAnchorFollowButton, { did: post.author.did, enabled: showFollowButton }) })] }), _jsxs(View, { style: [a.pb_sm], children: [_jsx(LabelsOnMyPost, { post: post, style: [a.pb_sm] }), _jsxs(ContentHider, { modui: moderation.ui('contentView'), ignoreMute: true, childContainerStyle: [a.pt_sm], children: [_jsx(PostAlerts, { modui: moderation.ui('contentView'), size: "lg", includeMute: true, style: [a.pb_sm], additionalCauses: additionalPostAlerts }), (richText === null || richText === void 0 ? void 0 : richText.text) ? (_jsx(RichText, { enableTags: true, selectable: true, value: richText, style: [a.flex_1, a.text_lg], authorHandle: post.author.handle, shouldProxyLinks: true })) : undefined, _jsx(TranslatedPost, { postText: record.text, hideLoading: true }), _jsx(TranslateLink, { post: item.value.post }), post.embed && (_jsx(View, { style: [a.py_xs], children: _jsx(Embed, { embed: post.embed, moderation: moderation, viewContext: PostEmbedViewContext.ThreadHighlighted, onOpen: onOpenEmbed }) }))] }), _jsx(ExpandedPostDetails, { post: item.value.post, isThreadAuthor: isThreadAuthor }), post.repostCount !== 0 ||
                                post.likeCount !== 0 ||
                                post.quoteCount !== 0 ||
                                post.bookmarkCount !== 0 ? (
                            // Show this section unless we're *sure* it has no engagement.
                            _jsxs(View, { style: [
                                    a.flex_row,
                                    a.flex_wrap,
                                    a.align_center,
                                    {
                                        rowGap: a.gap_sm.gap,
                                        columnGap: a.gap_lg.gap,
                                    },
                                    a.border_t,
                                    a.border_b,
                                    a.mt_md,
                                    a.py_md,
                                    t.atoms.border_contrast_low,
                                ], children: [post.repostCount != null && post.repostCount !== 0 ? (_jsx(Link, { to: repostsHref, label: l(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Reposts of this post"], ["Reposts of this post"]))), children: _jsx(Text, { testID: "repostCount-expanded", style: [a.text_md, t.atoms.text_contrast_medium], children: _jsxs(Trans, { comment: "Repost count display, the <0> tags enclose the number of reposts in bold (will never be 0)", children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold, t.atoms.text], children: formatPostStatCount(post.repostCount) }), ' ', _jsx(Plural, { value: post.repostCount, one: "repost", other: "reposts" })] }) }) })) : null, post.quoteCount != null &&
                                        post.quoteCount !== 0 &&
                                        !((_f = post.viewer) === null || _f === void 0 ? void 0 : _f.embeddingDisabled) ? (_jsx(Link, { to: quotesHref, label: l(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Quotes of this post"], ["Quotes of this post"]))), children: _jsx(Text, { testID: "quoteCount-expanded", style: [a.text_md, t.atoms.text_contrast_medium], children: _jsxs(Trans, { comment: "Quote count display, the <0> tags enclose the number of quotes in bold (will never be 0)", children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold, t.atoms.text], children: formatPostStatCount(post.quoteCount) }), ' ', _jsx(Plural, { value: post.quoteCount, one: "quote", other: "quotes" })] }) }) })) : null, post.likeCount != null && post.likeCount !== 0 ? (_jsx(Link, { to: likesHref, label: l(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Likes on this post"], ["Likes on this post"]))), children: _jsx(Text, { testID: "likeCount-expanded", style: [a.text_md, t.atoms.text_contrast_medium], children: _jsxs(Trans, { comment: "Like count display, the <0> tags enclose the number of likes in bold (will never be 0)", children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold, t.atoms.text], children: formatPostStatCount(post.likeCount) }), ' ', _jsx(Plural, { value: post.likeCount, one: "like", other: "likes" })] }) }) })) : null, post.bookmarkCount != null && post.bookmarkCount !== 0 ? (_jsx(Text, { testID: "bookmarkCount-expanded", style: [a.text_md, t.atoms.text_contrast_medium], children: _jsxs(Trans, { comment: "Save count display, the <0> tags enclose the number of saves in bold (will never be 0)", children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold, t.atoms.text], children: formatPostStatCount(post.bookmarkCount) }), ' ', _jsx(Plural, { value: post.bookmarkCount, one: "save", other: "saves" })] }) })) : null] })) : null, _jsx(View, { style: [
                                    a.pt_sm,
                                    a.pb_2xs,
                                    {
                                        marginLeft: -5,
                                    },
                                ], children: _jsx(FeedFeedbackProvider, { value: feedFeedback, children: _jsx(PostControls, { big: true, post: postShadow, record: record, richText: richText, onPressReply: onPressReply, logContext: "PostThreadItem", threadgateRecord: threadgateRecord, feedContext: (_g = postSource === null || postSource === void 0 ? void 0 : postSource.post) === null || _g === void 0 ? void 0 : _g.feedContext, reqId: (_h = postSource === null || postSource === void 0 ? void 0 : postSource.post) === null || _h === void 0 ? void 0 : _h.reqId, viaRepost: viaRepost }) }) }), _jsx(DebugFieldDisplay, { subject: post })] })] })] }));
});
function TranslateLink(_a) {
    var post = _a.post;
    var t = useTheme();
    var ax = useAnalytics();
    var l = useLingui().t;
    var langPrefs = useLanguagePrefs();
    var _b = useTranslateOnDevice(), translate = _b.translate, clearTranslation = _b.clearTranslation, translationState = _b.translationState;
    var needsTranslation = useMemo(function () {
        return Boolean(langPrefs.primaryLanguage &&
            !isPostInLanguage(post, [langPrefs.primaryLanguage]));
    }, [post, langPrefs.primaryLanguage]);
    var sourceLanguage = getPostLanguage(post);
    var onTranslatePress = useCallback(function (e) {
        var _a;
        e.preventDefault();
        void translate(post.record.text || '', langPrefs.primaryLanguage, sourceLanguage);
        if (bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord)) {
            ax.metric('translate', {
                sourceLanguages: (_a = post.record.langs) !== null && _a !== void 0 ? _a : [],
                targetLanguage: langPrefs.primaryLanguage,
                textLength: post.record.text.length,
            });
        }
        return false;
    }, [ax, sourceLanguage, translate, langPrefs, post]);
    var onHideTranslation = useCallback(function (e) {
        e.preventDefault();
        clearTranslation();
        return false;
    }, [clearTranslation]);
    return (needsTranslation && (_jsx(View, { style: [a.gap_md, a.pt_md, a.align_start], children: translationState.status === 'loading' ? (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(Loader, { size: "xs" }), _jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Translating\u2026" }) })] })) : translationState.status === 'success' ? (_jsx(InlineLinkText, { to: "#", label: l(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Hide translation"], ["Hide translation"]))), style: [a.text_sm], onPress: onHideTranslation, children: _jsx(Trans, { children: "Hide translation" }) })) : (_jsx(InlineLinkText, { to: getTranslatorLink(post.record.text, langPrefs.primaryLanguage), label: l(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Translate"], ["Translate"]))), style: [a.text_sm], onPress: onTranslatePress, children: _jsx(Trans, { children: "Translate" }) })) })));
}
function ExpandedPostDetails(_a) {
    var post = _a.post, isThreadAuthor = _a.isThreadAuthor;
    var t = useTheme();
    var i18n = useLingui().i18n;
    var isRootPost = !('reply' in post.record);
    return (_jsxs(View, { style: [a.gap_md, a.pt_md, a.align_start], children: [_jsx(BackdatedPostIndicator, { post: post }), _jsxs(View, { style: [a.flex_row, a.align_center, a.flex_wrap, a.gap_sm], children: [_jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium], children: niceDate(i18n, post.indexedAt, 'dot separated') }), isRootPost && (_jsx(WhoCanReply, { post: post, isThreadAuthor: isThreadAuthor }))] })] }));
}
function BackdatedPostIndicator(_a) {
    var post = _a.post;
    var t = useTheme();
    var _b = useLingui(), l = _b.t, i18n = _b.i18n;
    var control = Prompt.usePromptControl();
    var indexedAt = new Date(post.indexedAt);
    var createdAt = bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord)
        ? new Date(post.record.createdAt)
        : new Date(post.indexedAt);
    // backdated if createdAt is 24 hours or more before indexedAt
    var isBackdated = indexedAt.getTime() - createdAt.getTime() > 24 * 60 * 60 * 1000;
    if (!isBackdated)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx(Button, { label: l(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Archived post"], ["Archived post"]))), accessibilityHint: l(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Shows information about when this post was created"], ["Shows information about when this post was created"]))), onPress: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    control.open();
                }, children: function (_a) {
                    var hovered = _a.hovered, pressed = _a.pressed;
                    return (_jsxs(View, { style: [
                            a.flex_row,
                            a.align_center,
                            a.rounded_full,
                            t.atoms.bg_contrast_25,
                            (hovered || pressed) && t.atoms.bg_contrast_50,
                            {
                                gap: 3,
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                            },
                        ], children: [_jsx(CalendarClockIcon, { fill: t.palette.yellow, size: "sm", "aria-hidden": true }), _jsx(Text, { style: [
                                    a.text_xs,
                                    a.font_semi_bold,
                                    a.leading_tight,
                                    t.atoms.text_contrast_medium,
                                ], children: _jsxs(Trans, { children: ["Archived from ", niceDate(i18n, createdAt, 'medium')] }) })] }));
                } }), _jsxs(Prompt.Outer, { control: control, children: [_jsxs(Prompt.Content, { children: [_jsx(Prompt.TitleText, { children: _jsx(Trans, { children: "Archived post" }) }), _jsx(Prompt.DescriptionText, { children: _jsxs(Trans, { children: ["This post claims to have been created on", ' ', _jsx(RNText, { style: [a.font_semi_bold], children: niceDate(i18n, createdAt) }), ", but was first seen by Bluesky on", ' ', _jsx(RNText, { style: [a.font_semi_bold], children: niceDate(i18n, indexedAt) }), "."] }) }), _jsx(Prompt.DescriptionText, { children: _jsx(Trans, { children: "Bluesky cannot confirm the authenticity of the claimed date." }) })] }), _jsx(Prompt.Actions, { children: _jsx(Prompt.Action, { cta: l(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Okay"], ["Okay"]))), onPress: function () { } }) })] })] }));
}
function getThreadAuthor(post, record) {
    if (!record.reply) {
        return post.author.did;
    }
    try {
        return new AtUri(record.reply.root.uri).host;
    }
    catch (_a) {
        return '';
    }
}
export function ThreadItemAnchorSkeleton() {
    return (_jsxs(View, { style: [a.p_lg, a.gap_md], children: [_jsxs(Skele.Row, { style: [a.align_center, a.gap_md], children: [_jsx(Skele.Circle, { size: 42 }), _jsxs(Skele.Col, { children: [_jsx(Skele.Text, { style: [a.text_lg, { width: '20%' }] }), _jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '40%' }] })] })] }), _jsxs(View, { children: [_jsx(Skele.Text, { style: [a.text_xl, { width: '100%' }] }), _jsx(Skele.Text, { style: [a.text_xl, { width: '60%' }] })] }), _jsx(Skele.Text, { style: [a.text_sm, { width: '50%' }] }), _jsx(PostControlsSkeleton, { big: true })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
