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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon } from '#/components/icons/Chevron';
import { Text } from '#/components/Typography';
import { BaseRadio } from '../forms/Toggle';
var Context = createContext(null);
Context.displayName = 'SelectContext';
var ValueTextContext = createContext([undefined, function () { }]);
ValueTextContext.displayName = 'ValueTextContext';
function useSelectContext() {
    var ctx = useContext(Context);
    if (!ctx) {
        throw new Error('Select components must must be used within a Select.Root');
    }
    return ctx;
}
export function Root(_a) {
    var children = _a.children, value = _a.value, onValueChange = _a.onValueChange, disabled = _a.disabled;
    var control = Dialog.useDialogControl();
    var valueTextCtx = useState();
    var ctx = useMemo(function () { return ({
        control: control,
        value: value,
        onValueChange: onValueChange,
        disabled: disabled,
    }); }, [control, value, onValueChange, disabled]);
    return (_jsx(Context.Provider, { value: ctx, children: _jsx(ValueTextContext.Provider, { value: valueTextCtx, children: children }) }));
}
export function Trigger(_a) {
    var children = _a.children, hitSlop = _a.hitSlop, label = _a.label;
    var control = useSelectContext().control;
    var _b = useInteractionState(), focused = _b.state, onFocus = _b.onIn, onBlur = _b.onOut;
    var _c = useInteractionState(), pressed = _c.state, onPressIn = _c.onIn, onPressOut = _c.onOut;
    if (typeof children === 'function') {
        return children({
            IS_NATIVE: true,
            control: control,
            state: {
                hovered: false,
                focused: focused,
                pressed: pressed,
            },
            props: {
                onPress: control.open,
                onFocus: onFocus,
                onBlur: onBlur,
                onPressIn: onPressIn,
                onPressOut: onPressOut,
                accessibilityLabel: label,
            },
        });
    }
    else {
        return (_jsx(Button, { hitSlop: hitSlop, label: label, onPress: control.open, style: [a.flex_1, a.justify_between, a.pl_lg, a.pr_md], color: "secondary", size: "large", shape: "rectangular", children: _jsx(_Fragment, { children: children }) }));
    }
}
export function ValueText(_a) {
    var placeholder = _a.placeholder, _b = _a.children, children = _b === void 0 ? function (value) { return value.label; } : _b, style = _a.style;
    var value = useContext(ValueTextContext)[0];
    var t = useTheme();
    var text = value && children(value);
    if (!text)
        text = placeholder;
    return (_jsx(ButtonText, { style: [t.atoms.text, a.font_normal, style], emoji: true, children: text }));
}
export function Icon(_a) {
    return _jsx(ButtonIcon, { icon: ChevronUpDownIcon });
}
export function Content(_a) {
    var items = _a.items, _b = _a.valueExtractor, valueExtractor = _b === void 0 ? defaultItemValueExtractor : _b, props = __rest(_a, ["items", "valueExtractor"]);
    var _c = useSelectContext(), control = _c.control, context = __rest(_c, ["control"]);
    var _d = useContext(ValueTextContext), setValue = _d[1];
    useLayoutEffect(function () {
        var item = items.find(function (item) { return valueExtractor(item) === context.value; });
        if (item) {
            setValue(item);
        }
    }, [items, context.value, valueExtractor, setValue]);
    return (_jsx(Dialog.Outer, { control: control, children: _jsx(ContentInner, __assign({ control: control, items: items, valueExtractor: valueExtractor }, props, context)) }));
}
function ContentInner(_a) {
    var label = _a.label, items = _a.items, renderItem = _a.renderItem, valueExtractor = _a.valueExtractor, context = __rest(_a, ["label", "items", "renderItem", "valueExtractor"]);
    var _ = useLingui()._;
    var _b = useState(61), headerHeight = _b[0], setHeaderHeight = _b[1];
    var render = useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        return renderItem(item, index, context.value);
    }, [renderItem, context.value]);
    return (_jsxs(Context.Provider, { value: context, children: [_jsx(Dialog.Header, { onLayout: function (evt) { return setHeaderHeight(evt.nativeEvent.layout.height); }, style: [
                    a.absolute,
                    a.top_0,
                    a.left_0,
                    a.right_0,
                    a.z_10,
                    a.pt_3xl,
                    a.pb_sm,
                    a.border_b_0,
                ], children: _jsx(Dialog.HeaderText, { style: [a.flex_1, a.px_xl, a.text_left, a.font_bold, a.text_2xl], children: label !== null && label !== void 0 ? label : _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select an option"], ["Select an option"])))) }) }), _jsx(Dialog.Handle, {}), _jsx(Dialog.InnerFlatList, { headerOffset: headerHeight, data: items, renderItem: render, keyExtractor: valueExtractor })] }));
}
function defaultItemValueExtractor(item) {
    return item.value;
}
var ItemContext = createContext({
    selected: false,
    hovered: false,
    focused: false,
    pressed: false,
});
ItemContext.displayName = 'SelectItemContext';
export function useItemContext() {
    return useContext(ItemContext);
}
export function Item(_a) {
    var children = _a.children, value = _a.value, label = _a.label, style = _a.style;
    var t = useTheme();
    var control = Dialog.useDialogContext();
    var _b = useSelectContext(), selected = _b.value, onValueChange = _b.onValueChange;
    return (_jsx(Button, { role: "listitem", label: label, style: [a.flex_1], onPress: function () {
            control.close(function () {
                onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(value);
            });
        }, children: function (_a) {
            var hovered = _a.hovered, focused = _a.focused, pressed = _a.pressed;
            return (_jsx(ItemContext.Provider, { value: { selected: value === selected, hovered: hovered, focused: focused, pressed: pressed }, children: _jsx(View, { style: [
                        a.flex_1,
                        a.px_xl,
                        (focused || pressed) && t.atoms.bg_contrast_25,
                        a.flex_row,
                        a.align_center,
                        a.gap_sm,
                        a.py_md,
                        style,
                    ], children: children }) }));
        } }));
}
export function ItemText(_a) {
    var children = _a.children, style = _a.style, emoji = _a.emoji;
    var selected = useItemContext().selected;
    return (_jsx(Text, { style: [a.text_md, selected && a.font_semi_bold, style], emoji: emoji, children: children }));
}
export function ItemIndicator(_a) {
    var Icon = _a.icon;
    var _b = useItemContext(), selected = _b.selected, focused = _b.focused, hovered = _b.hovered;
    if (Icon) {
        return _jsx(View, { style: { width: 24 }, children: selected && _jsx(Icon, { size: "md" }) });
    }
    return (_jsx(BaseRadio, { selected: selected, focused: focused, hovered: hovered, isInvalid: false, disabled: false }));
}
export function Separator() {
    var t = useTheme();
    return (_jsx(View, { style: [
            a.flex_1,
            a.border_b,
            t.atoms.border_contrast_low,
            a.mx_xl,
            a.my_xs,
        ] }));
}
var templateObject_1;
