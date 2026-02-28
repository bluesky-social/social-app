var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { Pressable } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedProps, useAnimatedStyle, } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { useContextMenuContext } from './context';
var AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
export function Backdrop(props) {
    var mode = useContextMenuContext().mode;
    switch (mode) {
        case 'full':
            return _jsx(BlurredBackdrop, __assign({}, props));
        case 'auxiliary-only':
            return _jsx(OpacityBackdrop, __assign({}, props));
    }
}
function BlurredBackdrop(_a) {
    var animation = _a.animation, _b = _a.intensity, intensity = _b === void 0 ? 50 : _b, onPress = _a.onPress;
    var _ = useLingui()._;
    var animatedProps = useAnimatedProps(function () { return ({
        intensity: interpolate(animation.get(), [0, 1], [0, intensity], Extrapolation.CLAMP),
    }); });
    return (_jsx(AnimatedBlurView, { animatedProps: animatedProps, style: [a.absolute, a.inset_0], tint: "systemMaterialDark", children: _jsx(Pressable, { style: a.flex_1, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close menu"], ["Close menu"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Tap to close context menu"], ["Tap to close context menu"])))), onPress: onPress }) }));
}
function OpacityBackdrop(_a) {
    var animation = _a.animation, onPress = _a.onPress;
    var t = useTheme();
    var _ = useLingui()._;
    var animatedStyle = useAnimatedStyle(function () { return ({
        opacity: interpolate(animation.get(), [0, 1], [0, 0.05], Extrapolation.CLAMP),
    }); });
    return (_jsx(Animated.View, { style: [a.absolute, a.inset_0, t.atoms.bg_contrast_975, animatedStyle], children: _jsx(Pressable, { style: a.flex_1, accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Close menu"], ["Close menu"])))), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Tap to close context menu"], ["Tap to close context menu"])))), onPress: onPress }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
