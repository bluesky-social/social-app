var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { Pressable } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, } from 'react-native-reanimated';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { useContextMenuContext } from './context';
export function Backdrop(_a) {
    var animation = _a.animation, _b = _a.intensity, intensity = _b === void 0 ? 50 : _b, onPress = _a.onPress;
    var t = useTheme();
    var _ = useLingui()._;
    var mode = useContextMenuContext().mode;
    var reduced = mode === 'auxiliary-only';
    var target = reduced ? 0.05 : intensity / 100;
    var animatedStyle = useAnimatedStyle(function () { return ({
        opacity: interpolate(animation.get(), [0, 1], [0, target], Extrapolation.CLAMP),
    }); });
    return (_jsx(Animated.View, { style: [a.absolute, a.inset_0, t.atoms.bg_contrast_975, animatedStyle], children: _jsx(Pressable, { style: a.flex_1, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close menu"], ["Close menu"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Tap to close context menu"], ["Tap to close context menu"])))), onPress: onPress }) }));
}
var templateObject_1, templateObject_2;
