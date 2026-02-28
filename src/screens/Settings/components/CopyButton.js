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
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeOutUp, useReducedMotion, ZoomIn, } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { Text } from '#/components/Typography';
export function CopyButton(_a) {
    var style = _a.style, value = _a.value, onPressProp = _a.onPress, props = __rest(_a, ["style", "value", "onPress"]);
    var _b = useState(false), hasBeenCopied = _b[0], setHasBeenCopied = _b[1];
    var t = useTheme();
    var isReducedMotionEnabled = useReducedMotion();
    useEffect(function () {
        if (hasBeenCopied) {
            var timeout_1 = setTimeout(function () { return setHasBeenCopied(false); }, isReducedMotionEnabled ? 2000 : 100);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [hasBeenCopied, isReducedMotionEnabled]);
    var onPress = useCallback(function (evt) {
        Clipboard.setStringAsync(value);
        setHasBeenCopied(true);
        onPressProp === null || onPressProp === void 0 ? void 0 : onPressProp(evt);
    }, [value, onPressProp]);
    return (_jsxs(View, { style: [a.relative], children: [hasBeenCopied && (_jsx(Animated.View, { entering: ZoomIn.duration(100), exiting: FadeOutUp.duration(2000), style: [
                    a.absolute,
                    { bottom: '100%', right: 0 },
                    a.justify_center,
                    a.gap_sm,
                    a.z_10,
                    a.pb_sm,
                ], pointerEvents: "none", children: _jsx(Text, { style: [
                        a.font_medium,
                        a.text_right,
                        a.text_sm,
                        t.atoms.text_contrast_high,
                    ], children: _jsx(Trans, { children: "Copied!" }) }) })), _jsx(Button, __assign({ style: [a.flex_1, a.justify_between, style], onPress: onPress }, props))] }));
}
