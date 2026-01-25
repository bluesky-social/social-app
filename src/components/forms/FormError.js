import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { Warning_Stroke2_Corner0_Rounded as Warning } from '#/components/icons/Warning';
import { Text } from '#/components/Typography';
export function FormError(_a) {
    var error = _a.error;
    var t = useTheme();
    if (!error)
        return null;
    return (_jsxs(View, { style: [
            { backgroundColor: t.palette.negative_400 },
            a.flex_row,
            a.rounded_sm,
            a.p_md,
            a.gap_sm,
        ], children: [_jsx(Warning, { fill: t.palette.white, size: "md" }), _jsx(View, { style: [a.flex_1], children: _jsx(Text, { style: [{ color: t.palette.white }, a.font_semi_bold, a.leading_snug], children: error }) })] }));
}
