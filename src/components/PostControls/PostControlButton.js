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
import { createContext, useContext, useMemo } from 'react';
import { useHaptics } from '#/lib/haptics';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { Text } from '#/components/Typography';
export var DEFAULT_HITSLOP = { top: 5, bottom: 10, left: 10, right: 10 };
var PostControlContext = createContext({});
PostControlContext.displayName = 'PostControlContext';
// Base button style, which the the other ones extend
export function PostControlButton(_a) {
    var ref = _a.ref, onPress = _a.onPress, onLongPress = _a.onLongPress, children = _a.children, big = _a.big, active = _a.active, activeColor = _a.activeColor, props = __rest(_a, ["ref", "onPress", "onLongPress", "children", "big", "active", "activeColor"]);
    var t = useTheme();
    var playHaptic = useHaptics();
    var ctx = useMemo(function () { return ({
        big: big,
        active: active,
        color: {
            color: activeColor && active ? activeColor : t.palette.contrast_500,
        },
    }); }, [big, active, activeColor, t.palette.contrast_500]);
    var style = useMemo(function () { return [
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.bg_transparent,
        { padding: 5 },
    ]; }, []);
    var handlePress = useMemo(function () {
        if (!onPress)
            return;
        return function (evt) {
            playHaptic('Light');
            onPress(evt);
        };
    }, [onPress, playHaptic]);
    var handleLongPress = useMemo(function () {
        if (!onLongPress)
            return;
        return function (evt) {
            playHaptic('Heavy');
            onLongPress(evt);
        };
    }, [onLongPress, playHaptic]);
    return (_jsx(Button, __assign({ ref: ref, onPress: handlePress, onLongPress: handleLongPress, style: style, hoverStyle: t.atoms.bg_contrast_25, shape: "round", variant: "ghost", color: "secondary" }, props, { hitSlop: __assign(__assign({}, DEFAULT_HITSLOP), (props.hitSlop || {})), children: typeof children === 'function' ? (function (args) { return (_jsx(PostControlContext.Provider, { value: ctx, children: children(args) })); }) : (_jsx(PostControlContext.Provider, { value: ctx, children: children })) })));
}
export function PostControlButtonIcon(_a) {
    var Comp = _a.icon, style = _a.style, rest = __rest(_a, ["icon", "style"]);
    var _b = useContext(PostControlContext), big = _b.big, color = _b.color;
    return (_jsx(Comp, __assign({ style: [color, a.pointer_events_none, style] }, rest, { width: big ? 22 : 18 })));
}
export function PostControlButtonText(_a) {
    var style = _a.style, props = __rest(_a, ["style"]);
    var _b = useContext(PostControlContext), big = _b.big, active = _b.active, color = _b.color;
    return (_jsx(Text, __assign({ style: [
            color,
            big ? a.text_md : a.text_sm,
            active && a.font_semi_bold,
            style,
        ] }, props)));
}
