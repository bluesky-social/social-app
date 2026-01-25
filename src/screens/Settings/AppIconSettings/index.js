var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import * as DynamicAppIcon from '@mozzius/expo-dynamic-app-icon';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { AppIconImage } from '#/screens/Settings/AppIconSettings/AppIconImage';
import { useAppIconSets } from '#/screens/Settings/AppIconSettings/useAppIconSets';
import { atoms as a, useTheme } from '#/alf';
import * as Toggle from '#/components/forms/Toggle';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
import { IS_ANDROID, IS_INTERNAL } from '#/env';
export function AppIconSettingsScreen(_a) {
    var t = useTheme();
    var _ = useLingui()._;
    var sets = useAppIconSets();
    var _b = useState(function () {
        return getAppIconName(DynamicAppIcon.getAppIcon());
    }), currentAppIcon = _b[0], setCurrentAppIcon = _b[1];
    var onSetAppIcon = function (icon) {
        var _a;
        if (IS_ANDROID) {
            var next = (_a = sets.defaults.find(function (i) { return i.id === icon; })) !== null && _a !== void 0 ? _a : sets.core.find(function (i) { return i.id === icon; });
            Alert.alert(next
                ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Change app icon to \"", "\""], ["Change app icon to \"", "\""])), next.name))
                : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Change app icon"], ["Change app icon"])))), 
            // unfortunately necessary -sfn
            _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["The app will be restarted"], ["The app will be restarted"])))), [
                {
                    text: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Cancel"], ["Cancel"])))),
                    style: 'cancel',
                },
                {
                    text: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["OK"], ["OK"])))),
                    onPress: function () {
                        setCurrentAppIcon(setAppIcon(icon));
                    },
                    style: 'default',
                },
            ]);
        }
        else {
            setCurrentAppIcon(setAppIcon(icon));
        }
    };
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "App Icon" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsxs(Layout.Content, { contentContainerStyle: [a.p_lg], children: [_jsx(Group, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Default icons"], ["Default icons"])))), value: currentAppIcon, onChange: onSetAppIcon, children: sets.defaults.map(function (icon, i) { return (_jsxs(Row, { icon: icon, isEnd: i === sets.defaults.length - 1, children: [_jsx(AppIcon, { icon: icon, size: 40 }, icon.id), _jsx(RowText, { children: icon.name })] }, icon.id)); }) }), IS_INTERNAL && (_jsxs(_Fragment, { children: [_jsx(Text, { style: [
                                    a.text_md,
                                    a.mt_xl,
                                    a.mb_sm,
                                    a.font_semi_bold,
                                    t.atoms.text_contrast_medium,
                                ], children: _jsx(Trans, { children: "Bluesky+" }) }), _jsx(Group, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Bluesky+ icons"], ["Bluesky+ icons"])))), value: currentAppIcon, onChange: onSetAppIcon, children: sets.core.map(function (icon, i) { return (_jsxs(Row, { icon: icon, isEnd: i === sets.core.length - 1, children: [_jsx(AppIcon, { icon: icon, size: 40 }, icon.id), _jsx(RowText, { children: icon.name })] }, icon.id)); }) })] }))] })] }));
}
function setAppIcon(icon) {
    if (icon === 'default_light') {
        return getAppIconName(DynamicAppIcon.setAppIcon(null));
    }
    else {
        return getAppIconName(DynamicAppIcon.setAppIcon(icon));
    }
}
function getAppIconName(icon) {
    if (!icon || icon === 'DEFAULT') {
        return 'default_light';
    }
    else {
        return icon;
    }
}
function Group(_a) {
    var children = _a.children, label = _a.label, value = _a.value, onChange = _a.onChange;
    return (_jsx(Toggle.Group, { type: "radio", label: label, values: [value], maxSelections: 1, onChange: function (vals) {
            if (vals[0])
                onChange(vals[0]);
        }, children: _jsx(View, { style: [a.flex_1, a.rounded_md, a.overflow_hidden], children: children }) }));
}
function Row(_a) {
    var icon = _a.icon, children = _a.children, isEnd = _a.isEnd;
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsx(Toggle.Item, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Set app icon to ", ""], ["Set app icon to ", ""])), icon.name)), name: icon.id, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(View, { style: [
                    a.flex_1,
                    a.p_md,
                    a.flex_row,
                    a.gap_md,
                    a.align_center,
                    t.atoms.bg_contrast_25,
                    (hovered || pressed) && t.atoms.bg_contrast_50,
                    t.atoms.border_contrast_high,
                    !isEnd && a.border_b,
                ], children: [children, _jsx(Toggle.Radio, {})] }));
        } }));
}
function RowText(_a) {
    var children = _a.children;
    var t = useTheme();
    return (_jsx(Text, { style: [
            a.text_md,
            a.font_semi_bold,
            a.flex_1,
            t.atoms.text_contrast_medium,
        ], emoji: true, children: children }));
}
function AppIcon(_a) {
    var icon = _a.icon, _b = _a.size, size = _b === void 0 ? 50 : _b;
    var _ = useLingui()._;
    return (_jsx(PressableScale, { accessibilityLabel: icon.name, accessibilityHint: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Changes app icon"], ["Changes app icon"])))), targetScale: 0.95, onPress: function () {
            if (IS_ANDROID) {
                Alert.alert(_(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Change app icon to \"", "\""], ["Change app icon to \"", "\""])), icon.name)), _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["The app will be restarted"], ["The app will be restarted"])))), [
                    {
                        text: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Cancel"], ["Cancel"])))),
                        style: 'cancel',
                    },
                    {
                        text: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["OK"], ["OK"])))),
                        onPress: function () {
                            DynamicAppIcon.setAppIcon(icon.id);
                        },
                        style: 'default',
                    },
                ]);
            }
            else {
                DynamicAppIcon.setAppIcon(icon.id);
            }
        }, children: _jsx(AppIconImage, { icon: icon, size: size }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13;
