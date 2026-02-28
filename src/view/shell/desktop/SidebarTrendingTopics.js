var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useTrendingSettings, useTrendingSettingsApi, } from '#/state/preferences/trending';
import { useTrendingTopics } from '#/state/queries/trending/useTrendingTopics';
import { useTrendingConfig } from '#/state/service-config';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { DotGrid3x1_Stroke2_Corner0_Rounded as Ellipsis } from '#/components/icons/DotGrid';
import { Trending3_Stroke2_Corner1_Rounded as TrendingIcon } from '#/components/icons/Trending';
import * as Prompt from '#/components/Prompt';
import { TrendingTopicLink } from '#/components/TrendingTopics';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
var TRENDING_LIMIT = 5;
export function SidebarTrendingTopics() {
    var enabled = useTrendingConfig().enabled;
    var trendingDisabled = useTrendingSettings().trendingDisabled;
    return !enabled ? null : trendingDisabled ? null : _jsx(Inner, {});
}
function Inner() {
    var _a;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var trendingPrompt = Prompt.usePromptControl();
    var setTrendingDisabled = useTrendingSettingsApi().setTrendingDisabled;
    var _b = useTrendingTopics(), trending = _b.data, error = _b.error, isLoading = _b.isLoading;
    var noTopics = !isLoading && !error && !((_a = trending === null || trending === void 0 ? void 0 : trending.topics) === null || _a === void 0 ? void 0 : _a.length);
    var onConfirmHide = function () {
        ax.metric('trendingTopics:hide', { context: 'sidebar' });
        setTrendingDisabled(true);
    };
    return error || noTopics ? null : (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.p_lg, a.rounded_md, a.border, t.atoms.border_contrast_low], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs, a.pb_md], children: [_jsx(TrendingIcon, { width: 16, height: 16, fill: t.atoms.text.color }), _jsx(Text, { style: [a.flex_1, a.text_md, a.font_semi_bold, t.atoms.text], children: _jsx(Trans, { children: "Trending" }) }), _jsx(Button, { variant: "ghost", size: "tiny", color: "secondary", shape: "round", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Trending options"], ["Trending options"])))), onPress: function () { return trendingPrompt.open(); }, style: [a.bg_transparent, { marginTop: -6, marginRight: -6 }], children: _jsx(ButtonIcon, { icon: Ellipsis, size: "xs" }) })] }), _jsx(View, { style: [a.gap_xs], children: isLoading ? (Array(TRENDING_LIMIT)
                            .fill(0)
                            .map(function (_n, i) { return (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: [_jsxs(Text, { style: [
                                        a.text_sm,
                                        t.atoms.text_contrast_low,
                                        { minWidth: 16 },
                                    ], children: [i + 1, "."] }), _jsx(View, { style: [
                                        a.rounded_xs,
                                        t.atoms.bg_contrast_50,
                                        { height: 14, width: i % 2 === 0 ? 80 : 100 },
                                    ] })] }, i)); })) : !(trending === null || trending === void 0 ? void 0 : trending.topics) ? null : (_jsx(_Fragment, { children: trending.topics.slice(0, TRENDING_LIMIT).map(function (topic, i) { return (_jsx(TrendingTopicLink, { topic: topic, style: [a.self_start], onPress: function () {
                                    ax.metric('trendingTopic:click', { context: 'sidebar' });
                                }, children: function (_a) {
                                    var _b;
                                    var hovered = _a.hovered;
                                    return (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsxs(Text, { style: [
                                                    a.text_sm,
                                                    a.leading_snug,
                                                    t.atoms.text_contrast_low,
                                                    { minWidth: 16 },
                                                ], children: [i + 1, "."] }), _jsx(Text, { style: [
                                                    a.text_sm,
                                                    a.leading_snug,
                                                    hovered
                                                        ? [t.atoms.text, a.underline]
                                                        : t.atoms.text_contrast_medium,
                                                ], numberOfLines: 1, children: (_b = topic.displayName) !== null && _b !== void 0 ? _b : topic.topic })] }));
                                } }, topic.link)); }) })) })] }), _jsx(Prompt.Basic, { control: trendingPrompt, title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Hide trending topics?"], ["Hide trending topics?"])))), description: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You can update this later from your settings."], ["You can update this later from your settings."])))), confirmButtonCta: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Hide"], ["Hide"])))), onConfirm: onConfirmHide })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
