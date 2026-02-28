var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { AppBskyEmbedImages, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyFeedPost, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { PreviewableUserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme, web } from '#/alf';
import { QuoteEmbed } from '#/components/Post/Embed';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { parseEmbed } from '#/types/bsky/post';
export function ComposerReplyTo(_a) {
    var _b, _c, _d;
    var replyTo = _a.replyTo;
    var t = useTheme();
    var _ = useLingui()._;
    var embed = replyTo.embed;
    var _e = useState(false), showFull = _e[0], setShowFull = _e[1];
    var onPress = useCallback(function () {
        setShowFull(function (prev) { return !prev; });
        LayoutAnimation.configureNext({
            duration: 350,
            update: { type: 'spring', springDamping: 0.7 },
        });
    }, []);
    var quoteEmbed = useMemo(function () {
        if (AppBskyEmbedRecord.isView(embed) &&
            AppBskyEmbedRecord.isViewRecord(embed.record) &&
            AppBskyFeedPost.isRecord(embed.record.value)) {
            return embed;
        }
        else if (AppBskyEmbedRecordWithMedia.isView(embed) &&
            AppBskyEmbedRecord.isViewRecord(embed.record.record) &&
            AppBskyFeedPost.isRecord(embed.record.record.value)) {
            return embed.record;
        }
        return null;
    }, [embed]);
    var parsedQuoteEmbed = quoteEmbed
        ? parseEmbed(__assign({ $type: 'app.bsky.embed.record#view' }, quoteEmbed))
        : null;
    var images = useMemo(function () {
        if (AppBskyEmbedImages.isView(embed)) {
            return embed.images;
        }
        else if (AppBskyEmbedRecordWithMedia.isView(embed) &&
            AppBskyEmbedImages.isView(embed.media)) {
            return embed.media.images;
        }
    }, [embed]);
    var verification = useSimpleVerificationState({ profile: replyTo.author });
    return (_jsxs(Pressable, { style: [
            a.flex_row,
            a.align_start,
            a.pt_xs,
            a.pb_lg,
            a.mb_md,
            a.mx_lg,
            a.border_b,
            t.atoms.border_contrast_medium,
            web(a.user_select_text),
        ], onPress: onPress, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Expand or collapse the full post you are replying to"], ["Expand or collapse the full post you are replying to"])))), accessibilityHint: "", children: [_jsx(PreviewableUserAvatar, { size: 42, profile: replyTo.author, moderation: (_b = replyTo.moderation) === null || _b === void 0 ? void 0 : _b.ui('avatar'), type: ((_c = replyTo.author.associated) === null || _c === void 0 ? void 0 : _c.labeler) ? 'labeler' : 'user', disableNavigation: true }), _jsxs(View, { style: [a.flex_1, a.pl_md, a.pr_sm, a.gap_2xs], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.pr_xs], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_md, a.leading_snug, a.flex_shrink], numberOfLines: 1, emoji: true, children: sanitizeDisplayName(replyTo.author.displayName ||
                                    sanitizeHandle(replyTo.author.handle)) }), verification.showBadge && (_jsx(View, { style: [a.pl_xs], children: _jsx(VerificationCheck, { width: 14, verifier: verification.role === 'verifier' }) }))] }), _jsxs(View, { style: [a.flex_row, a.gap_md], children: [_jsx(View, { style: [a.flex_1, a.flex_grow], children: _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_high], numberOfLines: !showFull ? 6 : undefined, emoji: true, children: replyTo.text }) }), images && !((_d = replyTo.moderation) === null || _d === void 0 ? void 0 : _d.ui('contentMedia').blur) && (_jsx(ComposerReplyToImages, { images: images, showFull: showFull }))] }), showFull && parsedQuoteEmbed && parsedQuoteEmbed.type === 'post' && (_jsx(QuoteEmbed, { embed: parsedQuoteEmbed, linkDisabled: true }))] })] }));
}
function ComposerReplyToImages(_a) {
    var images = _a.images;
    return (_jsx(View, { style: [
            a.rounded_xs,
            a.overflow_hidden,
            a.mt_2xs,
            a.mx_xs,
            {
                height: 64,
                width: 64,
            },
        ], children: (images.length === 1 && (_jsx(Image, { source: { uri: images[0].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true }))) ||
            (images.length === 2 && (_jsxs(View, { style: [a.flex_1, a.flex_row, a.gap_2xs], children: [_jsx(Image, { source: { uri: images[0].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true }), _jsx(Image, { source: { uri: images[1].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true })] }))) ||
            (images.length === 3 && (_jsxs(View, { style: [a.flex_1, a.flex_row, a.gap_2xs], children: [_jsx(Image, { source: { uri: images[0].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true }), _jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsx(Image, { source: { uri: images[1].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true }), _jsx(Image, { source: { uri: images[2].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true })] })] }))) ||
            (images.length === 4 && (_jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsxs(View, { style: [a.flex_1, a.flex_row, a.gap_2xs], children: [_jsx(Image, { source: { uri: images[0].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true }), _jsx(Image, { source: { uri: images[1].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true })] }), _jsxs(View, { style: [a.flex_1, a.flex_row, a.gap_2xs], children: [_jsx(Image, { source: { uri: images[2].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true }), _jsx(Image, { source: { uri: images[3].thumb }, style: [a.flex_1], cachePolicy: "memory-disk", accessibilityIgnoresInvertColors: true })] })] }))) }));
}
var templateObject_1;
