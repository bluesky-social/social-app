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
import Svg, { Defs, LinearGradient, Path, Stop, } from 'react-native-svg';
import { Image } from 'expo-image';
import { useKawaiiMode } from '#/state/preferences/kawaii';
import { flatten, useTheme } from '#/alf';
var ratio = 57 / 64;
export var Logo = React.forwardRef(function LogoImpl(props, ref) {
    var t = useTheme();
    var fill = props.fill, rest = __rest(props, ["fill"]);
    var gradient = fill === 'sky';
    var styles = flatten(props.style);
    var _fill = gradient
        ? 'url(#sky)'
        : fill || (styles === null || styles === void 0 ? void 0 : styles.color) || t.palette.primary_500;
    // @ts-ignore it's fiiiiine
    var size = parseInt(rest.width || 32, 10);
    var isKawaii = useKawaiiMode();
    if (isKawaii) {
        return (_jsx(Image, { source: size > 100
                ? require('../../../assets/kawaii.png')
                : require('../../../assets/kawaii_smol.png'), accessibilityLabel: "Bluesky", accessibilityHint: "", accessibilityIgnoresInvertColors: true, style: [{ height: size, aspectRatio: 1.4 }] }));
    }
    return (_jsxs(Svg, __assign({ fill: "none", 
        // @ts-ignore it's fiiiiine
        ref: ref, viewBox: "0 0 64 57" }, rest, { style: [{ width: size, height: size * ratio }, styles], children: [gradient && (_jsx(Defs, { children: _jsxs(LinearGradient, { id: "sky", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx(Stop, { offset: "0", stopColor: "#0A7AFF", stopOpacity: "1" }), _jsx(Stop, { offset: "1", stopColor: "#59B9FF", stopOpacity: "1" })] }) })), _jsx(Path, { fill: _fill, d: "M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z" })] })));
});
