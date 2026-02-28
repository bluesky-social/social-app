import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { Trans } from '@lingui/react/macro';
import { Logo } from '#/view/icons/Logo';
import { atoms as a, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
export function Badge() {
    var t = useTheme();
    return (_jsx(View, { style: [a.align_start], children: _jsxs(View, { style: [
                a.pl_md,
                a.pr_lg,
                a.py_sm,
                a.rounded_full,
                a.flex_row,
                a.align_center,
                a.gap_xs,
                {
                    backgroundColor: t.palette.primary_25,
                },
            ], children: [_jsx(Logo, { fill: t.palette.primary_600, width: 14 }), _jsx(Text, { style: [
                        a.font_semi_bold,
                        {
                            color: t.palette.primary_600,
                        },
                    ], children: _jsx(Trans, { children: "Announcement" }) })] }) }));
}
