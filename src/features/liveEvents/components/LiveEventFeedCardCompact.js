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
import { useCallOnce } from '#/lib/once';
import { isBskyCustomFeedUrl } from '#/lib/strings/url-helpers';
import { atoms as a, utils } from '#/alf';
import { Live_Stroke2_Corner0_Rounded as LiveIcon } from '#/components/icons/Live';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
var roundedStyles = [a.rounded_md, a.curve_continuous];
export function LiveEventFeedCardCompact(_a) {
    var feed = _a.feed, metricContext = _a.metricContext;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var layout = feed.layouts.compact;
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
            return (_jsx(View, { style: [roundedStyles, a.shadow_md, a.w_full], children: _jsxs(View, { style: [a.w_full, a.align_start, a.overflow_hidden, roundedStyles], children: [_jsx(Image, { accessibilityIgnoresInvertColors: true, source: { uri: layout.image }, placeholder: { blurhash: layout.blurhash }, style: [a.absolute, a.inset_0, a.w_full, a.h_full], contentFit: "cover", placeholderContentFit: "cover" }), _jsx(LinearGradient, { colors: [overlayColor, utils.alpha(overlayColor, 0)], locations: [0, 1], start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, style: [
                                a.absolute,
                                a.inset_0,
                                a.transition_opacity,
                                {
                                    transitionDuration: '200ms',
                                    opacity: hovered || pressed ? 0.6 : 0,
                                },
                            ] }), _jsxs(View, { style: [a.w_full, a.justify_end], children: [_jsx(LinearGradient, { colors: [
                                        overlayColor,
                                        utils.alpha(overlayColor, 0.7),
                                        utils.alpha(overlayColor, 0),
                                    ], locations: [0, 0.8, 1], start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, style: [a.absolute, a.inset_0] }), _jsxs(View, { style: [
                                        a.flex_1,
                                        a.flex_row,
                                        a.align_center,
                                        a.gap_xs,
                                        a.z_10,
                                        a.px_lg,
                                        a.py_md,
                                    ], children: [_jsx(LiveIcon, { size: "md", fill: textColor }), _jsx(Text, { numberOfLines: 1, style: [
                                                a.flex_1,
                                                a.leading_snug,
                                                a.font_bold,
                                                a.text_lg,
                                                a.pr_xl,
                                                { color: textColor },
                                            ], children: layout.title })] })] })] }) }));
        } }));
}
var templateObject_1;
