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
import { View } from 'react-native';
import { atoms as a, flatten, useAlf, useTheme, } from '#/alf';
import { normalizeTextStyles } from '#/alf/typography';
export function Text(_a) {
    var blend = _a.blend, style = _a.style;
    var _b = useAlf(), fonts = _b.fonts, flags = _b.flags, t = _b.theme;
    var _c = flatten(style), width = _c.width, flattened = __rest(_c, ["width"]);
    var _d = normalizeTextStyles([a.text_sm, a.leading_snug, flattened], {
        fontScale: fonts.scaleMultiplier,
        fontFamily: fonts.family,
        flags: flags,
    }), _e = _d.lineHeight, lineHeight = _e === void 0 ? 14 : _e, rest = __rest(_d, ["lineHeight"]);
    return (_jsx(View, { style: [a.flex_1, { maxWidth: width, paddingVertical: lineHeight * 0.15 }], children: _jsx(View, { style: [
                a.rounded_md,
                t.atoms.bg_contrast_50,
                {
                    height: lineHeight * 0.7,
                    opacity: blend ? 0.6 : 1,
                },
                rest,
            ] }) }));
}
export function Circle(_a) {
    var children = _a.children, size = _a.size, blend = _a.blend, style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.justify_center,
            a.align_center,
            a.rounded_full,
            t.atoms.bg_contrast_50,
            {
                width: size,
                height: size,
                opacity: blend ? 0.6 : 1,
            },
            style,
        ], children: children }));
}
export function Pill(_a) {
    var size = _a.size, blend = _a.blend, style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.rounded_full,
            t.atoms.bg_contrast_50,
            {
                width: size * 1.618,
                height: size,
                opacity: blend ? 0.6 : 1,
            },
            style,
        ] }));
}
export function Col(_a) {
    var children = _a.children, style = _a.style;
    return _jsx(View, { style: [a.flex_1, style], children: children });
}
export function Row(_a) {
    var children = _a.children, style = _a.style;
    return _jsx(View, { style: [a.flex_row, style], children: children });
}
