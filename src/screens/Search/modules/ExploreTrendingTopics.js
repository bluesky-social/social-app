var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { moderateProfile } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useTrendingSettings } from '#/state/preferences/trending';
import { useGetTrendsQuery } from '#/state/queries/trending/useGetTrendsQuery';
import { useTrendingConfig } from '#/state/service-config';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { atoms as a, useGutters, useTheme, web } from '#/alf';
import { AvatarStack } from '#/components/AvatarStack';
import { Flame_Stroke2_Corner1_Rounded as FlameIcon } from '#/components/icons/Flame';
import { Trending3_Stroke2_Corner1_Rounded as TrendingIcon } from '#/components/icons/Trending';
import { Link } from '#/components/Link';
import { SubtleHover } from '#/components/SubtleHover';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
var TOPIC_COUNT = 5;
export function ExploreTrendingTopics() {
    var enabled = useTrendingConfig().enabled;
    var trendingDisabled = useTrendingSettings().trendingDisabled;
    return enabled && !trendingDisabled ? _jsx(Inner, {}) : null;
}
function Inner() {
    var _a;
    var ax = useAnalytics();
    var _b = useGetTrendsQuery(), trending = _b.data, error = _b.error, isLoading = _b.isLoading, isRefetching = _b.isRefetching;
    var noTopics = !isLoading && !error && !((_a = trending === null || trending === void 0 ? void 0 : trending.trends) === null || _a === void 0 ? void 0 : _a.length);
    return isLoading || isRefetching ? (Array.from({ length: TOPIC_COUNT }).map(function (__, i) { return (_jsx(TrendingTopicRowSkeleton, { withPosts: i === 0 }, i)); })) : error || !(trending === null || trending === void 0 ? void 0 : trending.trends) || noTopics ? null : (_jsx(_Fragment, { children: trending.trends.map(function (trend, index) { return (_jsx(TrendRow, { trend: trend, rank: index + 1, onPress: function () {
                ax.metric('trendingTopic:click', { context: 'explore' });
            } }, trend.link)); }) }));
}
export function TrendRow(_a) {
    var trend = _a.trend, rank = _a.rank, children = _a.children, onPress = _a.onPress;
    var t = useTheme();
    var _ = useLingui()._;
    var gutters = useGutters([0, 'base']);
    var category = useCategoryDisplayName((trend === null || trend === void 0 ? void 0 : trend.category) || 'other');
    var age = Math.floor((Date.now() - new Date(trend.startedAt || Date.now()).getTime()) /
        (1000 * 60 * 60));
    var badgeType = trend.status === 'hot' ? 'hot' : age < 2 ? 'new' : age;
    var actors = useModerateTrendingActors(trend.actors);
    return (_jsx(Link, { testID: trend.link, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Browse topic ", ""], ["Browse topic ", ""])), trend.displayName)), to: trend.link, onPress: onPress, style: [a.border_b, t.atoms.border_contrast_low], PressableComponent: Pressable, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(_Fragment, { children: [_jsx(SubtleHover, { hover: hovered || pressed, native: true }), _jsxs(View, { style: [gutters, a.w_full, a.py_lg, a.flex_row, a.gap_2xs], children: [_jsxs(View, { style: [a.flex_1, a.gap_xs], children: [_jsxs(View, { style: [a.flex_row], children: [_jsx(Text, { style: [
                                                    a.text_md,
                                                    a.font_semi_bold,
                                                    a.leading_tight,
                                                    { width: 20 },
                                                ], children: _jsxs(Trans, { comment: 'The trending topic rank, i.e. "1. March Madness", "2. The Bachelor"', children: [rank, "."] }) }), _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_tight], numberOfLines: 1, children: trend.displayName })] }), _jsxs(View, { style: [
                                            a.flex_row,
                                            a.gap_sm,
                                            a.align_center,
                                            { paddingLeft: 20 },
                                        ], children: [actors.length > 0 && (_jsx(AvatarStack, { size: 20, profiles: actors })), _jsx(Text, { style: [
                                                    a.text_sm,
                                                    t.atoms.text_contrast_medium,
                                                    web(a.leading_snug),
                                                ], numberOfLines: 1, children: category })] })] }), _jsx(View, { style: [a.flex_shrink_0], children: _jsx(TrendingIndicator, { type: badgeType }) })] }), children] }));
        } }));
}
function TrendingIndicator(_a) {
    var type = _a.type;
    var t = useTheme();
    var _ = useLingui()._;
    var pillStyles = [
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.rounded_full,
        { height: 28, paddingHorizontal: 10 },
    ];
    var Icon = null;
    var text = null;
    var color = null;
    var backgroundColor = null;
    switch (type) {
        case 'skeleton': {
            return (_jsx(View, { style: [
                    pillStyles,
                    { backgroundColor: t.palette.contrast_25, width: 65, height: 28 },
                ] }));
        }
        case 'hot': {
            Icon = FlameIcon;
            color =
                t.scheme === 'light' ? t.palette.negative_500 : t.palette.negative_950;
            backgroundColor =
                t.scheme === 'light' ? t.palette.negative_50 : t.palette.negative_200;
            text = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Hot"], ["Hot"]))));
            break;
        }
        case 'new': {
            Icon = TrendingIcon;
            text = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["New"], ["New"]))));
            color = t.palette.positive_600;
            backgroundColor = t.palette.positive_50;
            break;
        }
        default: {
            text = _(msg({
                message: "".concat(type, "h ago"),
                comment: 'trending topic time spent trending. should be as short as possible to fit in a pill',
            }));
            color = t.atoms.text_contrast_medium.color;
            backgroundColor = t.atoms.bg_contrast_25.backgroundColor;
            break;
        }
    }
    return (_jsxs(View, { style: [pillStyles, { backgroundColor: backgroundColor }], children: [Icon && _jsx(Icon, { size: "sm", style: { color: color } }), _jsx(Text, { style: [a.text_sm, a.font_medium, { color: color }], children: text })] }));
}
function useCategoryDisplayName(category) {
    var _ = useLingui()._;
    switch (category) {
        case 'sports':
            return _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Sports"], ["Sports"]))));
        case 'politics':
            return _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Politics"], ["Politics"]))));
        case 'video-games':
            return _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Video Games"], ["Video Games"]))));
        case 'pop-culture':
            return _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Entertainment"], ["Entertainment"]))));
        case 'news':
            return _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["News"], ["News"]))));
        case 'other':
        default:
            return null;
    }
}
export function TrendingTopicRowSkeleton(_a) {
    var t = useTheme();
    var gutters = useGutters([0, 'base']);
    return (_jsxs(View, { style: [
            gutters,
            a.w_full,
            a.py_lg,
            a.flex_row,
            a.gap_2xs,
            a.border_b,
            t.atoms.border_contrast_low,
        ], children: [_jsxs(View, { style: [a.flex_1, a.gap_sm], children: [_jsxs(View, { style: [a.flex_row, a.align_center], children: [_jsx(View, { style: [{ width: 20 }], children: _jsx(LoadingPlaceholder, { width: 12, height: 12, style: [a.rounded_full] }) }), _jsx(LoadingPlaceholder, { width: 90, height: 17 })] }), _jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center, { paddingLeft: 20 }], children: [_jsx(LoadingPlaceholder, { width: 70, height: 16 }), _jsx(LoadingPlaceholder, { width: 40, height: 16 }), _jsx(LoadingPlaceholder, { width: 60, height: 16 })] })] }), _jsx(View, { style: [a.flex_shrink_0], children: _jsx(TrendingIndicator, { type: "skeleton" }) })] }));
}
function useModerateTrendingActors(actors) {
    var moderationOpts = useModerationOpts();
    return useMemo(function () {
        if (!moderationOpts)
            return [];
        return actors
            .filter(function (actor) {
            var decision = moderateProfile(actor, moderationOpts);
            return !decision.ui('avatar').filter && !decision.ui('avatar').blur;
        })
            .slice(0, 3);
    }, [actors, moderationOpts]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
