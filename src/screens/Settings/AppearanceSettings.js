var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from 'react';
import Animated, { FadeInUp, FadeOutUp, LayoutAnimationConfig, LinearTransition, } from 'react-native-reanimated';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useSetThemePrefs, useThemePrefs } from '#/state/shell';
import { SettingsListItem as AppIconSettingsListItem } from '#/screens/Settings/AppIconSettings/SettingsListItem';
import { atoms as a, native, useAlf, useTheme } from '#/alf';
import * as SegmentedControl from '#/components/forms/SegmentedControl';
import { Moon_Stroke2_Corner0_Rounded as MoonIcon } from '#/components/icons/Moon';
import { Phone_Stroke2_Corner0_Rounded as PhoneIcon } from '#/components/icons/Phone';
import { TextSize_Stroke2_Corner0_Rounded as TextSize } from '#/components/icons/TextSize';
import { TitleCase_Stroke2_Corner0_Rounded as Aa } from '#/components/icons/TitleCase';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
import { IS_INTERNAL } from '#/env';
import * as SettingsList from './components/SettingsList';
export function AppearanceSettingsScreen(_a) {
    var _ = useLingui()._;
    var fonts = useAlf().fonts;
    var _b = useThemePrefs(), colorMode = _b.colorMode, darkTheme = _b.darkTheme;
    var _c = useSetThemePrefs(), setColorMode = _c.setColorMode, setDarkTheme = _c.setDarkTheme;
    var onChangeAppearance = useCallback(function (value) {
        setColorMode(value);
    }, [setColorMode]);
    var onChangeDarkTheme = useCallback(function (value) {
        setDarkTheme(value);
    }, [setDarkTheme]);
    var onChangeFontFamily = useCallback(function (value) {
        fonts.setFontFamily(value);
    }, [fonts]);
    var onChangeFontScale = useCallback(function (value) {
        fonts.setFontScale(value);
    }, [fonts]);
    return (_jsx(LayoutAnimationConfig, { skipExiting: true, skipEntering: true, children: _jsxs(Layout.Screen, { testID: "preferencesThreadsScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Appearance" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsx(AppearanceToggleButtonGroup, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Color mode"], ["Color mode"])))), icon: PhoneIcon, items: [
                                    {
                                        label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["System"], ["System"])))),
                                        name: 'system',
                                    },
                                    {
                                        label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Light"], ["Light"])))),
                                        name: 'light',
                                    },
                                    {
                                        label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Dark"], ["Dark"])))),
                                        name: 'dark',
                                    },
                                ], value: colorMode, onChange: onChangeAppearance }), colorMode !== 'light' && (_jsx(Animated.View, { entering: native(FadeInUp), exiting: native(FadeOutUp), children: _jsx(AppearanceToggleButtonGroup, { title: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Dark theme"], ["Dark theme"])))), icon: MoonIcon, items: [
                                        {
                                            label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Dim"], ["Dim"])))),
                                            name: 'dim',
                                        },
                                        {
                                            label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Dark"], ["Dark"])))),
                                            name: 'dark',
                                        },
                                    ], value: darkTheme !== null && darkTheme !== void 0 ? darkTheme : 'dim', onChange: onChangeDarkTheme }) })), _jsxs(Animated.View, { layout: native(LinearTransition), children: [_jsx(SettingsList.Divider, {}), _jsx(AppearanceToggleButtonGroup, { title: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Font"], ["Font"])))), description: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["For the best experience, we recommend using the theme font."], ["For the best experience, we recommend using the theme font."])))), icon: Aa, items: [
                                            {
                                                label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["System"], ["System"])))),
                                                name: 'system',
                                            },
                                            {
                                                label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Theme"], ["Theme"])))),
                                                name: 'theme',
                                            },
                                        ], value: fonts.family, onChange: onChangeFontFamily }), _jsx(AppearanceToggleButtonGroup, { title: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Font size"], ["Font size"])))), icon: TextSize, items: [
                                            {
                                                label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Smaller"], ["Smaller"])))),
                                                name: '-1',
                                            },
                                            {
                                                label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Default"], ["Default"])))),
                                                name: '0',
                                            },
                                            {
                                                label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Larger"], ["Larger"])))),
                                                name: '1',
                                            },
                                        ], value: fonts.scale, onChange: onChangeFontScale }), IS_NATIVE && IS_INTERNAL && (_jsxs(_Fragment, { children: [_jsx(SettingsList.Divider, {}), _jsx(AppIconSettingsListItem, {})] }))] })] }) })] }) }));
}
export function AppearanceToggleButtonGroup(_a) {
    var title = _a.title, description = _a.description, Icon = _a.icon, items = _a.items, value = _a.value, onChange = _a.onChange;
    var t = useTheme();
    return (_jsx(_Fragment, { children: _jsxs(SettingsList.Group, { contentContainerStyle: [a.gap_sm], iconInset: false, children: [_jsx(SettingsList.ItemIcon, { icon: Icon }), _jsx(SettingsList.ItemText, { children: title }), description && (_jsx(Text, { style: [
                        a.text_sm,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                        a.w_full,
                    ], children: description })), _jsx(SegmentedControl.Root, { type: "radio", label: title, value: value, onChange: onChange, children: items.map(function (item) { return (_jsx(SegmentedControl.Item, { label: item.label, value: item.name, children: _jsx(SegmentedControl.ItemText, { children: item.label }) }, item.name)); }) })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15;
