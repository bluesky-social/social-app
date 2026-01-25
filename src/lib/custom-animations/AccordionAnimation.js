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
import { View, } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';
import { IS_IOS, IS_WEB } from '#/env';
function WebAccordion(_a) {
    var isExpanded = _a.isExpanded, _b = _a.duration, duration = _b === void 0 ? 300 : _b, style = _a.style, children = _a.children;
    var heightValue = useSharedValue(0);
    var animatedStyle = useAnimatedStyle(function () {
        var targetHeight = isExpanded ? heightValue.get() : 0;
        return {
            height: withTiming(targetHeight, {
                duration: duration,
                easing: Easing.out(Easing.cubic),
            }),
            overflow: 'hidden',
        };
    });
    var onLayout = function (e) {
        if (heightValue.get() === 0) {
            heightValue.set(e.nativeEvent.layout.height);
        }
    };
    return (_jsx(Animated.View, { style: [animatedStyle, style], children: _jsx(View, { onLayout: onLayout, children: children }) }));
}
function MobileAccordion(_a) {
    var isExpanded = _a.isExpanded, _b = _a.duration, duration = _b === void 0 ? 200 : _b, style = _a.style, children = _a.children;
    if (!isExpanded)
        return null;
    return (_jsx(Animated.View, { style: style, entering: FadeInUp.duration(duration), exiting: FadeOutUp.duration(duration / 2), pointerEvents: IS_IOS ? 'auto' : 'box-none', children: children }));
}
export function AccordionAnimation(props) {
    return IS_WEB ? _jsx(WebAccordion, __assign({}, props)) : _jsx(MobileAccordion, __assign({}, props));
}
