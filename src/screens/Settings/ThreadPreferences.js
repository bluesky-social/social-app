var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { normalizeSort, normalizeView, useThreadPreferences, } from '#/state/queries/preferences/useThreadPreferences';
import { atoms as a, useTheme } from '#/alf';
import * as Toggle from '#/components/forms/Toggle';
import { Bubbles_Stroke2_Corner2_Rounded as BubblesIcon } from '#/components/icons/Bubble';
import { Tree_Stroke2_Corner0_Rounded as TreeIcon } from '#/components/icons/Tree';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
import * as SettingsList from './components/SettingsList';
export function ThreadPreferencesScreen(_a) {
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useThreadPreferences({ save: true }), sort = _b.sort, setSort = _b.setSort, view = _b.view, setView = _b.setView;
    return (_jsxs(Layout.Screen, { testID: "threadPreferencesScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Thread Preferences" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsxs(SettingsList.Group, { children: [_jsx(SettingsList.ItemIcon, { icon: BubblesIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Sort replies" }) }), _jsxs(View, { style: [a.w_full, a.gap_md], children: [_jsx(Text, { style: [a.flex_1, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Sort replies to the same post by:" }) }), _jsx(Toggle.Group, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Sort replies by"], ["Sort replies by"])))), type: "radio", values: sort ? [sort] : [], onChange: function (values) { return setSort(normalizeSort(values[0])); }, children: _jsxs(View, { style: [a.gap_sm, a.flex_1], children: [_jsxs(Toggle.Item, { name: "top", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Top replies first"], ["Top replies first"])))), children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Top replies first" }) })] }), _jsxs(Toggle.Item, { name: "oldest", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Oldest replies first"], ["Oldest replies first"])))), children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Oldest replies first" }) })] }), _jsxs(Toggle.Item, { name: "newest", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Newest replies first"], ["Newest replies first"])))), children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: _jsx(Trans, { children: "Newest replies first" }) })] })] }) })] })] }), _jsxs(SettingsList.Group, { children: [_jsx(SettingsList.ItemIcon, { icon: TreeIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Tree view" }) }), _jsxs(Toggle.Item, { type: "checkbox", name: "threaded-mode", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Tree view"], ["Tree view"])))), value: view === 'tree', onChange: function (value) {
                                        return setView(normalizeView({ treeViewEnabled: value }));
                                    }, style: [a.w_full, a.gap_md], children: [_jsx(Toggle.LabelText, { style: [a.flex_1], children: _jsx(Trans, { children: "Show post replies in a threaded tree view" }) }), _jsx(Toggle.Platform, {})] })] })] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
