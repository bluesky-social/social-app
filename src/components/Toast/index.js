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
import { View } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import { toast as sonner, Toaster } from 'sonner-native';
import { atoms as a } from '#/alf';
import { DURATION } from '#/components/Toast/const';
import { Icon as ToastIcon, Outer as BaseOuter, Text as ToastText, ToastConfigProvider, } from '#/components/Toast/Toast';
export { DURATION } from '#/components/Toast/const';
export { Action, Icon, Text, ToastConfigProvider } from '#/components/Toast/Toast';
/**
 * Toasts are rendered in a global outlet, which is placed at the top of the
 * component tree.
 */
export function ToastOutlet() {
    return _jsx(Toaster, { pauseWhenPageIsHidden: true, gap: a.gap_sm.gap });
}
export function Outer(_a) {
    var children = _a.children;
    return (_jsx(View, { style: [a.px_xl, a.w_full], children: _jsx(BaseOuter, { children: children }) }));
}
/**
 * Access the full Sonner API
 */
export var api = sonner;
/**
 * Our base toast API, using the `Toast` export of this file.
 */
export function show(content, _a) {
    var _b, _c;
    if (_a === void 0) { _a = {}; }
    var _d = _a.type, type = _d === void 0 ? 'default' : _d, options = __rest(_a, ["type"]);
    var id = nanoid();
    if (typeof content === 'string') {
        sonner.custom(_jsx(ToastConfigProvider, { id: id, type: type, children: _jsxs(Outer, { children: [_jsx(ToastIcon, {}), _jsx(ToastText, { children: content })] }) }), __assign(__assign({}, options), { id: id, duration: (_b = options === null || options === void 0 ? void 0 : options.duration) !== null && _b !== void 0 ? _b : DURATION }));
    }
    else if (React.isValidElement(content)) {
        sonner.custom(_jsx(ToastConfigProvider, { id: id, type: type, children: content }), __assign(__assign({}, options), { id: id, duration: (_c = options === null || options === void 0 ? void 0 : options.duration) !== null && _c !== void 0 ? _c : DURATION }));
    }
    else {
        throw new Error("Toast can be a string or a React element, got ".concat(typeof content));
    }
}
