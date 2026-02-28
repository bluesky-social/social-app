var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useCallOnce } from '#/lib/once';
import { isBskyCustomFeedUrl } from '#/lib/strings/url-helpers';
import { atoms as a, useBreakpoints, utils } from '#/alf';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
var roundedStyles = [a.rounded_lg, a.curve_continuous];
export function LiveEventFeedCardWide(_a) {
    var feed = _a.feed, metricContext = _a.metricContext;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var gtPhone = useBreakpoints().gtPhone;
    var layout = feed.layouts.wide;
    var overlayColor = layout.overlayColor;
    var textColor = layout.textColor;
    var url = useMemo(function () {
        // Validated in multiple places on the backend
        if (isBskyCustomFeedUrl(feed.url)) {
            return new URL(feed.url).pathname;
        }
        return '/';
    }, [feed.url]);
    useCallOnce(function () {
        ax.metric('liveEvents:feedBanner:seen', {
            feed: feed.url,
            context: metricContext,
        });
    })();
    return (_jsx(Link, { to: url, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Live event happening now: ", ""], ["Live event happening now: ", ""])), feed.title)), style: [a.w_full], onPress: function () {
            ax.metric('liveEvents:feedBanner:click', {
                feed: feed.url,
                context: metricContext,
            });
        }, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsx(View, { style: [roundedStyles, a.shadow_md, a.w_full], children: _jsxs(View, { style: [
                        a.align_start,
                        roundedStyles,
                        a.overflow_hidden,
                        {
                            aspectRatio: gtPhone ? 576 / 144 : 369 / 100,
                        },
                    ], children: [_jsx(Image, { accessibilityIgnoresInvertColors: true, source: { uri: layout.image }, placeholder: { blurhash: layout.blurhash }, style: [a.absolute, a.inset_0, a.w_full, a.h_full], contentFit: "cover", placeholderContentFit: "cover" }), _jsx(LinearGradient, { colors: [overlayColor, utils.alpha(overlayColor, 0)], locations: [0, 1], start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, style: [
                                a.absolute,
                                a.inset_0,
                                a.transition_opacity,
                                {
                                    transitionDuration: '200ms',
                                    opacity: hovered || pressed ? 0.6 : 0,
                                },
                            ] }), _jsxs(View, { style: [a.flex_1, a.justify_end], children: [_jsx(LinearGradient, { colors: [overlayColor, utils.alpha(overlayColor, 0)], locations: [0, 1], start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, style: [a.absolute, a.inset_0] }), _jsxs(View, { style: [
                                        a.z_10,
                                        gtPhone ? [a.pl_xl, a.pb_lg] : [a.pl_lg, a.pb_md],
                                        { paddingRight: 64 },
                                    ], children: [_jsx(Text, { style: [
                                                a.leading_snug,
                                                gtPhone ? a.text_xs : a.text_2xs,
                                                { color: textColor, opacity: 0.8 },
                                            ], children: feed.preview ? (_jsx(Trans, { children: "Preview" })) : (_jsx(Trans, { children: "Happening now" })) }), _jsx(Text, { style: [
                                                a.leading_snug,
                                                a.font_bold,
                                                gtPhone ? a.text_3xl : a.text_lg,
                                                { color: textColor },
                                            ], children: layout.title })] })] })] }) }));
        } }));
}
var templateObject_1;
