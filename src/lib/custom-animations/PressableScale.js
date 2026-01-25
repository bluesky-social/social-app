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
import { Pressable, } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, } from 'react-native-reanimated';
import { IS_NATIVE, IS_WEB_TOUCH_DEVICE } from '#/env';
var DEFAULT_TARGET_SCALE = IS_NATIVE || IS_WEB_TOUCH_DEVICE ? 0.98 : 1;
var AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function PressableScale(_a) {
    var _b = _a.targetScale, targetScale = _b === void 0 ? DEFAULT_TARGET_SCALE : _b, children = _a.children, style = _a.style, onPressIn = _a.onPressIn, onPressOut = _a.onPressOut, rest = __rest(_a, ["targetScale", "children", "style", "onPressIn", "onPressOut"]);
    var reducedMotion = useReducedMotion();
    var scale = useSharedValue(1);
    var animatedStyle = useAnimatedStyle(function () { return ({
        transform: [{ scale: scale.get() }],
    }); });
    return (_jsx(AnimatedPressable, __assign({ accessibilityRole: "button", onPressIn: function (e) {
            if (onPressIn) {
                onPressIn(e);
            }
            cancelAnimation(scale);
            scale.set(function () { return withTiming(targetScale, { duration: 100 }); });
        }, onPressOut: function (e) {
            if (onPressOut) {
                onPressOut(e);
            }
            cancelAnimation(scale);
            scale.set(function () { return withTiming(1, { duration: 100 }); });
        }, style: [!reducedMotion && animatedStyle, style] }, rest, { children: children })));
}
