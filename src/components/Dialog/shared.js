import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
import { IS_LIQUID_GLASS } from '#/env';
export function Header(_a) {
    var renderLeft = _a.renderLeft, renderRight = _a.renderRight, children = _a.children, style = _a.style, onLayout = _a.onLayout;
    var t = useTheme();
    return (_jsxs(View, { onLayout: onLayout, style: [
            a.sticky,
            a.top_0,
            a.relative,
            a.w_full,
            a.py_sm,
            a.flex_row,
            a.justify_center,
            a.align_center,
            { minHeight: IS_LIQUID_GLASS ? 64 : 50 },
            a.border_b,
            t.atoms.border_contrast_medium,
            t.atoms.bg,
            { borderTopLeftRadius: a.rounded_md.borderRadius },
            { borderTopRightRadius: a.rounded_md.borderRadius },
            style,
        ], children: [renderLeft && (_jsx(View, { style: [a.absolute, { left: IS_LIQUID_GLASS ? 12 : 6 }], children: renderLeft() })), children, renderRight && (_jsx(View, { style: [a.absolute, { right: IS_LIQUID_GLASS ? 12 : 6 }], children: renderRight() }))] }));
}
export function HeaderText(_a) {
    var children = _a.children, style = _a.style;
    return (_jsx(Text, { style: [a.text_lg, a.text_center, a.font_semi_bold, style], children: children }));
}
