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
import { createContext, useCallback, useContext } from 'react';
import { Keyboard, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { HITSLOP_30 } from '#/lib/constants';
import { useSetDrawerOpen } from '#/state/shell';
import { atoms as a, platform, useBreakpoints, useGutters, useLayoutBreakpoints, useTheme, web, } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft } from '#/components/icons/Arrow';
import { Menu_Stroke2_Corner0_Rounded as Menu } from '#/components/icons/Menu';
import { BUTTON_VISUAL_ALIGNMENT_OFFSET, CENTER_COLUMN_OFFSET, HEADER_SLOT_SIZE, SCROLLBAR_OFFSET, } from '#/components/Layout/const';
import { ScrollbarOffsetContext } from '#/components/Layout/context';
import { Text } from '#/components/Typography';
import { IS_IOS } from '#/env';
export function Outer(_a) {
    var _b;
    var children = _a.children, noBottomBorder = _a.noBottomBorder, headerRef = _a.headerRef, _c = _a.sticky, sticky = _c === void 0 ? true : _c;
    var t = useTheme();
    var gutters = useGutters([0, 'base']);
    var gtMobile = useBreakpoints().gtMobile;
    var isWithinOffsetView = useContext(ScrollbarOffsetContext).isWithinOffsetView;
    var centerColumnOffset = useLayoutBreakpoints().centerColumnOffset;
    return (_jsx(View, { ref: headerRef, style: [
            a.w_full,
            !noBottomBorder && a.border_b,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            sticky && web([a.sticky, { top: 0 }, a.z_10, t.atoms.bg]),
            gutters,
            platform({
                native: [a.pb_xs, { minHeight: 48 }],
                web: [a.py_xs, { minHeight: 52 }],
            }),
            t.atoms.border_contrast_low,
            gtMobile && [a.mx_auto, { maxWidth: 600 }],
            !isWithinOffsetView && {
                transform: [
                    { translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0 },
                    { translateX: (_b = web(SCROLLBAR_OFFSET)) !== null && _b !== void 0 ? _b : 0 },
                ],
            },
        ], children: children }));
}
var AlignmentContext = createContext('platform');
AlignmentContext.displayName = 'AlignmentContext';
export function Content(_a) {
    var children = _a.children, _b = _a.align, align = _b === void 0 ? 'platform' : _b;
    return (_jsx(View, { style: [
            a.flex_1,
            a.justify_center,
            IS_IOS && align === 'platform' && a.align_center,
            { minHeight: HEADER_SLOT_SIZE },
        ], children: _jsx(AlignmentContext.Provider, { value: align, children: children }) }));
}
export function Slot(_a) {
    var children = _a.children;
    return _jsx(View, { style: [a.z_50, { width: HEADER_SLOT_SIZE }], children: children });
}
export function BackButton(_a) {
    var onPress = _a.onPress, style = _a.style, props = __rest(_a, ["onPress", "style"]);
    var _ = useLingui()._;
    var navigation = useNavigation();
    var onPressBack = useCallback(function (evt) {
        onPress === null || onPress === void 0 ? void 0 : onPress(evt);
        if (evt.defaultPrevented)
            return;
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.navigate('Home');
        }
    }, [onPress, navigation]);
    return (_jsx(Slot, { children: _jsx(Button, __assign({ label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go back"], ["Go back"])))), size: "small", variant: "ghost", color: "secondary", shape: "round", onPress: onPressBack, hitSlop: HITSLOP_30, style: [
                { marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET },
                a.bg_transparent,
                style,
            ] }, props, { children: _jsx(ButtonIcon, { icon: ArrowLeft, size: "lg" }) })) }));
}
export function MenuButton() {
    var _ = useLingui()._;
    var setDrawerOpen = useSetDrawerOpen();
    var gtMobile = useBreakpoints().gtMobile;
    var onPress = useCallback(function () {
        Keyboard.dismiss();
        setDrawerOpen(true);
    }, [setDrawerOpen]);
    return gtMobile ? null : (_jsx(Slot, { children: _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Open drawer menu"], ["Open drawer menu"])))), size: "small", variant: "ghost", color: "secondary", shape: "square", onPress: onPress, hitSlop: HITSLOP_30, style: [
                { marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET },
                a.bg_transparent,
            ], children: _jsx(ButtonIcon, { icon: Menu, size: "lg" }) }) }));
}
export function TitleText(_a) {
    var children = _a.children, style = _a.style;
    var gtMobile = useBreakpoints().gtMobile;
    var align = useContext(AlignmentContext);
    return (_jsx(Text, { style: [
            a.text_lg,
            a.font_semi_bold,
            a.leading_tight,
            IS_IOS && align === 'platform' && a.text_center,
            gtMobile && a.text_xl,
            style,
        ], numberOfLines: 2, emoji: true, children: children }));
}
export function SubtitleText(_a) {
    var children = _a.children;
    var t = useTheme();
    var align = useContext(AlignmentContext);
    return (_jsx(Text, { style: [
            a.text_sm,
            a.leading_snug,
            IS_IOS && align === 'platform' && a.text_center,
            t.atoms.text_contrast_medium,
        ], numberOfLines: 2, children: children }));
}
var templateObject_1, templateObject_2;
