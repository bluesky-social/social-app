import { jsx as _jsx } from "react/jsx-runtime";
import { LinearGradient } from 'expo-linear-gradient';
import { atoms as a } from '#/alf';
export function GradientFill(_a) {
    var gradient = _a.gradient, style = _a.style;
    if (gradient.values.length < 2) {
        throw new Error('Gradient must have at least 2 colors');
    }
    return (_jsx(LinearGradient, { colors: gradient.values.map(function (c) { return c[1]; }), locations: gradient.values.map(function (c) { return c[0]; }), start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: [a.absolute, a.inset_0, style] }));
}
