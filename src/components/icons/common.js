var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { StyleSheet } from 'react-native';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { nanoid } from 'nanoid/non-secure';
import { tokens, useTheme } from '#/alf';
export var sizes = {
    '2xs': 8,
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 48,
};
export function useCommonSVGProps(props) {
    var t = useTheme();
    var fill = props.fill, size = props.size, gradient = props.gradient, rest = __rest(props, ["fill", "size", "gradient"]);
    var style = StyleSheet.flatten(rest.style);
    var _size = Number(size ? sizes[size] : rest.width || sizes.md);
    var _fill = fill || (style === null || style === void 0 ? void 0 : style.color) || t.palette.primary_500;
    var gradientDef = null;
    if (gradient && tokens.gradients[gradient]) {
        var id = gradient + '_' + nanoid();
        var config = tokens.gradients[gradient];
        _fill = "url(#".concat(id, ")");
        gradientDef = (_jsx(Defs, { children: _jsx(LinearGradient, { id: id, x1: "0", y1: "0", x2: "100%", y2: "0", gradientTransform: "rotate(45)", children: config.values.map(function (_a) {
                    var stop = _a[0], fill = _a[1];
                    return (_jsx(Stop, { offset: stop, stopColor: fill }, stop));
                }) }) }));
    }
    return __assign({ fill: _fill, size: _size, style: style, gradient: gradientDef }, rest);
}
