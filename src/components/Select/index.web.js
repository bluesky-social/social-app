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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, forwardRef, Fragment, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { Select as RadixSelect } from 'radix-ui';
import { useA11y } from '#/state/a11y';
import { flatten, useTheme, web } from '#/alf';
import { atoms as a } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon, ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon, } from '#/components/icons/Chevron';
import { Text } from '#/components/Typography';
var SelectedValueContext = createContext(null);
SelectedValueContext.displayName = 'SelectSelectedValueContext';
export function Root(props) {
    return (_jsx(SelectedValueContext.Provider, { value: props.value, children: _jsx(RadixSelect.Root, __assign({}, props)) }));
}
var RadixTriggerPassThrough = forwardRef(function (props, ref) {
    // @ts-expect-error Radix provides no types of this stuff
    var _a;
    return (_a = props.children) === null || _a === void 0 ? void 0 : _a.call(props, __assign(__assign({}, props), { ref: ref }));
});
RadixTriggerPassThrough.displayName = 'RadixTriggerPassThrough';
export function Trigger(_a) {
    var children = _a.children, label = _a.label;
    var t = useTheme();
    var _b = useInteractionState(), hovered = _b.state, onMouseEnter = _b.onIn, onMouseLeave = _b.onOut;
    var _c = useInteractionState(), focused = _c.state, onFocus = _c.onIn, onBlur = _c.onOut;
    if (typeof children === 'function') {
        return (_jsx(RadixSelect.Trigger, { asChild: true, children: _jsx(RadixTriggerPassThrough, { children: function (props) {
                    return children({
                        IS_NATIVE: false,
                        state: {
                            hovered: hovered,
                            focused: focused,
                            pressed: false,
                        },
                        props: __assign(__assign({}, props), { onPress: props.onClick, onFocus: onFocus, onBlur: onBlur, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, accessibilityLabel: label }),
                    });
                } }) }));
    }
    else {
        return (_jsx(RadixSelect.Trigger, { onFocus: onFocus, onBlur: onBlur, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, style: flatten([
                a.flex,
                a.relative,
                t.atoms.bg_contrast_50,
                a.align_center,
                a.gap_sm,
                a.justify_between,
                a.py_sm,
                a.px_md,
                a.pointer,
                {
                    borderRadius: 10,
                    maxWidth: 400,
                    outline: 0,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: focused
                        ? t.palette.primary_500
                        : t.palette.contrast_50,
                },
            ]), children: children }));
    }
}
export function ValueText(_a) {
    var children = _a.children, webOverrideValue = _a.webOverrideValue, style = _a.style, props = __rest(_a, ["children", "webOverrideValue", "style"]);
    var content;
    if (webOverrideValue && children) {
        content = children(webOverrideValue);
    }
    return (_jsx(Text, { style: style, children: _jsx(RadixSelect.Value, __assign({}, props, { children: content })) }));
}
export function Icon(_a) {
    var style = _a.style;
    var t = useTheme();
    return (_jsx(RadixSelect.Icon, { children: _jsx(ChevronDownIcon, { style: [t.atoms.text, style], size: "xs" }) }));
}
export function Content(_a) {
    var items = _a.items, renderItem = _a.renderItem, _b = _a.valueExtractor, valueExtractor = _b === void 0 ? defaultItemValueExtractor : _b;
    var t = useTheme();
    var selectedValue = useContext(SelectedValueContext);
    var reduceMotionEnabled = useA11y().reduceMotionEnabled;
    var scrollBtnStyles = [
        a.absolute,
        a.flex,
        a.align_center,
        a.justify_center,
        a.rounded_sm,
        a.z_10,
    ];
    var up = __spreadArray(__spreadArray([], scrollBtnStyles, true), [
        a.pt_sm,
        a.pb_lg,
        {
            top: 0,
            left: 0,
            right: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            background: "linear-gradient(to bottom, ".concat(t.atoms.bg.backgroundColor, " 0%, transparent 100%)"),
        },
    ], false);
    var down = __spreadArray(__spreadArray([], scrollBtnStyles, true), [
        a.pt_lg,
        a.pb_sm,
        {
            bottom: 0,
            left: 0,
            right: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            background: "linear-gradient(to top, ".concat(t.atoms.bg.backgroundColor, " 0%, transparent 100%)"),
        },
    ], false);
    return (_jsx(RadixSelect.Portal, { children: _jsx(RadixSelect.Content, { style: flatten([t.atoms.bg, a.rounded_sm, a.overflow_hidden]), position: "popper", align: "center", sideOffset: 5, className: "radix-select-content", 
            // prevent the keyboard shortcut for opening the composer
            onKeyDown: function (evt) { return evt.stopPropagation(); }, children: _jsxs(View, { style: [
                    a.flex_1,
                    a.border,
                    t.atoms.border_contrast_low,
                    a.rounded_sm,
                    a.overflow_hidden,
                    !reduceMotionEnabled && a.zoom_fade_in,
                ], children: [_jsx(RadixSelect.ScrollUpButton, { style: flatten(up), children: _jsx(ChevronUpIcon, { style: [t.atoms.text], size: "xs" }) }), _jsx(RadixSelect.Viewport, { style: flatten([a.p_xs]), children: items.map(function (item, index) { return (_jsx(Fragment, { children: renderItem(item, index, selectedValue) }, valueExtractor(item))); }) }), _jsx(RadixSelect.ScrollDownButton, { style: flatten(down), children: _jsx(ChevronDownIcon, { style: [t.atoms.text], size: "xs" }) })] }) }) }));
}
function defaultItemValueExtractor(item) {
    return item.value;
}
var ItemContext = createContext({
    hovered: false,
    focused: false,
    pressed: false,
    selected: false,
});
ItemContext.displayName = 'SelectItemContext';
export function useItemContext() {
    return useContext(ItemContext);
}
export function Item(_a) {
    var ref = _a.ref, value = _a.value, style = _a.style, children = _a.children;
    var t = useTheme();
    var _b = useInteractionState(), hovered = _b.state, onMouseEnter = _b.onIn, onMouseLeave = _b.onOut;
    var selected = useContext(SelectedValueContext) === value;
    var _c = useInteractionState(), focused = _c.state, onFocus = _c.onIn, onBlur = _c.onOut;
    var ctx = useMemo(function () { return ({ hovered: hovered, focused: focused, pressed: false, selected: selected }); }, [hovered, focused, selected]);
    return (_jsx(RadixSelect.Item, { ref: ref, value: value, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, onFocus: onFocus, onBlur: onBlur, style: flatten([
            t.atoms.text,
            a.relative,
            a.flex,
            { minHeight: 25, paddingLeft: 30, paddingRight: 8 },
            a.user_select_none,
            a.align_center,
            a.rounded_xs,
            a.py_2xs,
            a.text_sm,
            { outline: 0 },
            (hovered || focused) && { backgroundColor: t.palette.primary_50 },
            selected && [a.font_semi_bold],
            a.transition_color,
            style,
        ]), children: _jsx(ItemContext.Provider, { value: ctx, children: children }) }));
}
export var ItemText = function ItemText(_a) {
    var children = _a.children, style = _a.style;
    return (_jsx(RadixSelect.ItemText, { asChild: true, children: _jsx(Text, { style: flatten([style, web({ pointerEvents: 'inherit' })]), children: children }) }));
};
export function ItemIndicator(_a) {
    var _b = _a.icon, Icon = _b === void 0 ? CheckIcon : _b;
    return (_jsx(RadixSelect.ItemIndicator, { style: flatten([
            a.absolute,
            { left: 0, width: 30 },
            a.flex,
            a.align_center,
            a.justify_center,
        ]), children: _jsx(Icon, { size: "sm" }) }));
}
export function Separator() {
    var t = useTheme();
    return (_jsx(RadixSelect.Separator, { style: flatten([
            {
                height: 1,
                backgroundColor: t.atoms.border_contrast_low.borderColor,
            },
            a.my_xs,
            a.w_full,
        ]) }));
}
