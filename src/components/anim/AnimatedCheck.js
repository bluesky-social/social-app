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
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming, } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useCommonSVGProps } from '#/components/icons/common';
var AnimatedPath = Animated.createAnimatedComponent(Path);
var AnimatedCircle = Animated.createAnimatedComponent(Circle);
var PATH = 'M14.1 27.2l7.1 7.2 16.7-16.8';
export var AnimatedCheck = React.forwardRef(function AnimatedCheck(_a, ref) {
    var playOnMount = _a.playOnMount, props = __rest(_a, ["playOnMount"]);
    var _b = useCommonSVGProps(props), fill = _b.fill, size = _b.size, style = _b.style, rest = __rest(_b, ["fill", "size", "style"]);
    var circleAnim = useSharedValue(0);
    var checkAnim = useSharedValue(0);
    var circleAnimatedProps = useAnimatedProps(function () { return ({
        strokeDashoffset: 166 - circleAnim.get() * 166,
    }); });
    var checkAnimatedProps = useAnimatedProps(function () { return ({
        strokeDashoffset: 48 - 48 * checkAnim.get(),
    }); });
    var play = React.useCallback(function (cb) {
        circleAnim.set(0);
        checkAnim.set(0);
        circleAnim.set(function () {
            return withTiming(1, { duration: 500, easing: Easing.linear });
        });
        checkAnim.set(function () {
            return withDelay(500, withTiming(1, { duration: 300, easing: Easing.linear }, cb));
        });
    }, [circleAnim, checkAnim]);
    React.useImperativeHandle(ref, function () { return ({
        play: play,
    }); });
    React.useEffect(function () {
        if (playOnMount) {
            play();
        }
    }, [play, playOnMount]);
    return (_jsxs(Svg, __assign({ fill: "none" }, rest, { viewBox: "0 0 52 52", width: size, height: size, style: style, children: [_jsx(AnimatedCircle, { animatedProps: circleAnimatedProps, cx: "26", cy: "26", r: "24", fill: "none", stroke: fill, strokeWidth: 4, strokeDasharray: 166 }), _jsx(AnimatedPath, { animatedProps: checkAnimatedProps, stroke: fill, d: PATH, strokeWidth: 4, strokeDasharray: 48 })] })));
});
