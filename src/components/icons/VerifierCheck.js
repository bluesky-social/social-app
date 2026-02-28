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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useCommonSVGProps } from '#/components/icons/common';
export var VerifierCheck = React.forwardRef(function LogoImpl(props, ref) {
    var _a = useCommonSVGProps(props), fill = _a.fill, size = _a.size, style = _a.style, rest = __rest(_a, ["fill", "size", "style"]);
    return (_jsxs(Svg, __assign({ fill: "none" }, rest, { ref: ref, viewBox: "0 0 24 24", width: size, height: size, style: [style], children: [_jsx(Path, { fill: fill, fillRule: "evenodd", clipRule: "evenodd", d: "M8.792 1.615a4.154 4.154 0 0 1 6.416 0 4.154 4.154 0 0 0 3.146 1.515 4.154 4.154 0 0 1 4 5.017 4.154 4.154 0 0 0 .777 3.404 4.154 4.154 0 0 1-1.427 6.255 4.153 4.153 0 0 0-2.177 2.73 4.154 4.154 0 0 1-5.781 2.784 4.154 4.154 0 0 0-3.492 0 4.154 4.154 0 0 1-5.78-2.784 4.154 4.154 0 0 0-2.178-2.73A4.154 4.154 0 0 1 .87 11.551a4.154 4.154 0 0 0 .776-3.404A4.154 4.154 0 0 1 5.646 3.13a4.154 4.154 0 0 0 3.146-1.515Z" }), _jsx(Path, { fill: "#fff", fillRule: "evenodd", clipRule: "evenodd", d: "M17.861 8.26a1.438 1.438 0 0 1 0 2.033l-6.571 6.571a1.437 1.437 0 0 1-2.033 0L5.97 13.58a1.438 1.438 0 0 1 2.033-2.033l2.27 2.269 5.554-5.555a1.437 1.437 0 0 1 2.033 0Z" })] })));
});
