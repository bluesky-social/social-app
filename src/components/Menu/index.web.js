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
import { forwardRef, useCallback, useId, useMemo, useState } from 'react';
import { Pressable, View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { DropdownMenu } from 'radix-ui';
import { useA11y } from '#/state/a11y';
import { atoms as a, flatten, useTheme, web } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Context, ItemContext, useMenuContext, useMenuItemContext, } from '#/components/Menu/context';
import { Portal } from '#/components/Portal';
import { Text } from '#/components/Typography';
export { useMenuContext };
export function useMenuControl() {
    var id = useId();
    var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
    return useMemo(function () { return ({
        id: id,
        ref: { current: null },
        isOpen: isOpen,
        open: function () {
            setIsOpen(true);
        },
        close: function () {
            setIsOpen(false);
        },
    }); }, [id, isOpen, setIsOpen]);
}
export function Root(_a) {
    var children = _a.children, control = _a.control;
    var _ = useLingui()._;
    var defaultControl = useMenuControl();
    var context = useMemo(function () { return ({
        control: control || defaultControl,
    }); }, [control, defaultControl]);
    var onOpenChange = useCallback(function (open) {
        if (context.control.isOpen && !open) {
            context.control.close();
        }
        else if (!context.control.isOpen && open) {
            context.control.open();
        }
    }, [context.control]);
    return (_jsxs(Context.Provider, { value: context, children: [context.control.isOpen && (_jsx(Portal, { children: _jsx(Pressable, { style: [a.fixed, a.inset_0, a.z_50], onPress: function () { return context.control.close(); }, accessibilityHint: "", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Context menu backdrop, click to close the menu."], ["Context menu backdrop, click to close the menu."])))) }) })), _jsx(DropdownMenu.Root, { open: context.control.isOpen, onOpenChange: onOpenChange, children: children })] }));
}
var RadixTriggerPassThrough = forwardRef(function (props, ref) {
    // @ts-expect-error Radix provides no types of this stuff
    return props.children(__assign(__assign({}, props), { ref: ref }));
});
RadixTriggerPassThrough.displayName = 'RadixTriggerPassThrough';
export function Trigger(_a) {
    var children = _a.children, label = _a.label, _b = _a.role, role = _b === void 0 ? 'button' : _b, hint = _a.hint;
    var control = useMenuContext().control;
    var _c = useInteractionState(), hovered = _c.state, onMouseEnter = _c.onIn, onMouseLeave = _c.onOut;
    var _d = useInteractionState(), focused = _d.state, onFocus = _d.onIn, onBlur = _d.onOut;
    return (_jsx(DropdownMenu.Trigger, { asChild: true, children: _jsx(RadixTriggerPassThrough, { children: function (props) {
                return children({
                    IS_NATIVE: false,
                    control: control,
                    state: {
                        hovered: hovered,
                        focused: focused,
                        pressed: false,
                    },
                    props: __assign(__assign({}, props), { 
                        // No-op override to prevent false positive that interprets mobile scroll as a tap.
                        // This requires the custom onPress handler below to compensate.
                        // https://github.com/radix-ui/primitives/issues/1912
                        onPointerDown: undefined, onPress: function () {
                            if (window.event instanceof KeyboardEvent) {
                                // The onPointerDown hack above is not relevant to this press, so don't do anything.
                                return;
                            }
                            // Compensate for the disabled onPointerDown above by triggering it manually.
                            if (control.isOpen) {
                                control.close();
                            }
                            else {
                                control.open();
                            }
                        }, onFocus: onFocus, onBlur: onBlur, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, accessibilityHint: hint, accessibilityLabel: label, accessibilityRole: role }),
                });
            } }) }));
}
export function Outer(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    var reduceMotionEnabled = useA11y().reduceMotionEnabled;
    return (_jsx(DropdownMenu.Portal, { children: _jsx(DropdownMenu.Content, { sideOffset: 5, collisionPadding: { left: 5, right: 5, bottom: 5 }, loop: true, "aria-label": "Test", className: "dropdown-menu-transform-origin dropdown-menu-constrain-size", children: _jsx(View, { style: [
                    a.rounded_sm,
                    a.p_xs,
                    a.border,
                    t.name === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25,
                    t.atoms.shadow_md,
                    t.atoms.border_contrast_low,
                    a.overflow_auto,
                    !reduceMotionEnabled && a.zoom_fade_in,
                    style,
                ], children: children }) }) }));
}
export function Item(_a) {
    var children = _a.children, label = _a.label, onPress = _a.onPress, style = _a.style, rest = __rest(_a, ["children", "label", "onPress", "style"]);
    var t = useTheme();
    var control = useMenuContext().control;
    var _b = useInteractionState(), hovered = _b.state, onMouseEnter = _b.onIn, onMouseLeave = _b.onOut;
    var _c = useInteractionState(), focused = _c.state, onFocus = _c.onIn, onBlur = _c.onOut;
    return (_jsx(DropdownMenu.Item, { asChild: true, children: _jsx(Pressable, __assign({}, rest, { className: "radix-dropdown-item", accessibilityHint: "", accessibilityLabel: label, onPress: function (e) {
                onPress(e);
                /**
                 * Ported forward from Radix
                 * @see https://www.radix-ui.com/primitives/docs/components/dropdown-menu#item
                 */
                if (!e.defaultPrevented) {
                    control.close();
                }
            }, onFocus: onFocus, onBlur: onBlur, 
            // need `flatten` here for Radix compat
            style: flatten([
                a.flex_row,
                a.align_center,
                a.gap_lg,
                a.py_sm,
                a.rounded_xs,
                a.overflow_hidden,
                { minHeight: 32, paddingHorizontal: 10 },
                web({ outline: 0 }),
                (hovered || focused) &&
                    !rest.disabled && [
                    web({ outline: '0 !important' }),
                    t.name === 'light'
                        ? t.atoms.bg_contrast_25
                        : t.atoms.bg_contrast_50,
                ],
                style,
            ]) }, web({
            onMouseEnter: onMouseEnter,
            onMouseLeave: onMouseLeave,
        }), { children: _jsx(ItemContext.Provider, { value: { disabled: Boolean(rest.disabled) }, children: children }) })) }));
}
export function ItemText(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    var disabled = useMenuItemContext().disabled;
    return (_jsx(Text, { style: [
            a.flex_1,
            a.font_semi_bold,
            t.atoms.text_contrast_high,
            style,
            disabled && t.atoms.text_contrast_low,
        ], children: children }));
}
export function ItemIcon(_a) {
    var Comp = _a.icon, _b = _a.position, position = _b === void 0 ? 'left' : _b, fill = _a.fill;
    var t = useTheme();
    var disabled = useMenuItemContext().disabled;
    return (_jsx(View, { style: [
            position === 'left' && {
                marginLeft: -2,
            },
            position === 'right' && {
                marginRight: -2,
                marginLeft: 12,
            },
        ], children: _jsx(Comp, { size: "md", fill: fill
                ? fill({ disabled: disabled })
                : disabled
                    ? t.atoms.text_contrast_low.color
                    : t.atoms.text_contrast_medium.color }) }));
}
export function ItemRadio(_a) {
    var selected = _a.selected;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.justify_center,
            a.align_center,
            a.rounded_full,
            t.atoms.border_contrast_high,
            {
                borderWidth: 1,
                height: 20,
                width: 20,
            },
        ], children: selected ? (_jsx(View, { style: [
                a.absolute,
                a.rounded_full,
                { height: 14, width: 14 },
                selected
                    ? {
                        backgroundColor: t.palette.primary_500,
                    }
                    : {},
            ] })) : null }));
}
export function LabelText(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    return (_jsx(Text, { style: [
            a.font_semi_bold,
            a.p_sm,
            t.atoms.text_contrast_low,
            a.leading_snug,
            { paddingHorizontal: 10 },
            style,
        ], children: children }));
}
export function Group(_a) {
    var children = _a.children;
    return children;
}
export function Divider() {
    var t = useTheme();
    return (_jsx(DropdownMenu.Separator, { style: flatten([
            a.my_xs,
            t.atoms.bg_contrast_100,
            a.flex_shrink_0,
            { height: 1 },
        ]) }));
}
export function ContainerItem() {
    return null;
}
var templateObject_1;
