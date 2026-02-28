import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import * as Progress from 'react-native-progress';
import { atoms as a, useTheme } from '#/alf';
import { AnimatedCheck } from '../anim/AnimatedCheck';
import { Text } from '../Typography';
export function ProgressGuideTask(_a) {
    var current = _a.current, total = _a.total, title = _a.title, subtitle = _a.subtitle, tabularNumsTitle = _a.tabularNumsTitle;
    var t = useTheme();
    return (_jsxs(View, { style: [a.flex_row, a.gap_sm, !subtitle && a.align_center], children: [current === total ? (_jsx(AnimatedCheck, { playOnMount: true, fill: t.palette.primary_500, width: 20 })) : (_jsx(Progress.Circle, { progress: current / total, color: t.palette.primary_400, size: 20, thickness: 3, borderWidth: 0, unfilledColor: t.palette.contrast_100 })), _jsxs(View, { style: [a.flex_col, a.gap_xs, subtitle && { marginTop: -2 }], children: [_jsx(Text, { style: [
                            a.text_sm,
                            a.font_semi_bold,
                            a.leading_tight,
                            tabularNumsTitle && { fontVariant: ['tabular-nums'] },
                        ], children: title }), subtitle && (_jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium, a.leading_tight], children: subtitle }))] })] }));
}
