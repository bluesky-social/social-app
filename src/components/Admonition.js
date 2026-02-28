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
import { createContext, useContext } from 'react';
import { View } from 'react-native';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button as BaseButton } from '#/components/Button';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '#/components/icons/CircleX';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text as BaseText } from '#/components/Typography';
import { EmojiSad_Stroke2_Corner0_Rounded as EmojiSadIcon } from './icons/Emoji';
var Context = createContext({
    type: 'info',
});
Context.displayName = 'AdmonitionContext';
export function Icon() {
    var t = useTheme();
    var type = useContext(Context).type;
    var Icon = {
        info: CircleInfoIcon,
        tip: CircleInfoIcon,
        warning: WarningIcon,
        error: CircleXIcon,
        apology: EmojiSadIcon,
    }[type];
    var fill = {
        info: t.atoms.text_contrast_medium.color,
        tip: t.palette.primary_500,
        warning: t.palette.yellow,
        error: t.palette.negative_500,
        apology: t.atoms.text_contrast_medium.color,
    }[type];
    return _jsx(Icon, { fill: fill, size: "md" });
}
export function Content(_a) {
    var children = _a.children, style = _a.style, rest = __rest(_a, ["children", "style"]);
    return (_jsx(View, __assign({ style: [a.gap_sm, a.flex_1, { minHeight: 20 }, a.justify_center, style] }, rest, { children: children })));
}
export function Text(_a) {
    var children = _a.children, style = _a.style, rest = __rest(_a, ["children", "style"]);
    return (_jsx(BaseText, __assign({}, rest, { style: [a.text_sm, a.leading_snug, a.pr_md, style], children: children })));
}
export function Button(_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    return (_jsx(BaseButton, __assign({ size: "tiny" }, props, { children: children })));
}
export function Row(_a) {
    var children = _a.children, style = _a.style;
    return (_jsx(View, { style: [a.w_full, a.flex_row, a.align_start, a.gap_sm, style], children: children }));
}
export function Outer(_a) {
    var children = _a.children, _b = _a.type, type = _b === void 0 ? 'info' : _b, style = _a.style;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var borderColor = {
        info: t.atoms.border_contrast_high.borderColor,
        tip: t.palette.primary_500,
        warning: t.palette.yellow,
        error: t.palette.negative_500,
        apology: t.atoms.border_contrast_high.borderColor,
    }[type];
    return (_jsx(Context.Provider, { value: { type: type }, children: _jsx(View, { style: [
                gtMobile ? a.p_md : a.p_sm,
                a.p_md,
                a.rounded_sm,
                a.border,
                t.atoms.bg,
                { borderColor: borderColor },
                style,
            ], children: children }) }));
}
export function Admonition(_a) {
    var children = _a.children, type = _a.type, style = _a.style;
    return (_jsx(Outer, { type: type, style: style, children: _jsxs(Row, { children: [_jsx(Icon, {}), _jsx(Content, { children: _jsx(Text, { children: children }) })] }) }));
}
