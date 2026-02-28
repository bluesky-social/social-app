var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, View } from 'react-native';
import { AppBskyFeedPost, AppBskyRichtextFacet, AtUri, moderatePost, RichText as RichTextAPI, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { makeProfileLink } from '#/lib/routes/links';
import { convertBskyAppUrlIfNeeded, isBskyPostUrl, makeRecordUri, } from '#/lib/strings/url-helpers';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePostQuery } from '#/state/queries/post';
import { PostMeta } from '#/view/com/util/PostMeta';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import * as MediaPreview from '#/components/MediaPreview';
import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import * as bsky from '#/types/bsky';
export function useMessageEmbed() {
    var route = useRoute();
    var navigation = useNavigation();
    var embedFromParams = route.params.embed;
    var _a = useState(embedFromParams), embedUri = _a[0], setEmbed = _a[1];
    if (embedFromParams && embedUri !== embedFromParams) {
        setEmbed(embedFromParams);
    }
    return {
        embedUri: embedUri,
        setEmbed: useCallback(function (embedUrl) {
            if (!embedUrl) {
                navigation.setParams({ embed: '' });
                setEmbed(undefined);
                return;
            }
            if (embedFromParams)
                return;
            var url = convertBskyAppUrlIfNeeded(embedUrl);
            var _a = url.split('/').filter(Boolean), _0 = _a[0], user = _a[1], _1 = _a[2], rkey = _a[3];
            var uri = makeRecordUri(user, 'app.bsky.feed.post', rkey);
            setEmbed(uri);
        }, [embedFromParams, navigation]),
    };
}
export function useExtractEmbedFromFacets(message, setEmbed) {
    var _a;
    var rt = new RichTextAPI({ text: message });
    rt.detectFacetsWithoutResolution();
    var uriFromFacet;
    for (var _i = 0, _b = (_a = rt.facets) !== null && _a !== void 0 ? _a : []; _i < _b.length; _i++) {
        var facet = _b[_i];
        for (var _c = 0, _d = facet.features; _c < _d.length; _c++) {
            var feature = _d[_c];
            if (AppBskyRichtextFacet.isLink(feature) && isBskyPostUrl(feature.uri)) {
                uriFromFacet = feature.uri;
                break;
            }
        }
    }
    useEffect(function () {
        if (uriFromFacet) {
            setEmbed(uriFromFacet);
        }
    }, [uriFromFacet, setEmbed]);
}
export function MessageInputEmbed(_a) {
    var embedUri = _a.embedUri, setEmbed = _a.setEmbed;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = usePostQuery(embedUri), post = _b.data, status = _b.status;
    var moderationOpts = useModerationOpts();
    var moderation = useMemo(function () {
        return moderationOpts && post ? moderatePost(post, moderationOpts) : undefined;
    }, [moderationOpts, post]);
    var _c = useMemo(function () {
        if (post &&
            bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord)) {
            return {
                rt: new RichTextAPI({
                    text: post.record.text,
                    facets: post.record.facets,
                }),
                record: post.record,
            };
        }
        return { rt: undefined, record: undefined };
    }, [post]), rt = _c.rt, record = _c.record;
    if (!embedUri) {
        return null;
    }
    var content = null;
    switch (status) {
        case 'pending':
            content = (_jsx(View, { style: [a.flex_1, { minHeight: 64 }, a.justify_center, a.align_center], children: _jsx(Loader, {}) }));
            break;
        case 'error':
            content = (_jsx(View, { style: [a.flex_1, { minHeight: 64 }, a.justify_center, a.align_center], children: _jsx(Text, { style: a.text_center, children: "Could not fetch post" }) }));
            break;
        case 'success':
            var itemUrip = new AtUri(post.uri);
            var itemHref = makeProfileLink(post.author, 'post', itemUrip.rkey);
            if (!post || !moderation || !rt || !record) {
                return null;
            }
            content = (_jsxs(View, { style: [
                    a.flex_1,
                    t.atoms.bg,
                    t.atoms.border_contrast_low,
                    a.rounded_md,
                    a.border,
                    a.p_sm,
                    a.mb_sm,
                ], pointerEvents: "none", children: [_jsx(PostMeta, { showAvatar: true, author: post.author, moderation: moderation, timestamp: post.indexedAt, postHref: itemHref, style: a.flex_0 }), _jsxs(ContentHider, { modui: moderation.ui('contentView'), children: [_jsx(PostAlerts, { modui: moderation.ui('contentView'), style: a.py_xs }), rt.text && (_jsx(View, { style: a.mt_xs, children: _jsx(RichText, { enableTags: true, testID: "postText", value: rt, style: [a.text_sm, t.atoms.text_contrast_high], authorHandle: post.author.handle, numberOfLines: 3 }) })), _jsx(MediaPreview.Embed, { embed: post.embed, style: a.mt_sm })] })] }));
            break;
    }
    return (_jsxs(View, { style: [a.flex_row, a.gap_sm], children: [content, _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Remove embed"], ["Remove embed"])))), onPress: function () {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setEmbed(undefined);
                }, size: "tiny", variant: "solid", color: "secondary", shape: "round", children: _jsx(ButtonIcon, { icon: X }) })] }));
}
var templateObject_1;
