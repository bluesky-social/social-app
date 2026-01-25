var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { AppBskyFeedPost, AtUri, moderatePost, RichText as RichTextAPI, } from '@atproto/api';
import { Trans } from '@lingui/macro';
import { useQueryClient } from '@tanstack/react-query';
import { makeProfileLink } from '#/lib/routes/links';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { unstableCacheProfileView } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { Link } from '#/view/com/util/Link';
import { PostMeta } from '#/view/com/util/PostMeta';
import { atoms as a, useTheme } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { RichText } from '#/components/RichText';
import { Embed as StarterPackCard } from '#/components/StarterPack/StarterPackCard';
import { SubtleHover } from '#/components/SubtleHover';
import * as bsky from '#/types/bsky';
import { parseEmbed, } from '#/types/bsky/post';
import { ExternalEmbed } from './ExternalEmbed';
import { ModeratedFeedEmbed } from './FeedEmbed';
import { ImageEmbed } from './ImageEmbed';
import { ModeratedListEmbed } from './ListEmbed';
import { PostPlaceholder as PostPlaceholderText } from './PostPlaceholder';
import { PostEmbedViewContext, QuoteEmbedViewContext, } from './types';
import { VideoEmbed } from './VideoEmbed';
export { PostEmbedViewContext, QuoteEmbedViewContext } from './types';
export function Embed(_a) {
    var rawEmbed = _a.embed, rest = __rest(_a, ["embed"]);
    var embed = parseEmbed(rawEmbed);
    switch (embed.type) {
        case 'images':
        case 'link':
        case 'video': {
            return _jsx(MediaEmbed, __assign({ embed: embed }, rest));
        }
        case 'feed':
        case 'list':
        case 'starter_pack':
        case 'labeler':
        case 'post':
        case 'post_not_found':
        case 'post_blocked':
        case 'post_detached': {
            return _jsx(RecordEmbed, __assign({ embed: embed }, rest));
        }
        case 'post_with_media': {
            return (_jsxs(View, { style: rest.style, children: [_jsx(MediaEmbed, __assign({ embed: embed.media }, rest)), _jsx(RecordEmbed, __assign({ embed: embed.view }, rest))] }));
        }
        default: {
            return null;
        }
    }
}
function MediaEmbed(_a) {
    var _b, _c, _d;
    var embed = _a.embed, rest = __rest(_a, ["embed"]);
    switch (embed.type) {
        case 'images': {
            return (_jsx(ContentHider, { modui: (_b = rest.moderation) === null || _b === void 0 ? void 0 : _b.ui('contentMedia'), activeStyle: [a.mt_sm], children: _jsx(ImageEmbed, __assign({ embed: embed }, rest)) }));
        }
        case 'link': {
            return (_jsx(ContentHider, { modui: (_c = rest.moderation) === null || _c === void 0 ? void 0 : _c.ui('contentMedia'), activeStyle: [a.mt_sm], children: _jsx(ExternalEmbed, { link: embed.view.external, onOpen: rest.onOpen, style: [a.mt_sm, rest.style] }) }));
        }
        case 'video': {
            return (_jsx(ContentHider, { modui: (_d = rest.moderation) === null || _d === void 0 ? void 0 : _d.ui('contentMedia'), activeStyle: [a.mt_sm], children: _jsx(VideoEmbed, { embed: embed.view }) }));
        }
        default: {
            return null;
        }
    }
}
function RecordEmbed(_a) {
    var embed = _a.embed, rest = __rest(_a, ["embed"]);
    switch (embed.type) {
        case 'feed': {
            return (_jsx(View, { style: a.mt_sm, children: _jsx(ModeratedFeedEmbed, __assign({ embed: embed }, rest)) }));
        }
        case 'list': {
            return (_jsx(View, { style: a.mt_sm, children: _jsx(ModeratedListEmbed, { embed: embed }) }));
        }
        case 'starter_pack': {
            return (_jsx(View, { style: a.mt_sm, children: _jsx(StarterPackCard, { starterPack: embed.view }) }));
        }
        case 'labeler': {
            // not implemented
            return null;
        }
        case 'post': {
            if (rest.isWithinQuote && !rest.allowNestedQuotes) {
                return null;
            }
            return (_jsx(QuoteEmbed, __assign({}, rest, { embed: embed, viewContext: rest.viewContext === PostEmbedViewContext.Feed
                    ? QuoteEmbedViewContext.FeedEmbedRecordWithMedia
                    : undefined, isWithinQuote: rest.isWithinQuote, allowNestedQuotes: rest.allowNestedQuotes })));
        }
        case 'post_not_found': {
            return (_jsx(PostPlaceholderText, { children: _jsx(Trans, { children: "Deleted" }) }));
        }
        case 'post_blocked': {
            return (_jsx(PostPlaceholderText, { children: _jsx(Trans, { children: "Blocked" }) }));
        }
        case 'post_detached': {
            return _jsx(PostDetachedEmbed, { embed: embed });
        }
        default: {
            return null;
        }
    }
}
export function PostDetachedEmbed(_a) {
    var embed = _a.embed;
    var currentAccount = useSession().currentAccount;
    var isViewerOwner = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)
        ? embed.view.uri.includes(currentAccount.did)
        : false;
    return (_jsx(PostPlaceholderText, { children: isViewerOwner ? (_jsx(Trans, { children: "Removed by you" })) : (_jsx(Trans, { children: "Removed by author" })) }));
}
/*
 * Nests parent `Embed` component and therefore must live in this file to avoid
 * circular imports.
 */
export function QuoteEmbed(_a) {
    var embed = _a.embed, onOpen = _a.onOpen, style = _a.style, parentIsWithinQuote = _a.isWithinQuote, parentAllowNestedQuotes = _a.allowNestedQuotes;
    var moderationOpts = useModerationOpts();
    var quote = useMemo(function () {
        var _a;
        return (__assign(__assign({}, embed.view), { $type: 'app.bsky.feed.defs#postView', record: embed.view.value, embed: (_a = embed.view.embeds) === null || _a === void 0 ? void 0 : _a[0] }));
    }, [embed]);
    var moderation = useMemo(function () {
        return moderationOpts ? moderatePost(quote, moderationOpts) : undefined;
    }, [quote, moderationOpts]);
    var t = useTheme();
    var queryClient = useQueryClient();
    var itemUrip = new AtUri(quote.uri);
    var itemHref = makeProfileLink(quote.author, 'post', itemUrip.rkey);
    var itemTitle = "Post by ".concat(quote.author.handle);
    var richText = useMemo(function () {
        if (!bsky.dangerousIsType(quote.record, AppBskyFeedPost.isRecord))
            return undefined;
        var _a = quote.record, text = _a.text, facets = _a.facets;
        return text.trim()
            ? new RichTextAPI({ text: text, facets: facets })
            : undefined;
    }, [quote.record]);
    var onBeforePress = useCallback(function () {
        unstableCacheProfileView(queryClient, quote.author);
        onOpen === null || onOpen === void 0 ? void 0 : onOpen();
    }, [queryClient, quote.author, onOpen]);
    var _b = useInteractionState(), hover = _b.state, onPointerEnter = _b.onIn, onPointerLeave = _b.onOut;
    var _c = useInteractionState(), pressed = _c.state, onPressIn = _c.onIn, onPressOut = _c.onOut;
    return (_jsx(View, { style: [a.mt_sm], onPointerEnter: onPointerEnter, onPointerLeave: onPointerLeave, children: _jsx(ContentHider, { modui: moderation === null || moderation === void 0 ? void 0 : moderation.ui('contentList'), style: [a.rounded_md, a.border, t.atoms.border_contrast_low, style], activeStyle: [a.p_md, a.pt_sm], childContainerStyle: [a.pt_sm], children: function (_a) {
                var active = _a.active;
                return (_jsxs(_Fragment, { children: [!active && (_jsx(SubtleHover, { native: true, hover: hover || pressed, style: [a.rounded_md] })), _jsxs(Link, { style: [!active && a.p_md], hoverStyle: t.atoms.border_contrast_high, href: itemHref, title: itemTitle, onBeforePress: onBeforePress, onPressIn: onPressIn, onPressOut: onPressOut, children: [_jsx(View, { pointerEvents: "none", children: _jsx(PostMeta, { author: quote.author, moderation: moderation, showAvatar: true, postHref: itemHref, timestamp: quote.indexedAt }) }), moderation ? (_jsx(PostAlerts, { modui: moderation.ui('contentView'), style: [a.py_xs] })) : null, richText ? (_jsx(RichText, { value: richText, style: a.text_md, numberOfLines: 20, disableLinks: true })) : null, quote.embed && (_jsx(Embed, { embed: quote.embed, moderation: moderation, isWithinQuote: parentIsWithinQuote !== null && parentIsWithinQuote !== void 0 ? parentIsWithinQuote : true, 
                                    // already within quote? override nested
                                    allowNestedQuotes: parentIsWithinQuote ? false : parentAllowNestedQuotes }))] })] }));
            } }) }));
}
