import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRight } from '#/components/icons/Arrow';
import { CalendarDays_Stroke2_Corner0_Rounded as CalendarDays } from '#/components/icons/CalendarDays';
import { Globe_Stroke2_Corner0_Rounded as Globe } from '#/components/icons/Globe';
import { Loader } from '#/components/Loader';
import { H1 } from '#/components/Typography';
export function Icons() {
    var t = useTheme();
    return (_jsxs(View, { style: [a.gap_md], children: [_jsx(H1, { children: "Icons" }), _jsxs(View, { style: [a.flex_row, a.gap_xl], children: [_jsx(Globe, { size: "xs", fill: t.atoms.text.color }), _jsx(Globe, { size: "sm", fill: t.atoms.text.color }), _jsx(Globe, { size: "md", fill: t.atoms.text.color }), _jsx(Globe, { size: "lg", fill: t.atoms.text.color }), _jsx(Globe, { size: "xl", fill: t.atoms.text.color })] }), _jsxs(View, { style: [a.flex_row, a.gap_xl], children: [_jsx(ArrowTopRight, { size: "xs", fill: t.atoms.text.color }), _jsx(ArrowTopRight, { size: "sm", fill: t.atoms.text.color }), _jsx(ArrowTopRight, { size: "md", fill: t.atoms.text.color }), _jsx(ArrowTopRight, { size: "lg", fill: t.atoms.text.color }), _jsx(ArrowTopRight, { size: "xl", fill: t.atoms.text.color })] }), _jsxs(View, { style: [a.flex_row, a.gap_xl], children: [_jsx(CalendarDays, { size: "xs", fill: t.atoms.text.color }), _jsx(CalendarDays, { size: "sm", fill: t.atoms.text.color }), _jsx(CalendarDays, { size: "md", fill: t.atoms.text.color }), _jsx(CalendarDays, { size: "lg", fill: t.atoms.text.color }), _jsx(CalendarDays, { size: "xl", fill: t.atoms.text.color })] }), _jsxs(View, { style: [a.flex_row, a.gap_xl], children: [_jsx(Loader, { size: "xs", fill: t.atoms.text.color }), _jsx(Loader, { size: "sm", fill: t.atoms.text.color }), _jsx(Loader, { size: "md", fill: t.atoms.text.color }), _jsx(Loader, { size: "lg", fill: t.atoms.text.color }), _jsx(Loader, { size: "xl", fill: t.atoms.text.color })] }), _jsxs(View, { style: [a.flex_row, a.gap_xl], children: [_jsx(Globe, { size: "xs", gradient: "sky" }), _jsx(Globe, { size: "sm", gradient: "sky" }), _jsx(Globe, { size: "md", gradient: "sky" }), _jsx(Globe, { size: "lg", gradient: "sky" }), _jsx(Globe, { size: "xl", gradient: "sky" })] })] }));
}
