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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBskyEmbedVideo, AppBskyFeedPost, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { sanitizeHandle } from '#/lib/strings/handles';
import { formatCount } from '#/view/com/util/numeric/format';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme } from '#/alf';
import { BLUE_HUE } from '#/alf/util/colorGeneration';
import { select } from '#/alf/util/themeSelector';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { EyeSlash_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/EyeSlash';
import { Heart2_Stroke2_Corner0_Rounded as Heart } from '#/components/icons/Heart2';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
import { Link } from '#/components/Link';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import * as Hider from '#/components/moderation/Hider';
import { Text } from '#/components/Typography';
import * as bsky from '#/types/bsky';
function getBlackColor(t) {
    return select(t.name, {
        light: t.palette.black,
        dark: t.atoms.bg_contrast_25.backgroundColor,
        dim: "hsl(".concat(BLUE_HUE, ", 28%, 6%)"),
    });
}
export function VideoPostCard(_a) {
    var _b, _c, _d;
    var post = _a.post, sourceContext = _a.sourceContext, moderation = _a.moderation, onInteract = _a.onInteract;
    var t = useTheme();
    var _e = useLingui(), _ = _e._, i18n = _e.i18n;
    var embed = post.embed;
    var _f = useInteractionState(), pressed = _f.state, onPressIn = _f.onIn, onPressOut = _f.onOut;
    var listModUi = moderation.ui('contentList');
    var mergedModui = useMemo(function () {
        var modui = moderation.ui('contentList');
        var mediaModui = moderation.ui('contentMedia');
        modui.alerts = __spreadArray(__spreadArray([], modui.alerts, true), mediaModui.alerts, true);
        modui.blurs = __spreadArray(__spreadArray([], modui.blurs, true), mediaModui.blurs, true);
        modui.filters = __spreadArray(__spreadArray([], modui.filters, true), mediaModui.filters, true);
        modui.informs = __spreadArray(__spreadArray([], modui.informs, true), mediaModui.informs, true);
        return modui;
    }, [moderation]);
    /**
     * Filtering should be done at a higher level, such as `PostFeed` or
     * `PostFeedVideoGridRow`, but we need to protect here as well.
     */
    if (!AppBskyEmbedVideo.isView(embed))
        return null;
    var author = post.author;
    var text = bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord)
        ? (_b = post.record) === null || _b === void 0 ? void 0 : _b.text
        : '';
    var likeCount = (_c = post === null || post === void 0 ? void 0 : post.likeCount) !== null && _c !== void 0 ? _c : 0;
    var repostCount = (_d = post === null || post === void 0 ? void 0 : post.repostCount) !== null && _d !== void 0 ? _d : 0;
    var thumbnail = embed.thumbnail;
    var black = getBlackColor(t);
    var textAndAuthor = (_jsxs(View, { style: [a.pr_xs, { paddingTop: 6, gap: 4 }], children: [text && (_jsx(Text, { style: [a.text_md, a.leading_snug], numberOfLines: 2, emoji: true, children: text })), _jsxs(View, { style: [a.flex_row, a.gap_xs, a.align_center], children: [_jsxs(View, { style: [a.relative, a.rounded_full, { width: 20, height: 20 }], children: [_jsx(UserAvatar, { type: "user", size: 20, avatar: post.author.avatar }), _jsx(MediaInsetBorder, {})] }), _jsx(Text, { style: [
                            a.flex_1,
                            a.text_sm,
                            a.leading_tight,
                            t.atoms.text_contrast_medium,
                        ], numberOfLines: 1, children: sanitizeHandle(post.author.handle, '@') })] })] }));
    return (_jsx(Link, { accessibilityHint: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Views video in immersive mode"], ["Views video in immersive mode"])))), label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Video from ", ": ", ""], ["Video from ", ": ", ""])), author.handle, text)), to: {
            screen: 'VideoFeed',
            params: __assign(__assign({}, sourceContext), { initialPostUri: post.uri }),
        }, onPress: function () {
            onInteract === null || onInteract === void 0 ? void 0 : onInteract();
        }, onPressIn: onPressIn, onPressOut: onPressOut, style: [
            a.flex_col,
            {
                alignItems: undefined,
                justifyContent: undefined,
            },
        ], children: _jsxs(Hider.Outer, { modui: mergedModui, children: [_jsxs(Hider.Mask, { children: [_jsxs(View, { style: [
                                a.justify_center,
                                a.rounded_md,
                                a.overflow_hidden,
                                {
                                    backgroundColor: black,
                                    aspectRatio: 9 / 16,
                                },
                            ], children: [_jsx(Image, { source: { uri: thumbnail }, style: [a.w_full, a.h_full, { opacity: pressed ? 0.8 : 1 }], accessibilityIgnoresInvertColors: true, blurRadius: 100 }), _jsx(MediaInsetBorder, {}), _jsxs(View, { style: [a.absolute, a.inset_0, a.justify_center, a.align_center], children: [_jsx(View, { style: [
                                                a.absolute,
                                                a.inset_0,
                                                a.justify_center,
                                                a.align_center,
                                                {
                                                    backgroundColor: 'black',
                                                    opacity: 0.2,
                                                },
                                            ] }), _jsxs(View, { style: [a.align_center, a.gap_xs], children: [_jsx(Eye, { size: "lg", fill: "white" }), _jsx(Text, { style: [a.text_sm, { color: 'white' }], children: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Hidden"], ["Hidden"])))) })] })] })] }), listModUi.blur ? (_jsx(VideoPostCardTextPlaceholder, { author: post.author })) : (textAndAuthor)] }), _jsxs(Hider.Content, { children: [_jsxs(View, { style: [
                                a.justify_center,
                                a.rounded_md,
                                a.overflow_hidden,
                                {
                                    backgroundColor: black,
                                    aspectRatio: 9 / 16,
                                },
                            ], children: [_jsx(Image, { source: { uri: thumbnail }, style: [a.w_full, a.h_full, { opacity: pressed ? 0.8 : 1 }], accessibilityIgnoresInvertColors: true }), _jsx(MediaInsetBorder, {}), _jsx(View, { style: [a.absolute, a.inset_0], children: _jsxs(View, { style: [
                                            a.absolute,
                                            a.inset_0,
                                            a.pt_2xl,
                                            {
                                                top: 'auto',
                                            },
                                        ], children: [_jsx(LinearGradient, { colors: [black, 'rgba(0, 0, 0, 0)'], locations: [0.02, 1], start: { x: 0, y: 1 }, end: { x: 0, y: 0 }, style: [a.absolute, a.inset_0, { opacity: 0.9 }] }), _jsxs(View, { style: [a.relative, a.z_10, a.p_md, a.flex_row, a.gap_md], children: [likeCount > 0 && (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(Heart, { size: "sm", fill: "white" }), _jsx(Text, { style: [a.text_sm, a.font_semi_bold, { color: 'white' }], children: formatCount(i18n, likeCount) })] })), repostCount > 0 && (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(Repost, { size: "sm", fill: "white" }), _jsx(Text, { style: [a.text_sm, a.font_semi_bold, { color: 'white' }], children: formatCount(i18n, repostCount) })] }))] })] }) })] }), textAndAuthor] })] }) }));
}
export function VideoPostCardPlaceholder() {
    var t = useTheme();
    var black = getBlackColor(t);
    return (_jsxs(View, { style: [a.flex_1], children: [_jsx(View, { style: [
                    a.rounded_md,
                    a.overflow_hidden,
                    {
                        backgroundColor: black,
                        aspectRatio: 9 / 16,
                    },
                ], children: _jsx(MediaInsetBorder, {}) }), _jsx(VideoPostCardTextPlaceholder, {})] }));
}
export function VideoPostCardTextPlaceholder(_a) {
    var author = _a.author;
    var t = useTheme();
    return (_jsx(View, { style: [a.flex_1], children: _jsxs(View, { style: [a.pr_xs, { paddingTop: 8, gap: 6 }], children: [_jsx(View, { style: [
                        a.w_full,
                        a.rounded_xs,
                        t.atoms.bg_contrast_50,
                        {
                            height: 14,
                        },
                    ] }), _jsx(View, { style: [
                        a.w_full,
                        a.rounded_xs,
                        t.atoms.bg_contrast_50,
                        {
                            height: 14,
                            width: '70%',
                        },
                    ] }), author ? (_jsxs(View, { style: [a.flex_row, a.gap_xs, a.align_center], children: [_jsxs(View, { style: [a.relative, a.rounded_full, { width: 20, height: 20 }], children: [_jsx(UserAvatar, { type: "user", size: 20, avatar: author.avatar }), _jsx(MediaInsetBorder, {})] }), _jsx(Text, { style: [
                                a.flex_1,
                                a.text_sm,
                                a.leading_tight,
                                t.atoms.text_contrast_medium,
                            ], numberOfLines: 1, children: sanitizeHandle(author.handle, '@') })] })) : (_jsxs(View, { style: [a.flex_row, a.gap_xs, a.align_center], children: [_jsx(View, { style: [
                                a.rounded_full,
                                t.atoms.bg_contrast_50,
                                {
                                    width: 20,
                                    height: 20,
                                },
                            ] }), _jsx(View, { style: [
                                a.rounded_xs,
                                t.atoms.bg_contrast_25,
                                {
                                    height: 12,
                                    width: '75%',
                                },
                            ] })] }))] }) }));
}
export function CompactVideoPostCard(_a) {
    var _b;
    var post = _a.post, sourceContext = _a.sourceContext, moderation = _a.moderation, onInteract = _a.onInteract;
    var t = useTheme();
    var _c = useLingui(), _ = _c._, i18n = _c.i18n;
    var embed = post.embed;
    var _d = useInteractionState(), pressed = _d.state, onPressIn = _d.onIn, onPressOut = _d.onOut;
    var mergedModui = useMemo(function () {
        var modui = moderation.ui('contentList');
        var mediaModui = moderation.ui('contentMedia');
        modui.alerts = __spreadArray(__spreadArray([], modui.alerts, true), mediaModui.alerts, true);
        modui.blurs = __spreadArray(__spreadArray([], modui.blurs, true), mediaModui.blurs, true);
        modui.filters = __spreadArray(__spreadArray([], modui.filters, true), mediaModui.filters, true);
        modui.informs = __spreadArray(__spreadArray([], modui.informs, true), mediaModui.informs, true);
        return modui;
    }, [moderation]);
    /**
     * Filtering should be done at a higher level, such as `PostFeed` or
     * `PostFeedVideoGridRow`, but we need to protect here as well.
     */
    if (!AppBskyEmbedVideo.isView(embed))
        return null;
    var likeCount = (_b = post === null || post === void 0 ? void 0 : post.likeCount) !== null && _b !== void 0 ? _b : 0;
    var showLikeCount = false;
    var thumbnail = embed.thumbnail;
    var black = getBlackColor(t);
    return (_jsx(Link, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["View video"], ["View video"])))), to: {
            screen: 'VideoFeed',
            params: __assign(__assign({}, sourceContext), { initialPostUri: post.uri }),
        }, onPress: function () {
            onInteract === null || onInteract === void 0 ? void 0 : onInteract();
        }, onPressIn: onPressIn, onPressOut: onPressOut, style: [
            a.flex_col,
            t.atoms.shadow_sm,
            {
                alignItems: undefined,
                justifyContent: undefined,
            },
        ], children: _jsxs(Hider.Outer, { modui: mergedModui, children: [_jsx(Hider.Mask, { children: _jsxs(View, { style: [
                            a.justify_center,
                            a.rounded_lg,
                            a.overflow_hidden,
                            a.border,
                            t.atoms.border_contrast_low,
                            {
                                backgroundColor: black,
                                aspectRatio: 9 / 16,
                            },
                        ], children: [_jsx(Image, { source: { uri: thumbnail }, style: [a.w_full, a.h_full, { opacity: pressed ? 0.8 : 1 }], accessibilityIgnoresInvertColors: true, blurRadius: 100 }), _jsx(MediaInsetBorder, {}), _jsxs(View, { style: [a.absolute, a.inset_0, a.justify_center, a.align_center], children: [_jsx(View, { style: [
                                            a.absolute,
                                            a.inset_0,
                                            a.justify_center,
                                            a.align_center,
                                            a.border,
                                            t.atoms.border_contrast_low,
                                            {
                                                backgroundColor: 'black',
                                                opacity: 0.2,
                                            },
                                        ] }), _jsxs(View, { style: [a.align_center, a.gap_xs], children: [_jsx(Eye, { size: "lg", fill: "white" }), _jsx(Text, { style: [a.text_sm, { color: 'white' }], children: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Hidden"], ["Hidden"])))) })] })] })] }) }), _jsx(Hider.Content, { children: _jsxs(View, { style: [
                            a.justify_center,
                            a.rounded_lg,
                            a.overflow_hidden,
                            a.border,
                            t.atoms.border_contrast_low,
                            {
                                backgroundColor: black,
                                aspectRatio: 9 / 16,
                            },
                        ], children: [_jsx(Image, { source: { uri: thumbnail }, style: [a.w_full, a.h_full, { opacity: pressed ? 0.8 : 1 }], accessibilityIgnoresInvertColors: true }), _jsx(MediaInsetBorder, {}), _jsxs(View, { style: [a.absolute, a.inset_0, t.atoms.shadow_sm], children: [_jsx(View, { style: [a.absolute, a.inset_0, a.p_sm, { bottom: 'auto' }], children: _jsxs(View, { style: [a.relative, a.rounded_full, { width: 24, height: 24 }], children: [_jsx(UserAvatar, { type: "user", size: 24, avatar: post.author.avatar }), _jsx(MediaInsetBorder, {})] }) }), showLikeCount && (_jsxs(View, { style: [
                                            a.absolute,
                                            a.inset_0,
                                            a.pt_2xl,
                                            {
                                                top: 'auto',
                                            },
                                        ], children: [_jsx(LinearGradient, { colors: [black, 'rgba(0, 0, 0, 0)'], locations: [0.02, 1], start: { x: 0, y: 1 }, end: { x: 0, y: 0 }, style: [a.absolute, a.inset_0, { opacity: 0.9 }] }), _jsx(View, { style: [a.relative, a.z_10, a.p_sm, a.flex_row, a.gap_md], children: likeCount > 0 && (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(Heart, { size: "sm", fill: "white" }), _jsx(Text, { style: [
                                                                a.text_sm,
                                                                a.font_semi_bold,
                                                                { color: 'white' },
                                                            ], children: formatCount(i18n, likeCount) })] })) })] }))] })] }) })] }) }));
}
export function CompactVideoPostCardPlaceholder() {
    var t = useTheme();
    var black = getBlackColor(t);
    return (_jsx(View, { style: [a.flex_1, t.atoms.shadow_sm], children: _jsx(View, { style: [
                a.rounded_lg,
                a.overflow_hidden,
                a.border,
                t.atoms.border_contrast_low,
                {
                    backgroundColor: black,
                    aspectRatio: 9 / 16,
                },
            ], children: _jsx(MediaInsetBorder, {}) }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
