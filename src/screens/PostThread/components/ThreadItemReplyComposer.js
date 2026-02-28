import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import * as Skele from '#/components/Skeleton';
export function ThreadItemReplyComposerSkeleton() {
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    if (!gtMobile)
        return null;
    return (_jsx(View, { style: [a.px_sm, a.py_xs, a.border_t, t.atoms.border_contrast_low], children: _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm, a.px_sm, a.py_sm], children: [_jsx(Skele.Circle, { size: 24 }), _jsx(Skele.Text, { style: [a.text_md, { maxWidth: 119 }] })] }) }));
}
