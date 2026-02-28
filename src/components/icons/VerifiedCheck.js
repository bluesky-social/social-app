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
import Svg, { Circle, Path } from 'react-native-svg';
import { useCommonSVGProps } from '#/components/icons/common';
export var VerifiedCheck = React.forwardRef(function LogoImpl(props, ref) {
    var _a = useCommonSVGProps(props), fill = _a.fill, size = _a.size, style = _a.style, rest = __rest(_a, ["fill", "size", "style"]);
    return (_jsxs(Svg, __assign({ fill: "none" }, rest, { ref: ref, viewBox: "0 0 24 24", width: size, height: size, style: [style], children: [_jsx(Circle, { cx: "12", cy: "12", r: "11.5", fill: fill }), _jsx(Path, { fill: "#fff", fillRule: "evenodd", clipRule: "evenodd", d: "M17.659 8.175a1.361 1.361 0 0 1 0 1.925l-6.224 6.223a1.361 1.361 0 0 1-1.925 0L6.4 13.212a1.361 1.361 0 0 1 1.925-1.925l2.149 2.148 5.26-5.26a1.361 1.361 0 0 1 1.925 0Z" })] })));
});
