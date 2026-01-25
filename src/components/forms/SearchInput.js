var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_10 } from '#/lib/constants';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import * as TextField from '#/components/forms/TextField';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { IS_NATIVE } from '#/env';
export var SearchInput = React.forwardRef(function SearchInput(_a, ref) {
    var value = _a.value, label = _a.label, onClearText = _a.onClearText, rest = __rest(_a, ["value", "label", "onClearText"]);
    var t = useTheme();
    var _ = useLingui()._;
    var showClear = value && value.length > 0;
    return (_jsxs(View, { style: [a.w_full, a.relative], children: [_jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: MagnifyingGlassIcon }), _jsx(TextField.Input, __assign({ inputRef: ref, label: label || _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Search"], ["Search"])))), value: value, placeholder: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Search"], ["Search"])))), returnKeyType: "search", keyboardAppearance: t.scheme, selectTextOnFocus: IS_NATIVE, autoFocus: false, accessibilityRole: "search", autoCorrect: false, autoComplete: "off", autoCapitalize: "none", style: [
                            showClear
                                ? {
                                    paddingRight: 24,
                                }
                                : {},
                        ] }, rest))] }), showClear && (_jsx(View, { style: [
                    a.absolute,
                    a.z_20,
                    a.my_auto,
                    a.inset_0,
                    a.justify_center,
                    a.pr_sm,
                    { left: 'auto' },
                ], children: _jsx(Button, { testID: "searchTextInputClearBtn", onPress: onClearText, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Clear search query"], ["Clear search query"])))), hitSlop: HITSLOP_10, size: "tiny", shape: "round", variant: "ghost", color: "secondary", children: _jsx(ButtonIcon, { icon: X, size: "xs" }) }) }))] }));
});
var templateObject_1, templateObject_2, templateObject_3;
