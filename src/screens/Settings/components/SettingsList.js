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
import { createContext, useContext, useMemo } from 'react';
import { View, } from 'react-native';
import { HITSLOP_10 } from '#/lib/constants';
import { atoms as a, useTheme } from '#/alf';
import * as Button from '#/components/Button';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { Link } from '#/components/Link';
import { createPortalGroup } from '#/components/Portal';
import { Text } from '#/components/Typography';
var ItemContext = createContext({
    destructive: false,
    withinGroup: false,
});
ItemContext.displayName = 'SettingsListItemContext';
var Portal = createPortalGroup();
export function Container(_a) {
    var children = _a.children;
    return _jsx(View, { style: [a.flex_1, a.py_md], children: children });
}
/**
 * This uses `Portal` magic ✨ to render the icons and title correctly. ItemIcon and ItemText components
 * get teleported to the top row, leaving the rest of the children in the bottom row.
 */
export function Group(_a) {
    var children = _a.children, _b = _a.destructive, destructive = _b === void 0 ? false : _b, _c = _a.iconInset, iconInset = _c === void 0 ? true : _c, style = _a.style, contentContainerStyle = _a.contentContainerStyle;
    var context = useMemo(function () { return ({ destructive: destructive, withinGroup: true }); }, [destructive]);
    return (_jsx(View, { style: [a.w_full, style], children: _jsx(Portal.Provider, { children: _jsxs(ItemContext.Provider, { value: context, children: [_jsx(Item, { style: [a.pb_2xs, { minHeight: 42 }], children: _jsx(Portal.Outlet, {}) }), _jsx(Item, { style: [
                            a.flex_col,
                            a.pt_2xs,
                            a.align_start,
                            a.gap_0,
                            contentContainerStyle,
                        ], iconInset: iconInset, children: children })] }) }) }));
}
export function Item(_a) {
    var children = _a.children, destructive = _a.destructive, _b = _a.iconInset, iconInset = _b === void 0 ? false : _b, style = _a.style;
    var context = useContext(ItemContext);
    var childContext = useMemo(function () {
        if (typeof destructive !== 'boolean')
            return context;
        return __assign(__assign({}, context), { destructive: destructive });
    }, [context, destructive]);
    return (_jsx(View, { style: [
            a.px_xl,
            a.py_sm,
            a.align_center,
            a.gap_sm,
            a.w_full,
            a.flex_row,
            { minHeight: 48 },
            iconInset && {
                paddingLeft: 
                // existing padding
                a.pl_xl.paddingLeft +
                    // icon
                    24 +
                    // gap
                    a.gap_sm.gap,
            },
            style,
        ], children: _jsx(ItemContext.Provider, { value: childContext, children: children }) }));
}
export function LinkItem(_a) {
    var children = _a.children, _b = _a.destructive, destructive = _b === void 0 ? false : _b, contentContainerStyle = _a.contentContainerStyle, chevronColor = _a.chevronColor, props = __rest(_a, ["children", "destructive", "contentContainerStyle", "chevronColor"]);
    var t = useTheme();
    return (_jsx(Link, __assign({}, props, { children: function (args) { return (_jsxs(Item, { destructive: destructive, style: [
                (args.hovered || args.pressed) && [t.atoms.bg_contrast_25],
                contentContainerStyle,
            ], children: [typeof children === 'function' ? children(args) : children, _jsx(Chevron, { color: chevronColor })] })); } })));
}
export function PressableItem(_a) {
    var children = _a.children, _b = _a.destructive, destructive = _b === void 0 ? false : _b, contentContainerStyle = _a.contentContainerStyle, hoverStyle = _a.hoverStyle, props = __rest(_a, ["children", "destructive", "contentContainerStyle", "hoverStyle"]);
    var t = useTheme();
    return (_jsx(Button.Button, __assign({}, props, { children: function (args) { return (_jsx(Item, { destructive: destructive, style: [
                (args.hovered || args.pressed) && [
                    t.atoms.bg_contrast_25,
                    hoverStyle,
                ],
                contentContainerStyle,
            ], children: typeof children === 'function' ? children(args) : children })); } })));
}
export function ItemIcon(_a) {
    var Comp = _a.icon, _b = _a.size, size = _b === void 0 ? 'lg' : _b, colorProp = _a.color;
    var t = useTheme();
    var _c = useContext(ItemContext), destructive = _c.destructive, withinGroup = _c.withinGroup;
    /*
     * Copied here from icons/common.tsx so we can tweak if we need to, but
     * also so that we can calculate transforms.
     */
    var iconSize = {
        '2xs': 8,
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 28,
        '2xl': 32,
        '3xl': 40,
    }[size];
    var color = colorProp !== null && colorProp !== void 0 ? colorProp : (destructive ? t.palette.negative_500 : t.atoms.text.color);
    var content = (_jsx(View, { style: [a.z_20, { width: iconSize, height: iconSize }], children: _jsx(Comp, { width: iconSize, style: [{ color: color }] }) }));
    if (withinGroup) {
        return _jsx(Portal.Portal, { children: content });
    }
    else {
        return content;
    }
}
export function ItemText(_a) {
    var style = _a.style, props = __rest(_a, ["style"]);
    var t = useTheme();
    var _b = useContext(ItemContext), destructive = _b.destructive, withinGroup = _b.withinGroup;
    var content = (_jsx(Button.ButtonText, __assign({ style: [
            a.text_md,
            a.font_normal,
            a.text_left,
            a.flex_1,
            destructive ? { color: t.palette.negative_500 } : t.atoms.text,
            style,
        ] }, props)));
    if (withinGroup) {
        return _jsx(Portal.Portal, { children: content });
    }
    else {
        return content;
    }
}
export function Divider(_a) {
    var style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.border_t,
            t.atoms.border_contrast_low,
            a.w_full,
            a.my_sm,
            style,
        ] }));
}
export function Chevron(_a) {
    var colorProp = _a.color;
    var destructive = useContext(ItemContext).destructive;
    var t = useTheme();
    var color = colorProp !== null && colorProp !== void 0 ? colorProp : (destructive ? t.palette.negative_500 : t.palette.contrast_500);
    return _jsx(ItemIcon, { icon: ChevronRightIcon, size: "md", color: color });
}
export function BadgeText(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    return (_jsx(Text, { style: [
            t.atoms.text_contrast_low,
            a.text_md,
            a.text_right,
            a.leading_snug,
            style,
        ], numberOfLines: 1, children: children }));
}
export function BadgeButton(_a) {
    var label = _a.label, onPress = _a.onPress;
    var t = useTheme();
    return (_jsx(Button.Button, { label: label, onPress: onPress, hitSlop: HITSLOP_10, children: function (_a) {
            var pressed = _a.pressed;
            return (_jsx(Button.ButtonText, { style: [
                    a.text_md,
                    a.font_normal,
                    a.text_right,
                    { color: pressed ? t.palette.contrast_300 : t.palette.primary_500 },
                ], children: label }));
        } }));
}
