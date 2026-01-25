import { jsx as _jsx } from "react/jsx-runtime";
import { LinearGradient } from 'expo-linear-gradient';
import { atoms as a, useTheme, utils } from '#/alf';
/**
 * A gradient overlay using the primary color at low opacity. This component is
 * absolutely positioned and intended to be composed within other components,
 * with optional styling allowed, such as adjusting border radius.
 */
export function Gradient(_a) {
    var style = _a.style;
    var t = useTheme();
    return (_jsx(LinearGradient, { colors: [
            utils.alpha(t.palette.primary_500, 0.2),
            utils.alpha(t.palette.primary_500, 0.1),
        ], locations: [0, 1], start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, style: [a.absolute, a.inset_0, style] }));
}
