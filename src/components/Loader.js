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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, } from 'react-native-reanimated';
import { atoms as a, useTheme } from '#/alf';
import { useCommonSVGProps } from '#/components/icons/common';
import { Loader_Stroke2_Corner0_Rounded as Icon } from '#/components/icons/Loader';
export function Loader(props) {
    var t = useTheme();
    var common = useCommonSVGProps(props);
    var rotation = useSharedValue(0);
    var animatedStyles = useAnimatedStyle(function () { return ({
        transform: [{ rotate: rotation.get() + 'deg' }],
    }); });
    React.useEffect(function () {
        rotation.set(function () {
            return withRepeat(withTiming(360, { duration: 500, easing: Easing.linear }), -1);
        });
    }, [rotation]);
    return (_jsx(Animated.View, { style: [
            a.relative,
            a.justify_center,
            a.align_center,
            { width: common.size, height: common.size },
            animatedStyles,
        ], children: _jsx(Icon, __assign({}, props, { style: [a.absolute, a.inset_0, t.atoms.text_contrast_high, props.style] })) }));
}
