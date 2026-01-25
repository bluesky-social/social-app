var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { ScrollView, View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useTrendingSettings, useTrendingSettingsApi, } from '#/state/preferences/trending';
import { useTrendingTopics } from '#/state/queries/trending/useTrendingTopics';
import { useTrendingConfig } from '#/state/service-config';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { BlockDrawerGesture } from '#/view/shell/BlockDrawerGesture';
import { atoms as a, useGutters, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Trending2_Stroke2_Corner2_Rounded as Graph } from '#/components/icons/Trending';
import * as Prompt from '#/components/Prompt';
import { TrendingTopicLink } from '#/components/TrendingTopics';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
export function TrendingInterstitial() {
    var enabled = useTrendingConfig().enabled;
    var trendingDisabled = useTrendingSettings().trendingDisabled;
    return enabled && !trendingDisabled ? _jsx(Inner, {}) : null;
}
export function Inner() {
    var _a;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var gutters = useGutters([0, 'base', 0, 'base']);
    var trendingPrompt = Prompt.usePromptControl();
    var setTrendingDisabled = useTrendingSettingsApi().setTrendingDisabled;
    var _b = useTrendingTopics(), trending = _b.data, error = _b.error, isLoading = _b.isLoading;
    var noTopics = !isLoading && !error && !((_a = trending === null || trending === void 0 ? void 0 : trending.topics) === null || _a === void 0 ? void 0 : _a.length);
    var onConfirmHide = React.useCallback(function () {
        ax.metric('trendingTopics:hide', { context: 'interstitial' });
        setTrendingDisabled(true);
    }, [ax, setTrendingDisabled]);
    return error || noTopics ? null : (_jsxs(View, { style: [t.atoms.border_contrast_low, a.border_t, a.border_b], children: [_jsx(BlockDrawerGesture, { children: _jsx(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, decelerationRate: "fast", children: _jsxs(View, { style: [gutters, a.flex_row, a.align_center, a.gap_lg], children: [_jsx(View, { style: { paddingLeft: 4, paddingRight: 2 }, children: _jsx(Graph, { size: "sm" }) }), isLoading ? (_jsxs(View, { style: [a.py_lg, a.flex_row, a.gap_lg, a.align_center], children: [_jsx(LoadingPlaceholder, { width: 80, height: undefined, style: { alignSelf: 'stretch' } }), _jsx(LoadingPlaceholder, { width: 50, height: undefined, style: { alignSelf: 'stretch' } }), _jsx(LoadingPlaceholder, { width: 120, height: undefined, style: { alignSelf: 'stretch' } }), _jsx(LoadingPlaceholder, { width: 30, height: undefined, style: { alignSelf: 'stretch' } }), _jsx(LoadingPlaceholder, { width: 180, height: undefined, style: { alignSelf: 'stretch' } }), _jsx(Text, { style: [
                                            t.atoms.text_contrast_medium,
                                            a.text_sm,
                                            a.font_semi_bold,
                                        ], children: ' ' })] })) : !(trending === null || trending === void 0 ? void 0 : trending.topics) ? null : (_jsxs(_Fragment, { children: [trending.topics.map(function (topic) { return (_jsx(TrendingTopicLink, { topic: topic, onPress: function () {
                                            ax.metric('trendingTopic:click', {
                                                context: 'interstitial',
                                            });
                                        }, children: _jsx(View, { style: [a.py_lg], children: _jsx(Text, { style: [
                                                    t.atoms.text_contrast_medium,
                                                    a.text_sm,
                                                    a.font_semi_bold,
                                                ], children: topic.topic }) }) }, topic.link)); }), _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Hide trending topics"], ["Hide trending topics"])))), size: "tiny", variant: "ghost", color: "secondary", shape: "round", onPress: function () { return trendingPrompt.open(); }, children: _jsx(ButtonIcon, { icon: X }) })] }))] }) }) }), _jsx(Prompt.Basic, { control: trendingPrompt, title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Hide trending topics?"], ["Hide trending topics?"])))), description: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You can update this later from your settings."], ["You can update this later from your settings."])))), confirmButtonCta: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Hide"], ["Hide"])))), onConfirm: onConfirmHide })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
