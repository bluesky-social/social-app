var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { usePreferencesQuery, useSetFeedViewPreferencesMutation, } from '#/state/queries/preferences';
import { atoms as a } from '#/alf';
import { Admonition } from '#/components/Admonition';
import * as Toggle from '#/components/forms/Toggle';
import { Beaker_Stroke2_Corner2_Rounded as BeakerIcon } from '#/components/icons/Beaker';
import { Bubbles_Stroke2_Corner2_Rounded as BubblesIcon } from '#/components/icons/Bubble';
import { CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner2_Rounded as RepostIcon } from '#/components/icons/Repost';
import * as Layout from '#/components/Layout';
import * as SettingsList from './components/SettingsList';
export function FollowingFeedPreferencesScreen(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var _ = useLingui()._;
    var preferences = usePreferencesQuery().data;
    var _k = useSetFeedViewPreferencesMutation(), setFeedViewPref = _k.mutate, variables = _k.variables;
    var showReplies = !((_b = variables === null || variables === void 0 ? void 0 : variables.hideReplies) !== null && _b !== void 0 ? _b : (_c = preferences === null || preferences === void 0 ? void 0 : preferences.feedViewPrefs) === null || _c === void 0 ? void 0 : _c.hideReplies);
    var showReposts = !((_d = variables === null || variables === void 0 ? void 0 : variables.hideReposts) !== null && _d !== void 0 ? _d : (_e = preferences === null || preferences === void 0 ? void 0 : preferences.feedViewPrefs) === null || _e === void 0 ? void 0 : _e.hideReposts);
    var showQuotePosts = !((_f = variables === null || variables === void 0 ? void 0 : variables.hideQuotePosts) !== null && _f !== void 0 ? _f : (_g = preferences === null || preferences === void 0 ? void 0 : preferences.feedViewPrefs) === null || _g === void 0 ? void 0 : _g.hideQuotePosts);
    var mergeFeedEnabled = Boolean((_h = variables === null || variables === void 0 ? void 0 : variables.lab_mergeFeedEnabled) !== null && _h !== void 0 ? _h : (_j = preferences === null || preferences === void 0 ? void 0 : preferences.feedViewPrefs) === null || _j === void 0 ? void 0 : _j.lab_mergeFeedEnabled);
    return (_jsxs(Layout.Screen, { testID: "followingFeedPreferencesScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Following Feed Preferences" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsx(SettingsList.Item, { children: _jsx(Admonition, { type: "tip", style: [a.flex_1], children: _jsx(Trans, { children: "These settings only apply to the Following feed." }) }) }), _jsx(Toggle.Item, { type: "checkbox", name: "show-replies", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Show replies"], ["Show replies"])))), value: showReplies, onChange: function (value) {
                                return setFeedViewPref({
                                    hideReplies: !value,
                                });
                            }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: BubblesIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Show replies" }) }), _jsx(Toggle.Platform, {})] }) }), _jsx(Toggle.Item, { type: "checkbox", name: "show-reposts", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Show reposts"], ["Show reposts"])))), value: showReposts, onChange: function (value) {
                                return setFeedViewPref({
                                    hideReposts: !value,
                                });
                            }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: RepostIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Show reposts" }) }), _jsx(Toggle.Platform, {})] }) }), _jsx(Toggle.Item, { type: "checkbox", name: "show-quotes", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Show quote posts"], ["Show quote posts"])))), value: showQuotePosts, onChange: function (value) {
                                return setFeedViewPref({
                                    hideQuotePosts: !value,
                                });
                            }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: QuoteIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Show quote posts" }) }), _jsx(Toggle.Platform, {})] }) }), _jsx(SettingsList.Divider, {}), _jsxs(SettingsList.Group, { children: [_jsx(SettingsList.ItemIcon, { icon: BeakerIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Experimental" }) }), _jsxs(Toggle.Item, { type: "checkbox", name: "merge-feed", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Show samples of your saved feeds in your Following feed"], ["Show samples of your saved feeds in your Following feed"])))), value: mergeFeedEnabled, onChange: function (value) {
                                        return setFeedViewPref({
                                            lab_mergeFeedEnabled: value,
                                        });
                                    }, style: [a.w_full, a.gap_md], children: [_jsx(Toggle.LabelText, { style: [a.flex_1], children: _jsx(Trans, { children: "Show samples of your saved feeds in your Following feed" }) }), _jsx(Toggle.Platform, {})] })] })] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
