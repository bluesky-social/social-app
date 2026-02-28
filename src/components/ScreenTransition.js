import { jsx as _jsx } from "react/jsx-runtime";
import Animated, { Easing, FadeIn, FadeOut, SlideInLeft, SlideInRight, } from 'react-native-reanimated';
import { IS_WEB } from '#/env';
export function ScreenTransition(_a) {
    var direction = _a.direction, style = _a.style, children = _a.children, enabledWeb = _a.enabledWeb;
    var entering = direction === 'Forward'
        ? SlideInRight.easing(Easing.out(Easing.exp))
        : SlideInLeft.easing(Easing.out(Easing.exp));
    var webEntering = enabledWeb ? FadeIn.duration(90) : undefined;
    var exiting = FadeOut.duration(90); // Totally vibes based
    var webExiting = enabledWeb ? FadeOut.duration(90) : undefined;
    return (_jsx(Animated.View, { entering: IS_WEB ? webEntering : entering, exiting: IS_WEB ? webExiting : exiting, style: style, children: children }));
}
