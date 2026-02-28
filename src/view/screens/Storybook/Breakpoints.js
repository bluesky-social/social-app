import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { H3, Text } from '#/components/Typography';
export function Breakpoints() {
    var t = useTheme();
    var breakpoints = useBreakpoints();
    return (_jsxs(View, { children: [_jsx(H3, { style: [a.pb_md], children: "Breakpoint Debugger" }), _jsxs(Text, { style: [a.pb_md], children: ["Current breakpoint: ", !breakpoints.gtMobile && _jsx(Text, { children: "mobile" }), breakpoints.gtMobile && !breakpoints.gtTablet && _jsx(Text, { children: "tablet" }), breakpoints.gtTablet && _jsx(Text, { children: "desktop" })] }), _jsx(Text, { style: [a.p_md, t.atoms.bg_contrast_100, { fontFamily: 'monospace' }], children: JSON.stringify(breakpoints, null, 2) })] }));
}
