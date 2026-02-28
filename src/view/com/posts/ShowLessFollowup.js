import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme } from '#/alf';
import { CircleCheck_Stroke2_Corner0_Rounded } from '#/components/icons/CircleCheck';
import { Text } from '#/components/Typography';
export function ShowLessFollowup() {
    var t = useTheme();
    return (_jsx(View, { style: [
            t.atoms.border_contrast_low,
            a.border_t,
            t.atoms.bg_contrast_25,
            a.p_sm,
        ], children: _jsxs(View, { style: [
                t.atoms.bg,
                t.atoms.border_contrast_low,
                a.border,
                a.rounded_sm,
                a.p_md,
                a.flex_row,
                a.gap_sm,
            ], children: [_jsx(CircleCheck_Stroke2_Corner0_Rounded, { style: [t.atoms.text_contrast_low], size: "sm" }), _jsx(Text, { style: [
                        a.flex_1,
                        a.text_sm,
                        t.atoms.text_contrast_medium,
                        a.leading_snug,
                    ], children: _jsx(Trans, { children: "Thank you for your feedback! It has been sent to the feed operator." }) })] }) }));
}
