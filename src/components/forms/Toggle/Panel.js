import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { View } from 'react-native';
import { atoms as a, tokens, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
var PanelContext = createContext({ active: false });
/**
 * A nice container for Toggles. See the Threadgate dialog for an example.
 */
export function Panel(_a) {
    var children = _a.children, _b = _a.active, active = _b === void 0 ? false : _b, adjacent = _a.adjacent;
    var t = useTheme();
    var leading = adjacent === 'leading' || adjacent === 'both';
    var trailing = adjacent === 'trailing' || adjacent === 'both';
    var rounding = {
        borderTopLeftRadius: leading
            ? tokens.borderRadius.xs
            : tokens.borderRadius.md,
        borderTopRightRadius: leading
            ? tokens.borderRadius.xs
            : tokens.borderRadius.md,
        borderBottomLeftRadius: trailing
            ? tokens.borderRadius.xs
            : tokens.borderRadius.md,
        borderBottomRightRadius: trailing
            ? tokens.borderRadius.xs
            : tokens.borderRadius.md,
    };
    return (_jsx(View, { style: [
            a.w_full,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.px_md,
            a.py_md,
            { minHeight: tokens.space._2xl + tokens.space.md * 2 },
            rounding,
            active
                ? { backgroundColor: t.palette.primary_50 }
                : t.atoms.bg_contrast_50,
        ], children: _jsx(PanelContext, { value: { active: active }, children: children }) }));
}
export function PanelText(_a) {
    var children = _a.children, icon = _a.icon;
    var t = useTheme();
    var ctx = useContext(PanelContext);
    var text = (_jsx(Text, { style: [
            a.text_md,
            a.flex_1,
            ctx.active
                ? [a.font_medium, t.atoms.text]
                : [t.atoms.text_contrast_medium],
        ], children: children }));
    if (icon) {
        // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
        return (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs, a.flex_1], children: [_jsx(PanelIcon, { icon: icon }), text] }));
    }
    return text;
}
export function PanelIcon(_a) {
    var Icon = _a.icon;
    var t = useTheme();
    var ctx = useContext(PanelContext);
    return (_jsx(Icon, { style: [
            ctx.active ? t.atoms.text : t.atoms.text_contrast_medium,
            a.flex_shrink_0,
        ], size: "md" }));
}
/**
 * A group of panels. TODO: auto-leading/trailing
 */
export function PanelGroup(_a) {
    var children = _a.children;
    return _jsx(View, { style: [a.w_full, a.gap_2xs], children: children });
}
