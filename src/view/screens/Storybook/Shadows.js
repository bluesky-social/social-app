import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { H1, Text } from '#/components/Typography';
export function Shadows() {
    var t = useTheme();
    return (_jsxs(View, { style: [a.gap_md], children: [_jsx(H1, { children: "Shadows" }), _jsxs(View, { style: [a.flex_row, a.gap_5xl], children: [_jsx(View, { style: [
                            a.flex_1,
                            a.justify_center,
                            a.px_lg,
                            a.py_2xl,
                            t.atoms.bg,
                            t.atoms.shadow_sm,
                        ], children: _jsx(Text, { children: "shadow_sm" }) }), _jsx(View, { style: [
                            a.flex_1,
                            a.justify_center,
                            a.px_lg,
                            a.py_2xl,
                            t.atoms.bg,
                            t.atoms.shadow_md,
                        ], children: _jsx(Text, { children: "shadow_md" }) }), _jsx(View, { style: [
                            a.flex_1,
                            a.justify_center,
                            a.px_lg,
                            a.py_2xl,
                            t.atoms.bg,
                            t.atoms.shadow_lg,
                        ], children: _jsx(Text, { children: "shadow_lg" }) })] })] }));
}
