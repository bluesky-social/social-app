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
import { useMemo } from 'react';
import { View, } from 'react-native';
import { atoms as a, native, useTheme } from '#/alf';
import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Typography';
/**
 * @deprecated - use SegmentedControl
 */
export function Group(_a) {
    var children = _a.children, multiple = _a.multiple, props = __rest(_a, ["children", "multiple"]);
    var t = useTheme();
    return (_jsx(Toggle.Group, __assign({ type: multiple ? 'checkbox' : 'radio' }, props, { children: _jsx(View, { style: [
                a.w_full,
                a.flex_row,
                a.rounded_sm,
                a.overflow_hidden,
                t.atoms.border_contrast_low,
                { borderWidth: 1 },
            ], children: children }) })));
}
/**
 * @deprecated - use SegmentedControl
 */
export function Button(_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    return (_jsx(Toggle.Item, __assign({}, props, { style: [a.flex_grow, a.flex_1], children: _jsx(ButtonInner, { children: children }) })));
}
function ButtonInner(_a) {
    var children = _a.children;
    var t = useTheme();
    var state = Toggle.useItemContext();
    var _b = useMemo(function () {
        var base = [];
        var hover = [];
        var active = [];
        hover.push(t.name === 'light' ? t.atoms.bg_contrast_100 : t.atoms.bg_contrast_25);
        if (state.selected) {
            active.push({
                backgroundColor: t.palette.contrast_800,
            });
            hover.push({
                backgroundColor: t.palette.contrast_800,
            });
            if (state.disabled) {
                active.push({
                    backgroundColor: t.palette.contrast_500,
                });
            }
        }
        if (state.disabled) {
            base.push({
                backgroundColor: t.palette.contrast_100,
            });
        }
        return {
            baseStyles: base,
            hoverStyles: hover,
            activeStyles: active,
        };
    }, [t, state]), baseStyles = _b.baseStyles, hoverStyles = _b.hoverStyles, activeStyles = _b.activeStyles;
    return (_jsx(View, { style: [
            {
                borderLeftWidth: 1,
                marginLeft: -1,
            },
            a.flex_grow,
            a.py_md,
            native({
                paddingBottom: 10,
            }),
            a.px_md,
            t.atoms.bg,
            t.atoms.border_contrast_low,
            baseStyles,
            activeStyles,
            (state.hovered || state.pressed) && hoverStyles,
        ], children: children }));
}
/**
 * @deprecated - use SegmentedControl
 */
export function ButtonText(_a) {
    var children = _a.children;
    var t = useTheme();
    var state = Toggle.useItemContext();
    var textStyles = useMemo(function () {
        var text = [];
        if (state.selected) {
            text.push(t.atoms.text_inverted);
        }
        if (state.disabled) {
            text.push({
                opacity: 0.5,
            });
        }
        return text;
    }, [t, state]);
    return (_jsx(Text, { style: [
            a.text_center,
            a.font_semi_bold,
            t.atoms.text_contrast_medium,
            textStyles,
        ], children: children }));
}
