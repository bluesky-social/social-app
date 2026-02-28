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
import { jsx as _jsx } from "react/jsx-runtime";
import { useContext } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_30 } from '#/lib/constants';
import { Logomark } from '#/view/icons/Logomark';
import { atoms as a, platform, useGutters, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft } from '#/components/icons/Arrow';
import { BUTTON_VISUAL_ALIGNMENT_OFFSET, Header, HEADER_SLOT_SIZE, } from '#/components/Layout';
import { IS_WEB } from '#/env';
import { AuthLayoutNavigationContext } from '../context';
/**
 * This is a simplified version of `Layout.Header` for the auth screens.
 */
export var Slot = Header.Slot;
export function Outer(_a) {
    var children = _a.children;
    var t = useTheme();
    var gutters = useGutters([0, 'wide']);
    return (_jsx(View, { style: [
            a.w_full,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            gutters,
            platform({
                native: [a.pb_xs, { minHeight: 48 }],
                web: [a.py_xs, { minHeight: 52 }],
            }),
            t.atoms.border_contrast_low,
        ], children: children }));
}
export function Content(_a) {
    var children = _a.children;
    return (_jsx(View, { style: [a.flex_1, a.justify_center, { minHeight: HEADER_SLOT_SIZE }], children: IS_WEB ? children : _jsx(Logo, {}) }));
}
export function Logo() {
    var t = useTheme();
    return _jsx(Logomark, { fill: t.palette.primary_500, style: [a.mx_auto] });
}
export function BackButton(_a) {
    var onPress = _a.onPress, style = _a.style, props = __rest(_a, ["onPress", "style"]);
    var _ = useLingui()._;
    var navigation = useContext(AuthLayoutNavigationContext);
    var onPressBack = function (evt) {
        onPress === null || onPress === void 0 ? void 0 : onPress(evt);
        if (evt.defaultPrevented)
            return;
        navigation === null || navigation === void 0 ? void 0 : navigation.goBack();
    };
    return (_jsx(Slot, { children: _jsx(Button, __assign({ label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go back"], ["Go back"])))), onPress: onPressBack, size: "small", variant: "ghost", color: "secondary", shape: "round", hitSlop: HITSLOP_30, style: [
                { marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET },
                a.bg_transparent,
                style,
            ] }, props, { children: _jsx(ButtonIcon, { icon: ArrowLeft, size: "lg" }) })) }));
}
var templateObject_1;
