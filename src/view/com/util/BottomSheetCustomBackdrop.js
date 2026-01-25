var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, } from 'react-native-reanimated';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
export function createCustomBackdrop(onClose) {
    var CustomBackdrop = function (_a) {
        var animatedIndex = _a.animatedIndex, style = _a.style;
        var _ = useLingui()._;
        // animated variables
        var opacity = useAnimatedStyle(function () { return ({
            opacity: interpolate(animatedIndex.get(), // current snap index
            [-1, 0], // input range
            [0, 0.5], // output range
            Extrapolation.CLAMP),
        }); });
        var containerStyle = useMemo(function () { return [style, { backgroundColor: '#000' }, opacity]; }, [style, opacity]);
        return (_jsx(TouchableWithoutFeedback, { onPress: onClose, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close bottom drawer"], ["Close bottom drawer"])))), accessibilityHint: "", onAccessibilityEscape: function () {
                if (onClose !== undefined) {
                    onClose();
                }
            }, children: _jsx(Animated.View, { style: containerStyle }) }));
    };
    return CustomBackdrop;
}
var templateObject_1;
