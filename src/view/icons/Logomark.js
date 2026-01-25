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
import Svg, { Path } from 'react-native-svg';
import { usePalette } from '#/lib/hooks/usePalette';
var ratio = 54 / 61;
export function Logomark(_a) {
    var fill = _a.fill, rest = __rest(_a, ["fill"]);
    var pal = usePalette('default');
    // @ts-ignore it's fiiiiine
    var size = parseInt(rest.width || 32);
    return (_jsx(Svg, __assign({ fill: "none", viewBox: "0 0 61 54" }, rest, { width: size, height: Number(size) * ratio, children: _jsx(Path, { fill: fill || pal.text.color, d: "M13.223 3.602C20.215 8.832 27.738 19.439 30.5 25.13c2.762-5.691 10.284-16.297 17.278-21.528C52.824-.172 61-3.093 61 6.2c0 1.856-1.068 15.59-1.694 17.82-2.178 7.752-10.112 9.73-17.17 8.532 12.337 2.092 15.475 9.021 8.697 15.95-12.872 13.159-18.5-3.302-19.943-7.52-.264-.773-.388-1.135-.39-.827-.002-.308-.126.054-.39.827-1.442 4.218-7.071 20.679-19.943 7.52-6.778-6.929-3.64-13.858 8.697-15.95-7.058 1.197-14.992-.78-17.17-8.532C1.068 21.79 0 8.056 0 6.2 0-3.093 8.176-.172 13.223 3.602Z" }) })));
}
