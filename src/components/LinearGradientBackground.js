import { jsx as _jsx } from "react/jsx-runtime";
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '#/alf/tokens';
export function LinearGradientBackground(_a) {
    var style = _a.style, _b = _a.gradient, gradient = _b === void 0 ? 'sky' : _b, children = _a.children, start = _a.start, end = _a.end;
    var colors = gradients[gradient].values.map(function (_a) {
        var _ = _a[0], color = _a[1];
        return color;
    });
    if (gradient.length < 2) {
        throw new Error('Gradient must have at least 2 colors');
    }
    return (_jsx(LinearGradient, { colors: colors, style: style, start: start, end: end, children: children }));
}
