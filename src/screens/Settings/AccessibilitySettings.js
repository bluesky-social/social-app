var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useHapticsDisabled, useRequireAltTextEnabled, useSetHapticsDisabled, useSetRequireAltTextEnabled, } from '#/state/preferences';
import { useLargeAltBadgeEnabled, useSetLargeAltBadgeEnabled, } from '#/state/preferences/large-alt-badge';
import * as SettingsList from '#/screens/Settings/components/SettingsList';
import { atoms as a } from '#/alf';
import * as Toggle from '#/components/forms/Toggle';
import { Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon } from '#/components/icons/Accessibility';
import { Haptic_Stroke2_Corner2_Rounded as HapticIcon } from '#/components/icons/Haptic';
import * as Layout from '#/components/Layout';
import { IS_NATIVE } from '#/env';
export function AccessibilitySettingsScreen(_a) {
    var _ = useLingui()._;
    var requireAltTextEnabled = useRequireAltTextEnabled();
    var setRequireAltTextEnabled = useSetRequireAltTextEnabled();
    var hapticsDisabled = useHapticsDisabled();
    var setHapticsDisabled = useSetHapticsDisabled();
    var largeAltBadgeEnabled = useLargeAltBadgeEnabled();
    var setLargeAltBadgeEnabled = useSetLargeAltBadgeEnabled();
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Accessibility" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsxs(SettingsList.Group, { contentContainerStyle: [a.gap_sm], children: [_jsx(SettingsList.ItemIcon, { icon: AccessibilityIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Alt text" }) }), _jsxs(Toggle.Item, { name: "require_alt_text", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Require alt text before posting"], ["Require alt text before posting"])))), value: requireAltTextEnabled !== null && requireAltTextEnabled !== void 0 ? requireAltTextEnabled : false, onChange: function (value) { return setRequireAltTextEnabled(value); }, style: [a.w_full], children: [_jsx(Toggle.LabelText, { style: [a.flex_1], children: _jsx(Trans, { children: "Require alt text before posting" }) }), _jsx(Toggle.Platform, {})] }), _jsxs(Toggle.Item, { name: "large_alt_badge", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Display larger alt text badges"], ["Display larger alt text badges"])))), value: !!largeAltBadgeEnabled, onChange: function (value) { return setLargeAltBadgeEnabled(value); }, style: [a.w_full], children: [_jsx(Toggle.LabelText, { style: [a.flex_1], children: _jsx(Trans, { children: "Display larger alt text badges" }) }), _jsx(Toggle.Platform, {})] })] }), IS_NATIVE && (_jsxs(_Fragment, { children: [_jsx(SettingsList.Divider, {}), _jsxs(SettingsList.Group, { contentContainerStyle: [a.gap_sm], children: [_jsx(SettingsList.ItemIcon, { icon: HapticIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Haptics" }) }), _jsxs(Toggle.Item, { name: "haptics", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Disable haptic feedback"], ["Disable haptic feedback"])))), value: hapticsDisabled !== null && hapticsDisabled !== void 0 ? hapticsDisabled : false, onChange: function (value) { return setHapticsDisabled(value); }, style: [a.w_full], children: [_jsx(Toggle.LabelText, { style: [a.flex_1], children: _jsx(Trans, { children: "Disable haptic feedback" }) }), _jsx(Toggle.Platform, {})] })] })] }))] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
